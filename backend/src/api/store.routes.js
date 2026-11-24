import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import db, { ensureSchemaReady, inTransaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

// Phi thanh toan theo phuong thuc (giong bang trong cart.html) va ma giam gia
const PAYMENT_FEES = { visa: 0.029, paypal: 0.034, apple: 0.02, momo: 0, zalo: 0, vnpay: 0.005, bank: 0 };
const COUPONS = { SELL10: 0.10 };
// Phi van chuyen cho don co game dia (VND), giong bang trong cart.html. Don chi co game so = 0d.
const SHIPPING_FEES = { standard: 30000, express: 60000 };
// Tien do server tinh, giao dien chi hien thi: giam gia -> VAT 10% -> phi thanh toan -> phi van chuyen
function computeTotals(subtotal, { paymentMethod = 'visa', couponCode } = {}, shipping = 0) {
  const discount = Math.round(subtotal * (COUPONS[String(couponCode || '').trim().toUpperCase()] || 0));
  const tax = Math.round((subtotal - discount) * 0.10);
  const fee = Math.round((subtotal - discount + tax) * (PAYMENT_FEES[paymentMethod] || 0));
  return { discount, tax, fee, shipping, total: subtotal - discount + tax + fee + shipping };
}

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

router.get('/cart', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT ci.product_id,p.title,p.product_type,p.price,p.currency,ci.quantity FROM carts c JOIN cart_items ci ON ci.cart_id=c.id JOIN products p ON p.id=ci.product_id WHERE c.user_id=?',
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (e) {
    next(e);
  }
});

// Cho phep them game digital vao gio ngay ca khi nguoi mua da so huu (de mua lam qua tang);
// kiem tra trung so huu duoc thuc hien khi dat hang tuy theo mua cho minh hay tang ban be.
router.put('/cart/items', async (req, res, next) => {
  try {
    const data = z.object({
      productId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().min(1).max(20),
    }).parse(req.body);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [[product]] = await conn.execute(
        "SELECT id,product_type,status FROM products WHERE id=? FOR UPDATE",
        [data.productId]
      );
      if (!product || product.status !== 'active') {
        await conn.rollback();
        return res.status(404).json({ error: 'product_unavailable' });
      }
      if (product.product_type === 'digital') {
        data.quantity = 1;
      }
      if (product.product_type === 'physical') {
        const [[stock]] = await conn.execute(
          'SELECT quantity_on_hand-quantity_reserved AS available FROM physical_inventory WHERE product_id=?',
          [data.productId]
        );
        if (!stock || data.quantity > stock.available) {
          await conn.rollback();
          return res.status(409).json({ error: 'insufficient_stock' });
        }
      }
      await conn.execute('INSERT INTO carts(user_id) VALUES(?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)', [req.user.sub]);
      const [[cart]] = await conn.execute('SELECT id FROM carts WHERE user_id=?', [req.user.sub]);
      await conn.execute(
        'INSERT INTO cart_items(cart_id,product_id,quantity) VALUES(?,?,?) ON DUPLICATE KEY UPDATE quantity=VALUES(quantity)',
        [cart.id, data.productId, data.quantity]
      );
      await conn.commit();
      res.status(200).json({ ok: true });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    next(e);
  }
});

router.delete('/cart/items/:productId', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.productId);
    await db.execute(
      'DELETE ci FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE c.user_id=? AND ci.product_id=?',
      [req.user.sub, id]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/orders', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const body = z.object({
      addressId: z.coerce.number().int().positive().optional(),
      paymentMethod: z.enum(Object.keys(PAYMENT_FEES)).default('visa'),
      couponCode: z.string().max(40).optional(),
      shippingMethod: z.enum(Object.keys(SHIPPING_FEES)).default('standard'),
      isGift: z.boolean().optional().default(false),
      giftEmail: z.preprocess(
        (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
        z.string().trim().email().max(254).optional()
      ),
      giftMessage: z.string().trim().max(500).optional().default(''),
    }).default({}).parse(req.body || {});

    await conn.beginTransaction();
    const [[pendingCnt]] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM orders WHERE user_id=? AND status='pending_payment'",
      [req.user.sub]
    );
    if (Number(pendingCnt?.cnt || 0) >= 5) {
      await conn.rollback();
      return res.status(429).json({ error: 'too_many_pending_orders' });
    }
    const [cartRows] = await conn.execute('SELECT c.id FROM carts c WHERE c.user_id=? FOR UPDATE', [req.user.sub]);
    if (!cartRows.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'cart_empty' });
    }
    const [items] = await conn.execute(
      "SELECT ci.product_id,ci.quantity,p.title,p.product_type,p.price,p.currency FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=? AND p.status='active' FOR UPDATE",
      [cartRows[0].id]
    );
    if (!items.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'cart_empty' });
    }

    let subtotal = 0;
    for (const item of items) {
      if (item.product_type === 'physical') {
        const [stock] = await conn.execute(
          'SELECT quantity_on_hand-quantity_reserved AS available FROM physical_inventory WHERE product_id=? FOR UPDATE',
          [item.product_id]
        );
        if (!stock.length || stock[0].available < item.quantity) {
          await conn.rollback();
          return res.status(409).json({ error: 'insufficient_stock', productId: item.product_id });
        }
      }
      subtotal += Number(item.price) * item.quantity;
    }

    // Xac thuc qua tang (neu mua tang ban be) hoac kiem tra trung so huu cho chinh nguoi mua
    const gifting = Boolean(body.isGift || body.giftEmail);
    let recipient = null;
    if (gifting) {
      if (!body.giftEmail) {
        await conn.rollback();
        return res.status(400).json({ error: 'gift_email_required' });
      }
      const targetEmail = body.giftEmail.toLowerCase();
      const [[buyer]] = await conn.execute('SELECT email FROM users WHERE id=?', [req.user.sub]);
      if (buyer && String(buyer.email).toLowerCase() === targetEmail) {
        await conn.rollback();
        return res.status(400).json({ error: 'cannot_gift_self' });
      }
      const [[found]] = await conn.execute(
        "SELECT id, email, display_name FROM users WHERE email=? AND status='active' LIMIT 1",
        [targetEmail]
      );
      if (!found) {
        await conn.rollback();
        return res.status(404).json({ error: 'gift_recipient_not_found' });
      }
      recipient = found;
      for (const item of items) {
        if (item.product_type === 'digital') {
          const [owned] = await conn.execute(
            "SELECT 1 FROM game_library WHERE user_id=? AND product_id=? AND status='active' LIMIT 1",
            [recipient.id, item.product_id]
          );
          if (owned.length) {
            await conn.rollback();
            return res.status(409).json({ error: 'recipient_already_owns', productId: item.product_id });
          }
        }
      }
    } else {
      for (const item of items) {
        if (item.product_type === 'digital') {
          const [owned] = await conn.execute(
            "SELECT 1 FROM game_library WHERE user_id=? AND product_id=? AND status='active' LIMIT 1",
            [req.user.sub, item.product_id]
          );
          if (owned.length) {
            await conn.rollback();
            return res.status(409).json({ error: 'already_owned', productId: item.product_id });
          }
        }
      }
    }

    // Don co game dia phai co dia chi giao hang (lay tu so dia chi cua chinh nguoi dung).
    // Luu ban chup dia chi vao don: sau nay sua/xoa dia chi trong ho so thi don cu van giu nguyen.
    let ship = null;
    if (items.some((item) => item.product_type === 'physical')) {
      if (!body.addressId) {
        await conn.rollback();
        return res.status(400).json({ error: 'address_required' });
      }
      const [[addr]] = await conn.execute(
        'SELECT recipient_name,phone,address_line,ward,district,city FROM user_addresses WHERE id=? AND user_id=?',
        [body.addressId, req.user.sub]
      );
      if (!addr) {
        await conn.rollback();
        return res.status(404).json({ error: 'address_not_found' });
      }
      ship = {
        name: addr.recipient_name,
        phone: addr.phone,
        address: { addressLine: addr.address_line, ward: addr.ward, district: addr.district, city: addr.city },
      };
    }

    const totals = computeTotals(subtotal, body, ship ? SHIPPING_FEES[body.shippingMethod] : 0);
    const number = 'G5-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const [created] = await conn.execute(
      `INSERT INTO orders(
         order_number,user_id,recipient_user_id,status,subtotal,discount_total,tax_total,shipping_total,total,currency,
         recipient_name,recipient_phone,shipping_address,gift_email,gift_message
       ) VALUES(?,?,?,'pending_payment',?,?,?,?,?,?,?,?,?,?,?)`,
      [
        number,
        req.user.sub,
        recipient ? recipient.id : null,
        subtotal,
        totals.discount,
        totals.tax,
        totals.shipping,
        totals.total,
        items[0].currency,
        ship ? ship.name : null,
        ship ? ship.phone : null,
        ship ? JSON.stringify({ ...ship.address, shippingMethod: body.shippingMethod }) : null,
        recipient ? recipient.email : null,
        gifting && body.giftMessage ? body.giftMessage : null,
      ]
    );

    for (const item of items) {
      await conn.execute(
        'INSERT INTO order_items(order_id,product_id,product_title,product_type,unit_price,quantity,line_total) VALUES(?,?,?,?,?,?,?)',
        [created.insertId, item.product_id, item.title, item.product_type, item.price, item.quantity, Number(item.price) * item.quantity]
      );
      if (item.product_type === 'physical') {
        await conn.execute('UPDATE physical_inventory SET quantity_reserved=quantity_reserved+? WHERE product_id=?', [item.quantity, item.product_id]);
      }
    }

    await conn.execute(
      "INSERT INTO payments(order_id,provider,status,amount,currency) VALUES(?,'unconfigured','pending',?,?)",
      [created.insertId, totals.total, items[0].currency]
    );
    await conn.execute('DELETE FROM cart_items WHERE cart_id=?', [cartRows[0].id]);
    await conn.commit();

    res.status(201).json({
      order: {
        id: created.insertId,
        orderNumber: number,
        status: 'pending_payment',
        subtotal,
        discount: totals.discount,
        tax: totals.tax,
        fee: totals.fee,
        shipping: totals.shipping,
        total: totals.total,
        currency: items[0].currency,
        isGift: !!recipient,
        giftEmail: recipient ? recipient.email : null,
      },
      message: 'Chưa có cổng thanh toán cấu hình; đơn đang chờ thanh toán.',
    });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT o.id,o.order_number,o.status,o.total,o.currency,o.placed_at,o.paid_at,o.recipient_name,o.recipient_phone,o.shipping_address,o.recipient_user_id,o.gift_email,o.gift_message,(SELECT r.status FROM refunds r WHERE r.order_id=o.id ORDER BY r.id DESC LIMIT 1) AS refund_status FROM orders o WHERE o.user_id=? ORDER BY placed_at DESC',
      [req.user.sub]
    );
    if (rows.length > 0) {
      const orderIds = rows.map((r) => r.id);
      const placeholders = orderIds.map(() => '?').join(',');
      const [itemRows] = await db.execute(
        `SELECT order_id,product_id,product_title,product_type,unit_price,quantity,line_total FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
        orderIds
      );
      const itemsByOrder = new Map();
      for (const it of itemRows) {
        const list = itemsByOrder.get(it.order_id) || [];
        list.push(it);
        itemsByOrder.set(it.order_id, list);
      }
      for (const r of rows) {
        r.items = itemsByOrder.get(r.id) || [];
      }
    }
    res.json({ orders: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const [orders] = await db.execute(
      'SELECT id,order_number,status,subtotal,discount_total,tax_total,shipping_total,total,currency,placed_at,paid_at,recipient_name,recipient_phone,shipping_address,recipient_user_id,gift_email,gift_message FROM orders WHERE id=? AND user_id=?',
      [id, req.user.sub]
    );
    if (!orders[0]) return res.status(404).json({ error: 'order_not_found' });
    const [items] = await db.execute(
      'SELECT product_title,product_type,unit_price,quantity,line_total FROM order_items WHERE order_id=?',
      [id]
    );
    res.json({ order: orders[0], items });
  } catch (e) {
    next(e);
  }
});

let patchesSeedPromise = null;
function ensurePatchesSeeded() {
  if (!patchesSeedPromise) {
    patchesSeedPromise = (async () => {
      await ensureSchemaReady();
      await inTransaction(async (conn) => {
        const [[cntRow]] = await conn.execute('SELECT COUNT(*) AS cnt FROM game_patches');
        if (Number(cntRow.cnt) > 0) return;
        const [digitalGames] = await conn.execute(
          "SELECT id, title FROM products WHERE product_type='digital' AND status='active'"
        );
        for (const g of digitalGames) {
          await conn.execute(
            `INSERT INTO game_patches(product_id, version, title, patch_notes, size_mb, is_dlc, released_at)
             VALUES(?, 'v1.2.0', ?, ?, 1850, 1, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR))`,
            [
              g.id,
              `Gói Mở Rộng DLC: ${g.title} - Special Edition`,
              '• Mở khóa chế độ thử thách Boss Rush & bản đồ mở rộng\n• Tặng kèm bộ trang bị và nhạc nền kỹ thuật số 5GUYS Edition.',
            ]
          );
          await conn.execute(
            `INSERT INTO game_patches(product_id, version, title, patch_notes, size_mb, is_dlc, released_at)
             VALUES(?, 'v1.2.0', ?, ?, 420, 0, UTC_TIMESTAMP())`,
            [
              g.id,
              `Bản vá v1.2.0: Tối ưu Hiệu năng & DirectStorage`,
              '• Tăng 15% độ ổn định khung hình ở độ phân giải 2K/4K\n• Cải thiện tốc độ tải NVMe DirectStorage và đồng bộ Cloud Saves.',
            ]
          );
        }
      });
    })().catch((err) => {
      patchesSeedPromise = null;
      throw err;
    });
  }
  return patchesSeedPromise;
}

router.get('/library', async (req, res, next) => {
  try {
    await ensurePatchesSeeded();
    const [games] = await db.execute(
      `SELECT gl.id,p.id AS product_id,p.slug,p.title,p.platform,p.cover_url,
              gl.acquired_at,gl.installed_version,gl.dlc_installed
       FROM game_library gl
       JOIN products p ON p.id=gl.product_id
       WHERE gl.user_id=? AND gl.status='active'
       ORDER BY gl.acquired_at DESC`,
      [req.user.sub]
    );
    if (games.length) {
      const ids = games.map((g) => g.product_id);
      const placeholders = ids.map(() => '?').join(',');
      const [patchRows] = await db.execute(
        `SELECT id, product_id, version, title, patch_notes, size_mb, is_dlc, released_at
         FROM game_patches
         WHERE product_id IN (${placeholders})
         ORDER BY released_at DESC, id DESC`,
        ids
      );
      const byProd = new Map();
      for (const pt of patchRows) {
        if (!byProd.has(pt.product_id)) byProd.set(pt.product_id, []);
        byProd.get(pt.product_id).push({ ...pt, is_dlc: !!pt.is_dlc });
      }
      for (const g of games) {
        g.dlc_installed = !!g.dlc_installed;
        g.patches = byProd.get(g.product_id) || [];
      }
    }
    res.json({ games });
  } catch (e) {
    next(e);
  }
});

router.post('/library/:productId/update', async (req, res, next) => {
  try {
    const productId = z.coerce.number().int().positive().parse(req.params.productId);
    const data = z.object({
      targetVersion: z.string().trim().min(1).max(32),
      installDlc: z.boolean().optional(),
    }).parse(req.body);

    const [[existing]] = await db.execute(
      "SELECT id, installed_version, dlc_installed FROM game_library WHERE user_id=? AND product_id=? AND status='active'",
      [req.user.sub, productId]
    );
    if (!existing) return res.status(404).json({ error: 'library_game_not_found' });

    const dlcParam = data.installDlc === undefined ? null : (data.installDlc ? 1 : 0);
    await db.execute(
      "UPDATE game_library SET installed_version=?, dlc_installed=COALESCE(?, dlc_installed) WHERE user_id=? AND product_id=? AND status='active'",
      [data.targetVersion, dlcParam, req.user.sub, productId]
    );

    const finalDlc = data.installDlc === undefined ? Boolean(existing.dlc_installed) : Boolean(data.installDlc);
    res.json({ ok: true, installed_version: data.targetVersion, dlc_installed: finalDlc });
  } catch (e) {
    next(e);
  }
});

router.get('/loyalty', async (req, res, next) => {
  try {
    const [[account]] = await db.execute(
      'SELECT points_balance,lifetime_spend,tier FROM loyalty_accounts WHERE user_id=?',
      [req.user.sub]
    );
    const [history] = await db.execute(
      'SELECT points_delta,description,created_at FROM loyalty_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 100',
      [req.user.sub]
    );
    res.json({ account: account || { points_balance: 0, lifetime_spend: 0, tier: 'bronze' }, history });
  } catch (e) {
    next(e);
  }
});

export default router;
