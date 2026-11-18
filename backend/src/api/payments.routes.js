import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import db, { ensureSchemaReady } from '../db.js';
import env from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.use(async (req, res, next) => {
  try {
    await ensureSchemaReady();
    next();
  } catch (e) {
    next(e);
  }
});

// CHI DUNG DE DEMO: thanh toan gia lap, khong thu tien that.
// Khi len production phai thay bang cong thanh toan that (webhook co chu ky).
router.post('/:id/pay', async (req, res, next) => {
  if (env.NODE_ENV === 'production') return res.status(404).json({ error: 'not_found' });
  let conn;
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Chi chu don hang moi duoc thanh toan, va chi khi don dang cho thanh toan
    const [orders] = await conn.execute(
      'SELECT id,status,total,recipient_user_id,gift_email FROM orders WHERE id=? AND user_id=? FOR UPDATE',
      [id, req.user.sub]
    );
    if (!orders.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'order_not_found' });
    }
    const order = orders[0];
    if (order.status !== 'pending_payment') {
      await conn.rollback();
      return res.status(409).json({ error: 'order_not_payable' });
    }

    // 2. Xu ly tung mon: game so -> vao thu vien (cua nguoi nhan neu la qua tang), game dia -> tru ton kho + tao yeu cau giao hang
    const [items] = await conn.execute(
      'SELECT id,product_id,product_type,quantity FROM order_items WHERE order_id=?',
      [id]
    );
    let hasPhysical = false;
    const ownerUserId = order.recipient_user_id || req.user.sub;
    for (const item of items) {
      if (item.product_type === 'digital') {
        await conn.execute(
          "INSERT INTO game_library(user_id,product_id,order_item_id) VALUES(?,?,?) ON DUPLICATE KEY UPDATE status='active', order_item_id=VALUES(order_item_id)",
          [ownerUserId, item.product_id, item.id]
        );
      } else {
        hasPhysical = true;
        await conn.execute(
          'UPDATE physical_inventory SET quantity_on_hand=quantity_on_hand-?, quantity_reserved=quantity_reserved-? WHERE product_id=?',
          [item.quantity, item.quantity, item.product_id]
        );
        await conn.execute("INSERT INTO order_fulfillments(order_item_id,status) VALUES(?,'pending')", [item.id]);
      }
    }

    // 3. Cap nhat don hang va giao dich thanh toan
    const newStatus = hasPhysical ? 'processing' : 'fulfilled';
    await conn.execute('UPDATE orders SET status=?, paid_at=UTC_TIMESTAMP() WHERE id=?', [newStatus, id]);
    await conn.execute(
      "UPDATE payments SET provider='mock', provider_reference=?, status='paid' WHERE order_id=?",
      ['MOCK-' + crypto.randomBytes(4).toString('hex').toUpperCase(), id]
    );

    // 4. Tich diem: 1 diem / 10.000d (luon cong cho nguoi thanh toan)
    const points = Math.floor(Number(order.total) / 10000);
    if (points > 0) {
      await conn.execute(
        'INSERT INTO loyalty_transactions(user_id,order_id,points_delta,description) VALUES(?,?,?,?)',
        [req.user.sub, id, points, 'Tich diem tu don hang']
      );
      await conn.execute(
        'INSERT INTO loyalty_accounts(user_id,points_balance,lifetime_spend) VALUES(?,?,?) ON DUPLICATE KEY UPDATE points_balance=points_balance+VALUES(points_balance), lifetime_spend=lifetime_spend+VALUES(lifetime_spend)',
        [req.user.sub, points, Number(order.total)]
      );
    }

    await conn.commit();
    res.json({
      order: { id, status: newStatus, recipientUserId: order.recipient_user_id || null, giftEmail: order.gift_email || null },
      pointsEarned: points,
      message: 'Thanh toan thu nghiem thanh cong (khong thu tien that).',
    });
  } catch (e) {
    if (conn) await conn.rollback();
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

// Nguoi dung gui yeu cau hoan tien cho don cua minh; admin se duyet trong trang quan tri
router.post('/:id/refund', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { reason } = z.object({ reason: z.string().trim().min(1).max(500) }).parse(req.body);
    const [[order]] = await db.execute(
      'SELECT o.id,o.status,o.total,p.id AS payment_id FROM orders o JOIN payments p ON p.order_id=o.id WHERE o.id=? AND o.user_id=? ORDER BY p.id DESC LIMIT 1',
      [id, req.user.sub]
    );
    if (!order) return res.status(404).json({ error: 'order_not_found' });
    if (!['paid', 'processing', 'shipped', 'fulfilled'].includes(order.status)) {
      return res.status(409).json({ error: 'order_not_refundable' });
    }
    const [[open]] = await db.execute(
      "SELECT id FROM refunds WHERE order_id=? AND status IN ('requested','approved','processed')",
      [id]
    );
    if (open) return res.status(409).json({ error: 'refund_already_requested' });
    const [r] = await db.execute(
      "INSERT INTO refunds(payment_id,order_id,amount,reason,status) VALUES(?,?,?,?,'requested')",
      [order.payment_id, id, order.total, reason]
    );
    res.status(201).json({ refund: { id: r.insertId, status: 'requested' } });
  } catch (e) {
    next(e);
  }
});

export default router;
