import { Router } from 'express';
import { z } from 'zod';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Tat ca route trong file nay chi danh cho admin (hoac nhan vien - staff)
const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));

const idParam = z.coerce.number().int().positive();

// Chay mot ham trong transaction, tu rollback neu loi
async function inTransaction(work) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
class HttpError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
function sendError(res, next, e) {
  if (e instanceof HttpError) return res.status(e.status).json({ error: e.code });
  next(e);
}

// Tu dong bo sung role 'publisher' va 2 ticket ho tro mau neu database chua co
let initPromise = null;
function ensureAdminReady() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await db.execute("ALTER TABLE users MODIFY role ENUM('customer','publisher','staff','admin') NOT NULL DEFAULT 'customer'");
      } catch {}
      try {
        const [[row]] = await db.execute('SELECT COUNT(*) AS cnt FROM support_tickets');
        if (Number(row.cnt) === 0) {
          const [[u]] = await db.execute("SELECT id FROM users ORDER BY role='customer' DESC, id ASC LIMIT 1");
          const uid = u ? u.id : null;
          await db.execute(
            `INSERT INTO support_tickets(user_id, subject, message, status, priority) VALUES
             (?, 'Lỗi kích hoạt Key game số Hollow Knight: Silksong', 'Chào shop 5GUYS, mình vừa mua bản kỹ thuật số Hollow Knight: Silksong nhưng khi nhập mã Key 5GUYS-SILK-8829-X9A1 vào hệ thống DRM Safe thì báo lỗi chưa đồng bộ máy chủ. Nhờ Admin kiểm tra và kích hoạt lại Key giúp mình nhé!', 'open', 'high'),
             (?, 'Hỗ trợ đổi địa chỉ nhận đĩa PS5 Black Myth: Wukong', 'Shop ơi, mình có đặt mua đĩa vật lý Black Myth: Wukong (bản Blu-ray PS5 nguyên seal). Do tuần này mình chuyển chỗ làm nên muốn đổi địa chỉ nhận hàng sang Số 45 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM. Nhờ shop cập nhật giúp trước khi giao cho đơn vị vận chuyển ạ!', 'open', 'normal')`,
            [uid, uid]
          );
        }
      } catch {}
    })();
  }
  return initPromise;
}

/* ===================== THONG KE ===================== */
router.get('/stats', async (req, res, next) => {
  try {
    await ensureAdminReady();
    const [[revenue]] = await db.execute(
      "SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS paid_orders FROM orders WHERE status IN ('paid','processing','shipped','fulfilled')"
    );
    const [paidOrdersList] = await db.execute(
      `SELECT o.id, o.total, o.shipping_total,
              COALESCE(SUM(CASE WHEN oi.product_type='digital' THEN oi.line_total ELSE 0 END),0) AS dig_sub,
              COALESCE(SUM(CASE WHEN oi.product_type='physical' THEN oi.line_total ELSE 0 END),0) AS phy_sub
       FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
       WHERE o.status IN ('paid','processing','shipped','fulfilled')
       GROUP BY o.id`
    );
    let digitalRevenue = 0, physicalRevenue = 0;
    for (const o of paidOrdersList) {
      const tot = Number(o.total) || 0, ship = Number(o.shipping_total) || 0;
      const dig = Number(o.dig_sub) || 0, phy = Number(o.phy_sub) || 0;
      if (dig > 0 && phy === 0) digitalRevenue += tot;
      else if (phy > 0 && dig === 0) physicalRevenue += tot;
      else if (dig + phy > 0) {
        const rem = Math.max(0, tot - ship);
        const dShare = Math.round(rem * (dig / (dig + phy)));
        digitalRevenue += dShare;
        physicalRevenue += (tot - dShare);
      }
    }
    const [byStatus] = await db.execute('SELECT status, COUNT(*) AS count FROM orders GROUP BY status');
    const [[users]] = await db.execute("SELECT COUNT(*) AS count FROM users WHERE status='active'");
    const [[products]] = await db.execute("SELECT COUNT(*) AS count FROM products WHERE status='active'");
    const [[refunds]] = await db.execute("SELECT COUNT(*) AS count FROM refunds WHERE status='requested'");
    const [[tickets]] = await db.execute("SELECT COUNT(*) AS count FROM support_tickets WHERE status IN ('open','in_progress')");
    const [topProducts] = await db.execute(
      `SELECT oi.product_title AS title, oi.product_type, SUM(oi.quantity) AS sold, SUM(oi.line_total) AS revenue
       FROM order_items oi JOIN orders o ON o.id=oi.order_id
       WHERE o.status IN ('paid','processing','shipped','fulfilled')
       GROUP BY oi.product_title, oi.product_type ORDER BY revenue DESC LIMIT 5`
    );
    const [lowStock] = await db.execute(
      `SELECT p.id, p.title, p.platform, i.quantity_on_hand - i.quantity_reserved AS available
       FROM physical_inventory i JOIN products p ON p.id=i.product_id
       WHERE p.status='active' AND i.quantity_on_hand - i.quantity_reserved <= i.low_stock_threshold
       ORDER BY available LIMIT 10`
    );
    const [rawDaily] = await db.execute(
      `SELECT DATE_FORMAT(paid_at, '%Y-%m-%d') AS day, SUM(total) AS revenue, COUNT(*) AS orders FROM orders
       WHERE paid_at IS NOT NULL AND paid_at >= UTC_TIMESTAMP() - INTERVAL 14 DAY AND status <> 'refunded'
       GROUP BY DATE_FORMAT(paid_at, '%Y-%m-%d') ORDER BY day`
    );
    // Xay dung du 14 ngay lien tuc (nhung ngay khong co don co revenue = 0, orders = 0)
    const dayMap = new Map(rawDaily.map(d => [String(d.day).slice(0, 10), { revenue: Number(d.revenue) || 0, orders: Number(d.orders) || 0 }]));
    const nowLocal = new Date(Date.now() + 7 * 3600 * 1000);
    let endDate = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate()));
    for (const k of dayMap.keys()) {
      const dt = new Date(k + 'T00:00:00Z');
      if (dt > endDate) endDate = dt;
    }
    const daily = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(endDate.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const hit = dayMap.get(key) || { revenue: 0, orders: 0 };
      daily.push({ day: key, revenue: hit.revenue, orders: hit.orders });
    }
    res.json({
      revenue: Number(revenue.revenue), digitalRevenue, physicalRevenue,
      paidOrders: revenue.paid_orders, byStatus,
      users: users.count, products: products.count, pendingRefunds: refunds.count, openTickets: tickets.count,
      topProducts, lowStock, daily
    });
  } catch (e) { next(e); }
});

/* ===================== DON HANG ===================== */
router.get('/orders', async (req, res, next) => {
  try {
    const q = z.object({ status: z.string().max(30).optional() }).parse(req.query);
    const where = q.status ? 'WHERE o.status=?' : '';
    const [orders] = await db.execute(
      `SELECT o.id, o.user_id, o.order_number, o.status, o.subtotal, o.tax_total, o.shipping_total, o.discount_total, o.total, o.placed_at, o.paid_at,
              u.email, u.display_name, o.recipient_name, o.recipient_phone, o.shipping_address,
              (SELECT GROUP_CONCAT(CONCAT(oi.product_title,' (',IF(oi.product_type='digital','số','đĩa'),') x',oi.quantity) SEPARATOR '; ')
                 FROM order_items oi WHERE oi.order_id=o.id) AS items,
              (SELECT SUM(oi.product_type='physical') FROM order_items oi WHERE oi.order_id=o.id) AS physical_count,
              (SELECT SUM(oi.product_type='digital') FROM order_items oi WHERE oi.order_id=o.id) AS digital_count,
              (SELECT r.status FROM refunds r WHERE r.order_id=o.id ORDER BY r.id DESC LIMIT 1) AS refund_status
       FROM orders o JOIN users u ON u.id=o.user_id ${where}
       ORDER BY o.placed_at DESC LIMIT 200`,
      q.status ? [q.status] : []
    );
    res.json({ orders });
  } catch (e) { next(e); }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const [[order]] = await db.execute(
      `SELECT o.id, o.user_id, o.order_number, o.status, o.subtotal, o.tax_total, o.shipping_total, o.discount_total, o.total, o.currency, o.placed_at, o.paid_at,
              u.email, u.display_name, o.recipient_name, o.recipient_phone, o.shipping_address,
              (SELECT r.status FROM refunds r WHERE r.order_id=o.id ORDER BY r.id DESC LIMIT 1) AS refund_status
       FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?`,
      [id]
    );
    if (!order) return res.status(404).json({ error: 'order_not_found' });
    const [items] = await db.execute(
      `SELECT oi.id, oi.product_id, oi.product_title, oi.product_type, oi.unit_price, oi.quantity, oi.line_total, p.slug, p.platform
       FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`,
      [id]
    );
    res.json({ order, items });
  } catch (e) { next(e); }
});

// Quy trinh giao van: paid/processing (Cho lay hang) <-> shipped (Dang giao) <-> fulfilled (Da giao); pending_payment -> cancelled
const transitions = {
  pending_payment: ['cancelled'],
  paid: ['processing', 'shipped', 'fulfilled', 'cancelled'],
  processing: ['processing', 'shipped', 'fulfilled', 'cancelled'],
  shipped: ['processing', 'shipped', 'fulfilled'],
  fulfilled: ['processing', 'shipped', 'fulfilled'],
};
router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const { status } = z.object({ status: z.enum(['processing', 'shipped', 'fulfilled', 'cancelled']) }).parse(req.body);
    await inTransaction(async (conn) => {
      const [[order]] = await conn.execute('SELECT id,status FROM orders WHERE id=? FOR UPDATE', [id]);
      if (!order) throw new HttpError(404, 'order_not_found');
      if (!(transitions[order.status] || []).includes(status)) throw new HttpError(409, 'invalid_transition');
      if (status === 'cancelled' && order.status === 'pending_payment') {
        // Tra lai hang dang giu cho don chua thanh toan
        const [items] = await conn.execute("SELECT product_id,quantity FROM order_items WHERE order_id=? AND product_type='physical'", [id]);
        for (const it of items) {
          await conn.execute('UPDATE physical_inventory SET quantity_reserved=GREATEST(quantity_reserved-?,0) WHERE product_id=?', [it.quantity, it.product_id]);
        }
        await conn.execute("UPDATE payments SET status='failed' WHERE order_id=?", [id]);
      }
      if (status === 'fulfilled') {
        await conn.execute(
          "UPDATE order_fulfillments f JOIN order_items oi ON oi.id=f.order_item_id SET f.status='fulfilled', f.fulfilled_at=UTC_TIMESTAMP() WHERE oi.order_id=?",
          [id]
        );
      }
      await conn.execute('UPDATE orders SET status=? WHERE id=?', [status, id]);
    });
    res.json({ ok: true, status });
  } catch (e) { sendError(res, next, e); }
});

/* ===================== HOAN TIEN ===================== */
router.get('/refunds', async (req, res, next) => {
  try {
    const [refunds] = await db.execute(
      `SELECT r.id, r.amount, r.reason, r.status, r.created_at, o.id AS order_id, o.order_number, o.status AS order_status, u.email
       FROM refunds r JOIN orders o ON o.id=r.order_id JOIN users u ON u.id=o.user_id
       ORDER BY r.status='requested' DESC, r.created_at DESC LIMIT 200`
    );
    res.json({ refunds });
  } catch (e) { next(e); }
});

router.put('/refunds/:id', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const { action } = z.object({ action: z.enum(['approve', 'reject']) }).parse(req.body);
    await inTransaction(async (conn) => {
      const [[refund]] = await conn.execute('SELECT id,order_id,payment_id,status FROM refunds WHERE id=? FOR UPDATE', [id]);
      if (!refund) throw new HttpError(404, 'refund_not_found');
      if (refund.status !== 'requested') throw new HttpError(409, 'refund_already_handled');
      if (action === 'reject') {
        await conn.execute("UPDATE refunds SET status='rejected' WHERE id=?", [id]);
        return;
      }
      const [[order]] = await conn.execute('SELECT id,user_id,status,total FROM orders WHERE id=? FOR UPDATE', [refund.order_id]);
      // 1. Thu hoi game so khoi thu vien
      await conn.execute(
        "UPDATE game_library gl JOIN order_items oi ON oi.id=gl.order_item_id SET gl.status='revoked' WHERE oi.order_id=?",
        [order.id]
      );
      // 2. Dia chua giao thi nhap lai kho
      if (order.status === 'paid' || order.status === 'processing') {
        const [items] = await conn.execute("SELECT product_id,quantity FROM order_items WHERE order_id=? AND product_type='physical'", [order.id]);
        for (const it of items) {
          await conn.execute('UPDATE physical_inventory SET quantity_on_hand=quantity_on_hand+? WHERE product_id=?', [it.quantity, it.product_id]);
        }
      }
      // 3. Tru lai diem thuong da cong cho don nay
      const [[earned]] = await conn.execute(
        'SELECT COALESCE(SUM(points_delta),0) AS pts FROM loyalty_transactions WHERE order_id=? AND points_delta>0', [order.id]
      );
      if (Number(earned.pts) > 0) {
        await conn.execute(
          'INSERT INTO loyalty_transactions(user_id,order_id,points_delta,description) VALUES(?,?,?,?)',
          [order.user_id, order.id, -Number(earned.pts), 'Thu hoi diem do hoan tien']
        );
        await conn.execute(
          'UPDATE loyalty_accounts SET points_balance=GREATEST(points_balance-?,0), lifetime_spend=GREATEST(lifetime_spend-?,0) WHERE user_id=?',
          [Number(earned.pts), Number(order.total), order.user_id]
        );
      }
      // 4. Cap nhat trang thai
      await conn.execute("UPDATE refunds SET status='processed' WHERE id=?", [id]);
      await conn.execute("UPDATE payments SET status='refunded' WHERE id=?", [refund.payment_id]);
      await conn.execute("UPDATE orders SET status='refunded' WHERE id=?", [order.id]);
    });
    res.json({ ok: true });
  } catch (e) { sendError(res, next, e); }
});

/* ===================== SAN PHAM ===================== */
const productSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(180),
  description: z.string().max(5000).optional().default(''),
  publisher: z.string().max(150).optional().default(''),
  developer: z.string().max(150).optional().default(''),
  release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  platform: z.string().trim().min(1).max(80),
  genre: z.string().max(80).optional().default(''),
  cover_url: z.string().url().max(1000).optional().or(z.literal('')).default(''),
  product_type: z.enum(['digital', 'physical']),
  price: z.coerce.number().min(0),
  original_price: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(['draft', 'active', 'inactive']).default('active'),
  stock: z.coerce.number().int().min(0).optional(),
  min_requirements: z.string().max(1000).optional().default(''),
  physical_specs: z.string().max(1000).optional().default(''),
});

router.get('/products', async (req, res, next) => {
  try {
    const [products] = await db.execute(
      `SELECT p.id,p.slug,p.title,p.platform,p.genre,p.product_type,p.price,p.original_price,p.discount_percent,p.status,p.cover_url,
              p.publisher,p.developer,p.description,p.release_date,
              i.quantity_on_hand, i.quantity_reserved,
              gr.minimum_requirements
       FROM products p
       LEFT JOIN physical_inventory i ON i.product_id=p.id
       LEFT JOIN game_requirements gr ON gr.product_id=p.id
       ORDER BY p.title, p.product_type`
    );
    res.json({ products });
  } catch (e) { next(e); }
});

function discountOf(price, original) {
  if (!original || Number(original) <= Number(price)) return 0;
  return Math.round((1 - Number(price) / Number(original)) * 100);
}

router.post('/products', async (req, res, next) => {
  try {
    const p = productSchema.parse(req.body);
    const original = p.original_price || p.price;
    const desc = p.product_type === 'physical' && p.physical_specs
      ? (p.description ? p.description + '\n• Trọng lượng / Phụ kiện: ' + p.physical_specs : 'Trọng lượng / Phụ kiện: ' + p.physical_specs)
      : p.description;
    const id = await inTransaction(async (conn) => {
      const [r] = await conn.execute(
        `INSERT INTO products(slug,title,description,publisher,developer,release_date,platform,genre,cover_url,product_type,price,original_price,discount_percent,currency,status)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'VND',?)`,
        [p.slug, p.title, desc, p.publisher, p.developer, p.release_date || null, p.platform, p.genre, p.cover_url,
         p.product_type, p.price, original, discountOf(p.price, original), p.status]
      );
      if (p.product_type === 'physical') {
        await conn.execute('INSERT INTO physical_inventory(product_id,sku,quantity_on_hand) VALUES(?,?,?)',
          [r.insertId, 'SKU-' + p.slug.toUpperCase().slice(0, 60), p.stock || 0]);
      } else if (p.min_requirements) {
        const reqJson = JSON.stringify({ 'Cấu hình tối thiểu': p.min_requirements });
        await conn.execute(
          'INSERT INTO game_requirements(product_id,minimum_requirements,recommended_requirements) VALUES(?,?,?) ON DUPLICATE KEY UPDATE minimum_requirements=VALUES(minimum_requirements)',
          [r.insertId, reqJson, reqJson]
        );
      }
      await conn.execute(
        "INSERT INTO product_editions(product_id,edition_name,edition_description,price,original_price,product_type) VALUES(?,'Standard','Phiên bản tiêu chuẩn',?,?,?)",
        [r.insertId, p.price, original, p.product_type]
      );
      return r.insertId;
    });
    res.status(201).json({ id });
  } catch (e) { next(e); }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const p = productSchema.partial().parse(req.body);
    await inTransaction(async (conn) => {
      const [[cur]] = await conn.execute('SELECT * FROM products WHERE id=? FOR UPDATE', [id]);
      if (!cur) throw new HttpError(404, 'product_not_found');
      const merged = { ...cur, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) };
      const original = merged.original_price || merged.price;
      await conn.execute(
        `UPDATE products SET title=?,description=?,publisher=?,developer=?,platform=?,genre=?,cover_url=?,price=?,original_price=?,discount_percent=?,status=? WHERE id=?`,
        [merged.title, merged.description, merged.publisher, merged.developer, merged.platform, merged.genre, merged.cover_url,
         merged.price, original, discountOf(merged.price, original), merged.status, id]
      );
      if (cur.product_type === 'physical' && p.stock !== undefined) {
        const [[inv]] = await conn.execute('SELECT quantity_reserved FROM physical_inventory WHERE product_id=? FOR UPDATE', [id]);
        if (inv && p.stock < inv.quantity_reserved) throw new HttpError(409, 'stock_below_reserved');
        await conn.execute(
          'INSERT INTO physical_inventory(product_id,quantity_on_hand) VALUES(?,?) ON DUPLICATE KEY UPDATE quantity_on_hand=VALUES(quantity_on_hand)',
          [id, p.stock]
        );
      }
      if (cur.product_type === 'digital' && p.min_requirements) {
        const reqJson = JSON.stringify({ 'Cấu hình tối thiểu': p.min_requirements });
        await conn.execute(
          'INSERT INTO game_requirements(product_id,minimum_requirements,recommended_requirements) VALUES(?,?,?) ON DUPLICATE KEY UPDATE minimum_requirements=VALUES(minimum_requirements)',
          [id, reqJson, reqJson]
        );
      }
    });
    res.json({ ok: true });
  } catch (e) { sendError(res, next, e); }
});

/* ===================== NGUOI DUNG ===================== */
router.get('/users', async (req, res, next) => {
  try {
    await ensureAdminReady();
    const [users] = await db.execute(
      `SELECT u.id,u.email,u.display_name,u.role,u.status,u.created_at,u.last_login_at,
              (SELECT COUNT(*) FROM orders o WHERE o.user_id=u.id) AS orders,
              COALESCE(l.points_balance,0) AS points
       FROM users u LEFT JOIN loyalty_accounts l ON l.user_id=u.id ORDER BY u.created_at DESC`
    );
    res.json({ users });
  } catch (e) { next(e); }
});

router.put('/users/:id', async (req, res, next) => {
  try {
    await ensureAdminReady();
    const id = idParam.parse(req.params.id);
    const data = z.object({
      role: z.enum(['customer', 'publisher', 'staff', 'admin']).optional(),
      status: z.enum(['active', 'locked']).optional(),
    }).parse(req.body);
    if (String(id) === String(req.user.sub)) return res.status(409).json({ error: 'cannot_change_self' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    if (data.role) await db.execute('UPDATE users SET role=? WHERE id=?', [data.role, id]);
    if (data.status) await db.execute('UPDATE users SET status=? WHERE id=?', [data.status, id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/* ===================== COMMUNITY GAMES ===================== */
router.get('/community-games', async (req, res, next) => {
  try {
    const [games] = await db.execute(
      `SELECT g.id,g.slug,g.title,g.description,g.status,g.created_at,
              u.display_name AS uploader_name,u.email AS uploader_email
       FROM community_games g LEFT JOIN users u ON u.id=g.uploader_user_id
       WHERE g.status='pending' ORDER BY g.created_at ASC LIMIT 200`
    );
    res.json({ games });
  } catch (e) { next(e); }
});

router.put('/community-games/:id', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const data = z.object({
      action: z.enum(['publish', 'reject']),
      reviewNote: z.string().trim().max(500).optional().default('')
    }).parse(req.body);
    const status = data.action === 'publish' ? 'published' : 'rejected';
    const [result] = await db.execute(
      `UPDATE community_games SET status=?,review_note=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP()
       WHERE id=? AND status='pending'`,
      [status, data.reviewNote || null, req.user.sub, id]
    );
    if (!result.affectedRows) {
      const [[game]] = await db.execute('SELECT id FROM community_games WHERE id=?', [id]);
      return res.status(game ? 409 : 404).json({ error: game ? 'game_already_reviewed' : 'game_not_found' });
    }
    res.json({ ok: true, status });
  } catch (e) { next(e); }
});

/* ===================== HO TRO KHACH HANG ===================== */
router.get('/tickets', async (req, res, next) => {
  try {
    await ensureAdminReady();
    const [tickets] = await db.execute(
      `SELECT t.id,t.subject,t.message,t.status,t.priority,t.created_at,u.email,o.order_number,
              (SELECT m.message FROM support_messages m WHERE m.ticket_id=t.id ORDER BY m.id DESC LIMIT 1) AS last_reply
       FROM support_tickets t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN orders o ON o.id=t.order_id
       ORDER BY FIELD(t.status,'open','in_progress','resolved','closed'), t.created_at DESC LIMIT 200`
    );
    res.json({ tickets });
  } catch (e) { next(e); }
});

router.put('/tickets/:id', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const data = z.object({
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      reply: z.string().trim().max(2000).optional(),
    }).parse(req.body);
    const [[t]] = await db.execute('SELECT id FROM support_tickets WHERE id=?', [id]);
    if (!t) return res.status(404).json({ error: 'ticket_not_found' });
    if (data.reply) await db.execute('INSERT INTO support_messages(ticket_id,sender_user_id,message) VALUES(?,?,?)', [id, req.user.sub, data.reply]);
    if (data.status) await db.execute('UPDATE support_tickets SET status=? WHERE id=?', [data.status, id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
