import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import db from '../db.js';
import env from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

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
      'SELECT id,status,total FROM orders WHERE id=? AND user_id=? FOR UPDATE',
      [id, req.user.sub]
    );
    if (!orders.length) { await conn.rollback(); return res.status(404).json({ error: 'order_not_found' }); }
    const order = orders[0];
    if (order.status !== 'pending_payment') { await conn.rollback(); return res.status(409).json({ error: 'order_not_payable' }); }

    // 2. Game so -> vao thu vien, game dia -> tru ton kho + tao yeu cau giao hang
    const [items] = await conn.execute(
      'SELECT id,product_id,product_type,quantity FROM order_items WHERE order_id=?',
      [id]
    );
    let hasPhysical = false;
    for (const item of items) {
      if (item.product_type === 'digital') {
        await conn.execute(
          "INSERT INTO game_library(user_id,product_id,order_item_id) VALUES(?,?,?) ON DUPLICATE KEY UPDATE status='active'",
          [req.user.sub, item.product_id, item.id]
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

    // 4. Tich diem: 1 diem / 10.000d
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
    res.json({ order: { id, status: newStatus }, pointsEarned: points, message: 'Thanh toan thu nghiem thanh cong (khong thu tien that).' });
  } catch (e) {
    if (conn) await conn.rollback();
    next(e);
  } finally {
    if (conn) conn.release();
  }
});

export default router;