import { Router } from 'express';
import { z } from 'zod';
import db, { ensureSchemaReady, inTransaction } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('publisher', 'admin'));
router.use(async (req, res, next) => {
  try {
    await ensureSchemaReady();
    next();
  } catch (e) {
    next(e);
  }
});

const idParam = z.coerce.number().int().positive();

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function sendError(res, next, e) {
  if (e instanceof HttpError) return res.status(e.status).json({ error: e.code });
  next(e);
}

function discountOf(price, original) {
  const p = Number(price);
  const o = Number(original);
  if (!o || o <= p || o <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - p / o) * 100)));
}

function isOwnerOrAdmin(req, ownerId) {
  return req.user.role === 'admin' || (ownerId != null && String(ownerId) === String(req.user.sub));
}

const createProductSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(180),
  description: z.string().max(5000).optional().default(''),
  publisher: z.string().trim().max(150).optional().default(''),
  developer: z.string().trim().max(150).optional().default(''),
  release_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional().nullable().transform((v) => v || null),
  platform: z.string().trim().min(1).max(80),
  genre: z.string().trim().max(80).optional().default(''),
  cover_url: z.string().trim().url().max(1000).optional().or(z.literal('')).default(''),
  product_type: z.enum(['digital', 'physical']),
  price: z.coerce.number().min(0),
  original_price: z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number().min(0).nullable()).optional(),
  stock: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().int().min(0).optional()),
  min_requirements: z.union([z.string().max(1000), z.record(z.string(), z.any())]).optional().default(''),
  physical_specs: z.string().max(1000).optional().default(''),
});

/* ===================== DASHBOARD STUDIO ===================== */
router.get('/dashboard', async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const scopeParams = isAdmin ? [] : [req.user.sub];

    const [products] = await db.execute(
      `SELECT p.id, p.slug, p.title, p.description, p.publisher, p.developer, p.publisher_user_id,
              p.release_date, p.platform, p.genre, p.cover_url, p.product_type,
              p.price, p.original_price, p.discount_percent, p.currency,
              p.status, p.rejection_reason, p.rating, p.created_at, p.updated_at,
              i.sku, i.quantity_on_hand, i.quantity_reserved,
              IF(p.product_type='physical', COALESCE(i.quantity_on_hand - i.quantity_reserved, 0), NULL) AS available_stock,
              COALESCE(sales.sold, 0) AS sold,
              COALESCE(sales.revenue, 0) AS revenue
       FROM products p
       LEFT JOIN physical_inventory i ON i.product_id = p.id
       LEFT JOIN (
         SELECT oi.product_id,
                COALESCE(SUM(oi.quantity), 0) AS sold,
                COALESCE(SUM(oi.line_total), 0) AS revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.status IN ('paid','processing','shipped','fulfilled')
         GROUP BY oi.product_id
       ) sales ON sales.product_id = p.id
       ${isAdmin ? '' : 'WHERE p.publisher_user_id = ?'}
       ORDER BY FIELD(p.status, 'draft', 'active', 'inactive'), p.created_at DESC, p.id DESC`,
      scopeParams
    );

    const [reviews] = await db.execute(
      `SELECT r.id, r.product_id, p.title AS product_title, p.slug AS product_slug,
              r.user_id, u.display_name, r.rating, r.title, r.body,
              r.verified_purchase, r.status, r.created_at,
              r.publisher_reply, r.publisher_replied_at
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       JOIN users u ON u.id = r.user_id
       WHERE r.status <> 'hidden' ${isAdmin ? '' : 'AND p.publisher_user_id = ?'}
       ORDER BY (r.publisher_reply IS NULL) DESC, r.created_at DESC
       LIMIT 100`,
      scopeParams
    );

    const [patches] = await db.execute(
      `SELECT gp.id, gp.product_id, p.title AS product_title, p.slug AS product_slug,
              gp.version, gp.title, gp.patch_notes, gp.size_mb, gp.is_dlc, gp.released_at
       FROM game_patches gp
       JOIN products p ON p.id = gp.product_id
       ${isAdmin ? '' : 'WHERE p.publisher_user_id = ?'}
       ORDER BY gp.released_at DESC, gp.id DESC
       LIMIT 100`,
      scopeParams
    );

    const stats = {
      totalProducts: products.length,
      draftProducts: products.filter((p) => p.status === 'draft').length,
      activeProducts: products.filter((p) => p.status === 'active').length,
      rejectedProducts: products.filter((p) => p.status === 'inactive').length,
      totalSold: products.reduce((sum, p) => sum + Number(p.sold || 0), 0),
      totalRevenue: products.reduce((sum, p) => sum + Number(p.revenue || 0), 0),
    };

    res.json({ products, reviews, patches, stats });
  } catch (e) {
    next(e);
  }
});

/* ===================== DANG TAI GAME MOI (DRAFT) ===================== */
router.post('/products', async (req, res, next) => {
  try {
    const p = createProductSchema.parse(req.body);
    const original = p.original_price != null && Number(p.original_price) > Number(p.price)
      ? Number(p.original_price)
      : Number(p.price);
    const discount = discountOf(p.price, original);
    const desc = p.product_type === 'physical' && p.physical_specs
      ? (p.description ? `${p.description}\n• Trọng lượng / Phụ kiện: ${p.physical_specs}` : `Trọng lượng / Phụ kiện: ${p.physical_specs}`)
      : p.description;

    const id = await inTransaction(async (conn) => {
      const [r] = await conn.execute(
        `INSERT INTO products(slug,title,description,publisher,developer,publisher_user_id,release_date,platform,genre,cover_url,product_type,price,original_price,discount_percent,currency,status)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'VND','draft')`,
        [
          p.slug, p.title, desc, p.publisher, p.developer, req.user.sub,
          p.release_date || null, p.platform, p.genre, p.cover_url,
          p.product_type, p.price, original, discount,
        ]
      );

      if (p.product_type === 'physical') {
        await conn.execute(
          'INSERT INTO physical_inventory(product_id,sku,quantity_on_hand) VALUES(?,?,?)',
          [r.insertId, `SKU-${p.slug.toUpperCase().slice(0, 55)}-${r.insertId}`, p.stock ?? 0]
        );
      } else {
        const reqObj = typeof p.min_requirements === 'object' && p.min_requirements !== null
          ? p.min_requirements
          : { 'Cấu hình tối thiểu': p.min_requirements || 'Đang cập nhật' };
        const reqJson = JSON.stringify(reqObj);
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

    res.status(201).json({ id, status: 'draft' });
  } catch (e) {
    next(e);
  }
});

/* ===================== CAP NHAT GIA & KHUYEN MAI ===================== */
router.put('/products/:id/pricing', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const data = z.object({
      price: z.coerce.number().min(0),
      original_price: z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number().min(0).nullable()).optional(),
    }).parse(req.body);

    const result = await inTransaction(async (conn) => {
      const [[prod]] = await conn.execute(
        'SELECT id, publisher_user_id, product_type FROM products WHERE id=? FOR UPDATE',
        [id]
      );
      if (!prod) throw new HttpError(404, 'product_not_found');
      if (!isOwnerOrAdmin(req, prod.publisher_user_id)) throw new HttpError(403, 'forbidden');

      const original = data.original_price != null && Number(data.original_price) > Number(data.price)
        ? Number(data.original_price)
        : Number(data.price);
      const discount = discountOf(data.price, original);

      await conn.execute(
        'UPDATE products SET price=?, original_price=?, discount_percent=? WHERE id=?',
        [data.price, original, discount, id]
      );

      const [edRes] = await conn.execute(
        "UPDATE product_editions SET price=?, original_price=? WHERE product_id=? AND edition_name='Standard'",
        [data.price, original, id]
      );
      if (edRes.affectedRows === 0) {
        await conn.execute(
          "INSERT INTO product_editions(product_id,edition_name,edition_description,price,original_price,product_type) VALUES(?,'Standard','Phiên bản tiêu chuẩn',?,?,?) ON DUPLICATE KEY UPDATE price=VALUES(price), original_price=VALUES(original_price)",
          [id, data.price, original, prod.product_type]
        );
      }

      return { id, price: Number(data.price), original_price: original, discount_percent: discount };
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    sendError(res, next, e);
  }
});

/* ===================== PHAT HANH BAN VA (PATCH) / DLC ===================== */
router.post('/products/:id/patches', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const data = z.object({
      version: z.string().trim().min(1).max(32),
      title: z.string().trim().min(1).max(200),
      patch_notes: z.string().trim().min(1).max(10000),
      size_mb: z.coerce.number().int().min(1).max(1000000).default(150),
      is_dlc: z.preprocess((v) => v === true || v === 1 || v === '1' || v === 'true', z.boolean()).default(false),
    }).parse(req.body);

    const [[prod]] = await db.execute('SELECT id, publisher_user_id FROM products WHERE id=?', [id]);
    if (!prod) return res.status(404).json({ error: 'product_not_found' });
    if (!isOwnerOrAdmin(req, prod.publisher_user_id)) return res.status(403).json({ error: 'forbidden' });

    const [r] = await db.execute(
      'INSERT INTO game_patches(product_id, version, title, patch_notes, size_mb, is_dlc) VALUES(?,?,?,?,?,?)',
      [id, data.version, data.title, data.patch_notes, data.size_mb, data.is_dlc ? 1 : 0]
    );

    res.status(201).json({
      id: r.insertId,
      product_id: id,
      version: data.version,
      title: data.title,
      patch_notes: data.patch_notes,
      size_mb: data.size_mb,
      is_dlc: data.is_dlc,
    });
  } catch (e) {
    next(e);
  }
});

/* ===================== PHAN HOI DANH GIA NGUOI CHOI ===================== */
router.put('/reviews/:reviewId/reply', async (req, res, next) => {
  try {
    const reviewId = idParam.parse(req.params.reviewId);
    const { reply } = z.object({ reply: z.string().trim().min(2).max(2000) }).parse(req.body);

    const [[row]] = await db.execute(
      `SELECT r.id, p.publisher_user_id
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       WHERE r.id = ?`,
      [reviewId]
    );
    if (!row) return res.status(404).json({ error: 'review_not_found' });
    if (!isOwnerOrAdmin(req, row.publisher_user_id)) return res.status(403).json({ error: 'forbidden' });

    await db.execute(
      'UPDATE reviews SET publisher_reply=?, publisher_replied_at=UTC_TIMESTAMP() WHERE id=?',
      [reply, reviewId]
    );

    res.json({ ok: true, id: reviewId, publisher_reply: reply });
  } catch (e) {
    next(e);
  }
});

export default router;
