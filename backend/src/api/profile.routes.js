import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

// Ho so ca nhan: thong tin, doi mat khau, so dia chi giao hang
const router = Router();
router.use(requireAuth);

const idParam = z.coerce.number().int().positive();

// So dien thoai Viet Nam: dung 10 so, dau 03/05/07/08/09; chap nhan +84.
// Bo dau cach / cham / gach ngang va luu thong nhat dang 0xxxxxxxxx.
const PHONE_RE = /^0[35789]\d{8}$/;
const normalizePhone = (v) => String(v || '').replace(/[\s.()-]/g, '').replace(/^\+?84/, '0');
const phoneSchema = z.string().transform(normalizePhone).refine((v) => PHONE_RE.test(v), { message: 'invalid_phone' });
// Tra ma loi rieng cho so dien thoai de giao dien hien thong bao ro rang
function phoneError(e, res) {
  if (e?.name === 'ZodError' && e.issues.some((i) => i.message === 'invalid_phone')) { res.status(400).json({ error: 'invalid_phone' }); return true; }
  return false;
}
const addressSchema = z.object({
  recipientName: z.string().trim().min(1).max(100),
  phone: phoneSchema,
  addressLine: z.string().trim().min(1).max(255),
  ward: z.string().trim().max(100).optional().default(''),
  district: z.string().trim().max(100).optional().default(''),
  city: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional().default(false),
});

async function listAddresses(userId) {
  const [rows] = await db.execute(
    'SELECT id,recipient_name,phone,address_line,ward,district,city,is_default FROM user_addresses WHERE user_id=? ORDER BY is_default DESC,id',
    [userId]
  );
  return rows;
}

router.get('/', async (req, res, next) => {
  try {
    const uid = req.user.sub;
    const [[user]] = await db.execute("SELECT id,email,display_name,phone,role,created_at,last_login_at FROM users WHERE id=? AND status='active'", [uid]);
    if (!user) return res.status(404).json({ error: 'user_not_found' });
    const [[stats]] = await db.execute(
      `SELECT (SELECT COUNT(*) FROM orders WHERE user_id=?) AS orders,
              (SELECT COUNT(*) FROM game_library WHERE user_id=? AND status='active') AS games,
              (SELECT COALESCE(points_balance,0) FROM loyalty_accounts WHERE user_id=?) AS points,
              (SELECT tier FROM loyalty_accounts WHERE user_id=?) AS tier`,
      [uid, uid, uid, uid]
    );
    res.json({ user, stats: { ...stats, points: stats.points || 0, tier: stats.tier || 'bronze' }, addresses: await listAddresses(uid) });
  } catch (e) { if (!phoneError(e, res)) next(e); }
});

router.put('/', async (req, res, next) => {
  try {
    const data = z.object({
      displayName: z.string().trim().min(1).max(100),
      phone: z.string().optional().default('').transform(normalizePhone).refine((v) => v === '' || PHONE_RE.test(v), { message: 'invalid_phone' }),
    }).parse(req.body);
    await db.execute('UPDATE users SET display_name=?,phone=? WHERE id=?', [data.displayName, data.phone || null, req.user.sub]);
    res.json({ ok: true });
  } catch (e) { if (!phoneError(e, res)) next(e); }
});

router.put('/password', async (req, res, next) => {
  try {
    const data = z.object({
      currentPassword: z.string().min(1).max(100),
      newPassword: z.string().min(10).max(100),
    }).parse(req.body);
    const [[user]] = await db.execute('SELECT password_hash FROM users WHERE id=?', [req.user.sub]);
    if (!user || !await bcrypt.compare(data.currentPassword, user.password_hash)) return res.status(400).json({ error: 'wrong_password' });
    await db.execute('UPDATE users SET password_hash=? WHERE id=?', [await bcrypt.hash(data.newPassword, 12), req.user.sub]);
    res.json({ ok: true });
  } catch (e) { if (!phoneError(e, res)) next(e); }
});

// Luu dia chi; neu la mac dinh (hoac la dia chi dau tien) thi bo mac dinh cac dia chi khac
async function saveAddress(userId, data, id) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[{ count }]] = await conn.execute('SELECT COUNT(*) AS count FROM user_addresses WHERE user_id=?', [userId]);
    const isDefault = data.isDefault || (!id && count === 0);
    if (isDefault) await conn.execute('UPDATE user_addresses SET is_default=FALSE WHERE user_id=?', [userId]);
    const values = [data.recipientName, data.phone, data.addressLine, data.ward || null, data.district || null, data.city];
    let ok = true, savedId = id;
    if (id) {
      const [r] = await conn.execute(
        `UPDATE user_addresses SET recipient_name=?,phone=?,address_line=?,ward=?,district=?,city=?${isDefault ? ',is_default=TRUE' : ''} WHERE id=? AND user_id=?`,
        [...values, id, userId]
      );
      ok = r.affectedRows > 0;
    } else {
      const [r] = await conn.execute(
        'INSERT INTO user_addresses(recipient_name,phone,address_line,ward,district,city,is_default,user_id) VALUES(?,?,?,?,?,?,?,?)',
        [...values, isDefault, userId]
      );
      savedId = r.insertId;
    }
    if (!ok) { await conn.rollback(); return false; }
    await conn.commit();
    return savedId;
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}

// So sanh 2 dia chi: bo khoang trang thua, khong phan biet hoa/thuong
const same = (a, b) => String(a || '').trim().replace(/\s+/g, ' ').toLowerCase() === String(b || '').trim().replace(/\s+/g, ' ').toLowerCase();
const isSameAddress = (row, d) => same(row.recipient_name, d.recipientName) && same(row.phone, d.phone) && same(row.address_line, d.addressLine)
  && same(row.ward, d.ward) && same(row.district, d.district) && same(row.city, d.city);

// Them dia chi. Neu trung het 1 dia chi da luu thi dung lai dia chi cu (khong tao ban trung).
// Tra ve addressId de trang thanh toan chon ngay dia chi vua them.
router.post('/addresses', async (req, res, next) => {
  try {
    const data = addressSchema.parse(req.body), uid = req.user.sub;
    const existing = (await listAddresses(uid)).find((row) => isSameAddress(row, data));
    if (existing) {
      if (data.isDefault && !existing.is_default) await saveAddress(uid, { ...data, isDefault: true }, existing.id);
      return res.json({ addresses: await listAddresses(uid), addressId: existing.id, duplicate: true });
    }
    const [[{ count }]] = await db.execute('SELECT COUNT(*) AS count FROM user_addresses WHERE user_id=?', [uid]);
    if (count >= 10) return res.status(409).json({ error: 'too_many_addresses' });
    const addressId = await saveAddress(uid, data);
    res.status(201).json({ addresses: await listAddresses(uid), addressId, duplicate: false });
  } catch (e) { if (!phoneError(e, res)) next(e); }
});

router.put('/addresses/:id', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id), data = addressSchema.parse(req.body);
    if (!await saveAddress(req.user.sub, data, id)) return res.status(404).json({ error: 'address_not_found' });
    res.json({ addresses: await listAddresses(req.user.sub) });
  } catch (e) { if (!phoneError(e, res)) next(e); }
});

router.delete('/addresses/:id', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id), uid = req.user.sub;
    const [[addr]] = await db.execute('SELECT is_default FROM user_addresses WHERE id=? AND user_id=?', [id, uid]);
    if (!addr) return res.status(404).json({ error: 'address_not_found' });
    await db.execute('DELETE FROM user_addresses WHERE id=? AND user_id=?', [id, uid]);
    // Xoa dia chi mac dinh -> chon dia chi con lai dau tien lam mac dinh
    if (addr.is_default) await db.execute('UPDATE user_addresses SET is_default=TRUE WHERE user_id=? ORDER BY id LIMIT 1', [uid]);
    res.json({ addresses: await listAddresses(uid) });
  } catch (e) { if (!phoneError(e, res)) next(e); }
});

export default router;
