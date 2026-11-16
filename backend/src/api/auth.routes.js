import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db.js';
import env from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const registerSchema = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(100), displayName: z.string().trim().min(1).max(100) });
const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(100) });
function tokenFor(user) { return jwt.sign({ sub: String(user.id), role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }); }

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body), hash = await bcrypt.hash(data.password, 12);
    const [result] = await db.execute('INSERT INTO users(email,password_hash,display_name) VALUES(?,?,?)', [data.email.toLowerCase(), hash, data.displayName]);
    await db.execute('INSERT INTO loyalty_accounts(user_id) VALUES(?)', [result.insertId]);
    const user = { id: result.insertId, email: data.email.toLowerCase(), displayName: data.displayName, role: 'customer' };
    res.status(201).json({ user, token: tokenFor(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const [rows] = await db.execute("SELECT id,email,password_hash,display_name,role,status FROM users WHERE email=? LIMIT 1", [data.email.toLowerCase()]);
    const user = rows[0];
    if (!user || user.status !== 'active' || !await bcrypt.compare(data.password, user.password_hash)) return res.status(401).json({ error: 'invalid_credentials' });
    await db.execute('UPDATE users SET last_login_at=UTC_TIMESTAMP() WHERE id=?', [user.id]);
    res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role }, token: tokenFor(user) });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try { const [rows] = await db.execute("SELECT id,email,display_name,role,created_at FROM users WHERE id=? AND status='active'", [req.user.sub]); if (!rows[0]) return res.status(404).json({ error: 'user_not_found' }); res.json({ user: rows[0] }); }
  catch (e) { next(e); }
});

/* ===================== QUEN MAT KHAU (CHE DO DEMO) =====================
 * Khong gui email that: ma 6 so duoc in ra console backend va tra ve trong response
 * (chi khi NODE_ENV khac production) de hien tren man hinh.
 * Ma luu trong bo nho server (Map), chi luu ban bam SHA-256; restart server thi ma cu mat hieu luc.
 */
const RESET_TTL_MS = 15 * 60 * 1000, RESET_COOLDOWN_MS = 60 * 1000, RESET_MAX_ATTEMPTS = 5;
const resetCodes = new Map(); // email -> { userId, hash, expiresAt, sentAt, attempts }
const sha256 = (s) => crypto.createHash('sha256').update(s).digest();
setInterval(() => { const now = Date.now(); for (const [k, v] of resetCodes) if (v.expiresAt < now) resetCodes.delete(k); }, 5 * 60 * 1000).unref();

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = z.object({ email: z.string().email().max(254) }).parse(req.body).email.toLowerCase();
    const old = resetCodes.get(email);
    if (old && Date.now() - old.sentAt < RESET_COOLDOWN_MS) {
      return res.status(429).json({ error: 'reset_cooldown', retryAfter: Math.ceil((RESET_COOLDOWN_MS - (Date.now() - old.sentAt)) / 1000) });
    }
    const [[user]] = await db.execute("SELECT id FROM users WHERE email=? AND status='active' LIMIT 1", [email]);
    // Tra ve cung mot thong bao du email co ton tai hay khong
    const body = { ok: true, message: 'Nếu email đã đăng ký, mã xác nhận đã được gửi.', expiresInMinutes: RESET_TTL_MS / 60000 };
    if (user) {
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      resetCodes.set(email, { userId: user.id, hash: sha256(code), expiresAt: Date.now() + RESET_TTL_MS, sentAt: Date.now(), attempts: 0 });
      console.log(`[DEMO] Ma dat lai mat khau cho ${email}: ${code} (het han sau 15 phut)`);
      if (env.NODE_ENV !== 'production') body.demoCode = code;
    }
    res.json(body);
  } catch (e) { next(e); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const data = z.object({
      email: z.string().email().max(254),
      code: z.string().regex(/^\d{6}$/),
      newPassword: z.string().min(10).max(100),
    }).parse(req.body);
    const email = data.email.toLowerCase(), entry = resetCodes.get(email);
    if (!entry || entry.expiresAt < Date.now()) { resetCodes.delete(email); return res.status(400).json({ error: 'invalid_or_expired_code' }); }
    if (entry.attempts >= RESET_MAX_ATTEMPTS) { resetCodes.delete(email); return res.status(429).json({ error: 'too_many_attempts' }); }
    if (!crypto.timingSafeEqual(entry.hash, sha256(data.code))) {
      entry.attempts += 1;
      if (entry.attempts >= RESET_MAX_ATTEMPTS) { resetCodes.delete(email); return res.status(429).json({ error: 'too_many_attempts' }); }
      return res.status(400).json({ error: 'invalid_or_expired_code', attemptsLeft: RESET_MAX_ATTEMPTS - entry.attempts });
    }
    const [r] = await db.execute("UPDATE users SET password_hash=? WHERE id=? AND status='active'", [await bcrypt.hash(data.newPassword, 12), entry.userId]);
    resetCodes.delete(email); // ma chi dung duoc 1 lan
    if (!r.affectedRows) return res.status(400).json({ error: 'invalid_or_expired_code' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
export default router;
