import { Router } from 'express';
import { z } from 'zod';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

// Ho tro khach hang: nguoi dung gui ticket va xem phan hoi cua admin
const router = Router();
router.use(requireAuth);

router.post('/tickets', async (req, res, next) => {
  try {
    const data = z.object({
      subject: z.string().trim().min(1).max(180),
      message: z.string().trim().min(1).max(4000),
      orderNumber: z.string().trim().max(32).optional(),
    }).parse(req.body);
    let orderId = null;
    if (data.orderNumber) {
      const [[o]] = await db.execute('SELECT id FROM orders WHERE order_number=? AND user_id=?', [data.orderNumber, req.user.sub]);
      orderId = o ? o.id : null;
    }
    const [r] = await db.execute(
      'INSERT INTO support_tickets(user_id,order_id,subject,message) VALUES(?,?,?,?)',
      [req.user.sub, orderId, data.subject, data.message]
    );
    res.status(201).json({ ticket: { id: r.insertId, code: 'TK-' + String(r.insertId).padStart(4, '0'), status: 'open' } });
  } catch (e) { next(e); }
});

router.get('/tickets', async (req, res, next) => {
  try {
    const [tickets] = await db.execute(
      `SELECT t.id,t.subject,t.message,t.status,t.created_at,
              (SELECT m.message FROM support_messages m WHERE m.ticket_id=t.id ORDER BY m.id DESC LIMIT 1) AS last_reply
       FROM support_tickets t WHERE t.user_id=? ORDER BY t.created_at DESC LIMIT 50`,
      [req.user.sub]
    );
    res.json({ tickets });
  } catch (e) { next(e); }
});

export default router;
