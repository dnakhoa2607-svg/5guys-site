import { Router } from 'express';
import { z } from 'zod';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const q = z.object({ q: z.string().max(100).optional(), type: z.enum(['digital','physical']).optional(), platform: z.string().max(80).optional(), genre: z.string().max(80).optional(), limit: z.coerce.number().int().min(1).max(100).default(24), offset: z.coerce.number().int().min(0).default(0) }).parse(req.query);
    const where = ["p.status='active'"], values = [];
    if (q.q) { where.push('p.title LIKE ?'); values.push(`%${q.q}%`); }
    if (q.type) { 
      where.push('EXISTS (SELECT 1 FROM products pf_type WHERE pf_type.title = p.title AND pf_type.product_type = ? AND pf_type.status = "active")'); 
      values.push(q.type); 
    }
    if (q.platform) { 
      where.push('EXISTS (SELECT 1 FROM products pf_plat WHERE pf_plat.title = p.title AND pf_plat.platform = ? AND pf_plat.status = "active")'); 
      values.push(q.platform); 
    }
    if (q.genre) { where.push('p.genre=?'); values.push(q.genre); }
    const [products] = await db.execute(`SELECT p.id,p.slug,p.title,p.description,p.publisher,p.developer,p.release_date, (SELECT GROUP_CONCAT(DISTINCT pf.platform SEPARATOR ' / ') FROM products pf WHERE pf.title=p.title AND pf.status='active') AS platform, p.genre,p.cover_url,p.product_type, (SELECT MIN(pf.price) FROM products pf WHERE pf.title=p.title AND pf.status='active') AS price, p.original_price,p.discount_percent,p.currency,p.rating, IF(p.product_type='physical',COALESCE(i.quantity_on_hand-i.quantity_reserved,0),NULL) AS available_stock,(SELECT GROUP_CONCAT(DISTINCT pf.product_type ORDER BY FIELD(pf.product_type,'digital','physical') SEPARATOR ',') FROM products pf WHERE pf.title=p.title AND pf.status='active') AS available_formats FROM products p LEFT JOIN physical_inventory i ON i.product_id=p.id INNER JOIN (SELECT MIN(id) AS min_id FROM products WHERE status='active' GROUP BY title) unique_titles ON p.id = unique_titles.min_id WHERE ${where.join(' AND ')} ORDER BY p.title LIMIT ? OFFSET ?`, [...values,q.limit,q.offset]);
    res.json({ products });
  } catch (e) { next(e); }
});
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const key=req.params.idOrSlug, column=/^\d+$/.test(key)?'id':'slug';
    const [rows]=await db.execute(`SELECT p.id,p.slug,p.title,p.description,p.publisher,p.developer,p.release_date,p.platform,p.genre,p.cover_url,p.product_type,p.price,p.original_price,p.discount_percent,p.currency,p.rating,IF(p.product_type='physical',COALESCE(i.quantity_on_hand-i.quantity_reserved,0),NULL) AS available_stock,(SELECT GROUP_CONCAT(DISTINCT pf.product_type ORDER BY FIELD(pf.product_type,'digital','physical') SEPARATOR ',') FROM products pf WHERE pf.title=p.title AND pf.status='active') AS available_formats FROM products p LEFT JOIN physical_inventory i ON i.product_id=p.id WHERE p.${column}=? AND p.status='active'`,[column==='id'?Number(key):key]);
    if(!rows[0]) return res.status(404).json({error:'product_not_found'});
    const id=rows[0].id;
    const [[formats],[media],[requirements],[editions],[reviews]]=await Promise.all([
      db.execute("SELECT p.id,p.slug,p.title,p.product_type,p.platform,p.price,p.original_price,p.currency,IF(p.product_type='physical',COALESCE(i.quantity_on_hand-i.quantity_reserved,0),NULL) AS available_stock FROM products p LEFT JOIN physical_inventory i ON i.product_id=p.id WHERE p.status='active' AND p.title=? ORDER BY FIELD(p.product_type,'digital','physical'),p.platform",[rows[0].title]),
      db.execute('SELECT media_type,media_url,caption,sort_order FROM game_media WHERE product_id=? ORDER BY sort_order',[id]),
      db.execute('SELECT minimum_requirements,recommended_requirements FROM game_requirements WHERE product_id=?',[id]),
      db.execute('SELECT edition_name,edition_description,price,original_price,product_type FROM product_editions WHERE product_id=? ORDER BY price',[id]),
      db.execute("SELECT r.rating,r.title,r.body,r.created_at,r.verified_purchase,u.display_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=? AND r.status='published' ORDER BY r.created_at DESC LIMIT 20",[id])
    ]);
    res.json({product:{...rows[0],formats,media,requirements:requirements[0]||null,editions,reviews}});
  }
  catch(e){next(e);}
});

// Viet / sua danh gia (moi nguoi 1 danh gia cho moi san pham). Danh dau "da mua" neu so huu game.
router.post('/:id/reviews', requireAuth, async (req, res, next) => {
  try {
    const productId = z.coerce.number().int().positive().parse(req.params.id);
    const data = z.object({
      rating: z.coerce.number().int().min(1).max(5),
      title: z.string().trim().max(180).optional().default(''),
      body: z.string().trim().min(3).max(3000),
    }).parse(req.body);
    const [[product]] = await db.execute("SELECT id,title FROM products WHERE id=? AND status='active'", [productId]);
    if (!product) return res.status(404).json({ error: 'product_not_found' });
    const [bought] = await db.execute(
      `SELECT 1 FROM order_items oi JOIN orders o ON o.id=oi.order_id JOIN products p ON p.id=oi.product_id
       WHERE o.user_id=? AND p.title=? AND o.status IN ('paid','processing','shipped','fulfilled') LIMIT 1`,
      [req.user.sub, product.title]
    );
    await db.execute(
      `INSERT INTO reviews(user_id,product_id,rating,title,body,verified_purchase,status) VALUES(?,?,?,?,?,?,'published')
       ON DUPLICATE KEY UPDATE rating=VALUES(rating),title=VALUES(title),body=VALUES(body),verified_purchase=VALUES(verified_purchase),created_at=CURRENT_TIMESTAMP`,
      [req.user.sub, productId, data.rating, data.title, data.body, bought.length ? 1 : 0]
    );
    // Cap nhat diem trung binh hien tren the game
    await db.execute(
      "UPDATE products SET rating=(SELECT ROUND(AVG(rating),2) FROM reviews WHERE product_id=? AND status='published') WHERE id=?",
      [productId, productId]
    );
    res.status(201).json({ ok: true, verifiedPurchase: !!bought.length });
  } catch (e) { next(e); }
});
export default router;