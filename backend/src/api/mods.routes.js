import { Router } from 'express';
import { z } from 'zod';
import db, { ensureSchemaReady, inTransaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const idParam = z.coerce.number().int().positive();

const SAMPLE_MODS = [
  {
    slug: 'hollow-knight',
    title: 'Hallownest Visual Refresh',
    category: 'ĐỒ HỌA',
    version: 'v1.2.0',
    size_label: '18 MB',
    description: 'Tinh chỉnh bảng màu, ánh sáng hang động và hiệu ứng môi trường vẽ tay trong vương quốc Hallownest.',
    downloads_count: 1240,
    rating: 4.80,
  },
  {
    slug: 'hollow-knight',
    title: 'Knight Challenge Routes',
    category: 'LỐI CHỌI',
    version: 'v1.0.4',
    size_label: '6 MB',
    description: 'Tổng hợp lộ trình thử thách tốc độ, boss rush và chế độ chơi lại nâng cao cho Hollow Knight.',
    downloads_count: 420,
    rating: 4.60,
  },
  {
    slug: 'hollow-knight-silksong',
    title: 'Pharloom UI Concepts',
    category: 'GIAO DIỆN',
    version: 'v1.1.0',
    size_label: '12 MB',
    description: 'Bộ giao diện tối giản chuẩn Pharloom và biểu tượng kỹ năng sắc nét cho màn hình 2K/4K.',
    downloads_count: 680,
    rating: 4.70,
  },
  {
    slug: 'hollow-knight-silksong',
    title: 'Hornet Practice Notes',
    category: 'LỐI CHỌI',
    version: 'v1.0.2',
    size_label: '4 MB',
    description: 'Công cụ luyện tập combo Hornet, hiển thị khung thời gian đỡ đòn và thiết lập điều khiển tùy biến.',
    downloads_count: 310,
    rating: 4.50,
  },
  {
    slug: 'elden-ring',
    title: 'Lands Between Visual Preset',
    category: 'ĐỒ HỌA',
    version: 'v2.0.1',
    size_label: '180 MB',
    description: 'Thiết lập Reshade ánh sáng điện ảnh và cân bằng độ tương phản cho Lands Between trên PC.',
    downloads_count: 1490,
    rating: 4.60,
  },
  {
    slug: 'elden-ring',
    title: 'Tarnished Challenge Pack',
    category: 'LỐI CHỌI',
    version: 'v1.3.0',
    size_label: '12 MB',
    description: 'Gói thử thách randomizer vật phẩm và cân bằng độ khó cho lượt chơi New Game+.',
    downloads_count: 1105,
    rating: 4.40,
  },
  {
    slug: 'sekiro-shadows-die-twice',
    title: 'Ashina Visual Preset',
    category: 'ĐỒ HỌA',
    version: 'v1.5.0',
    size_label: '95 MB',
    description: 'Tăng cường độ tương phản, sương mù và hiệu ứng tia lửa kiếm khí tại vùng Ashina.',
    downloads_count: 730,
    rating: 4.60,
  },
  {
    slug: 'sekiro-shadows-die-twice',
    title: 'Shinobi Training Notes',
    category: 'LỐI CHỌI',
    version: 'v1.1.2',
    size_label: '3 MB',
    description: 'Chế độ luyện tập đỡ đòn (Parry) với Boss bất kỳ và thống kê độ chính xác từng nhịp.',
    downloads_count: 510,
    rating: 4.70,
  },
  {
    slug: 'black-myth-wukong',
    title: 'Cinematic Photo Mode Ideas',
    category: 'ĐỒ HỌA',
    version: 'v1.4.0',
    size_label: '32 MB',
    description: 'Mở rộng góc máy chụp ảnh tự do, bộ lọc màu điện ảnh và chiều sâu trường ảnh cho Tây Du Ký.',
    downloads_count: 1760,
    rating: 4.70,
  },
  {
    slug: 'black-myth-wukong',
    title: 'Journey Challenge Pack',
    category: 'LỐI CHỌI',
    version: 'v1.2.1',
    size_label: '8 MB',
    description: 'Thêm thử thách Boss Rush liên hoàn và tinh chỉnh độ linh hoạt của các thế gậy.',
    downloads_count: 810,
    rating: 4.50,
  },
];

let modsSeedPromise = null;
function ensureModsReady() {
  if (!modsSeedPromise) {
    modsSeedPromise = (async () => {
      await ensureSchemaReady();
      await inTransaction(async (conn) => {
        const [[cntRow]] = await conn.execute('SELECT COUNT(*) AS cnt FROM game_mods');
        if (Number(cntRow.cnt) > 0) return;

        const [[author]] = await conn.execute("SELECT id FROM users ORDER BY (role='admin') DESC, id ASC LIMIT 1");
        if (!author) return;

        const slugs = [...new Set(SAMPLE_MODS.map((m) => m.slug))];
        const placeholders = slugs.map(() => '?').join(',');
        const [prodRows] = await conn.execute(
          `SELECT id, slug FROM products WHERE slug IN (${placeholders}) AND product_type='digital'`,
          slugs
        );
        const prodMap = new Map(prodRows.map((p) => [p.slug, p.id]));

        for (const m of SAMPLE_MODS) {
          const productId = prodMap.get(m.slug);
          if (!productId) continue;
          await conn.execute(
            `INSERT INTO game_mods(product_id,author_user_id,title,category,version,size_label,description,downloads_count,rating,status)
             VALUES(?,?,?,?,?,?,?,?,?,'published')`,
            [productId, author.id, m.title, m.category, m.version, m.size_label, m.description, m.downloads_count, m.rating]
          );
        }
      });
    })().catch((err) => {
      modsSeedPromise = null;
      throw err;
    });
  }
  return modsSeedPromise;
}

/**
 * Tim san pham ky thuat so tuong ung voi slug (hoac cung title neu slug la ban vat ly).
 */
async function resolveDigitalProduct(slug) {
  const [rows] = await db.execute(
    `SELECT p_dig.id, p_dig.slug, p_dig.title
     FROM products p_req
     JOIN products p_dig ON p_dig.title = p_req.title AND p_dig.product_type = 'digital' AND p_dig.status = 'active'
     WHERE p_req.slug = ? AND p_req.status = 'active'
     ORDER BY (p_dig.slug = p_req.slug) DESC, p_dig.id ASC
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

router.use(async (req, res, next) => {
  try {
    await ensureModsReady();
    next();
  } catch (e) {
    next(e);
  }
});

/* ===================== DANH SACH MOD THEO GAME ===================== */
router.get('/', async (req, res, next) => {
  try {
    const { slug } = z.object({ slug: z.string().trim().max(180).optional() }).parse(req.query);
    if (slug) {
      const product = await resolveDigitalProduct(slug);
      if (!product) return res.json({ product: null, mods: [] });
      const [mods] = await db.execute(
        `SELECT gm.id, gm.product_id, gm.author_user_id, gm.title, gm.category, gm.version, gm.size_label,
                gm.description, gm.downloads_count, gm.rating, gm.status, gm.created_at,
                u.display_name AS author_name, p.slug AS product_slug, p.title AS product_title
         FROM game_mods gm
         JOIN users u ON u.id = gm.author_user_id
         JOIN products p ON p.id = gm.product_id
         WHERE gm.product_id = ? AND gm.status = 'published'
         ORDER BY gm.created_at DESC, gm.id DESC`,
        [product.id]
      );
      return res.json({ product, mods });
    }

    const [mods] = await db.execute(
      `SELECT gm.id, gm.product_id, gm.author_user_id, gm.title, gm.category, gm.version, gm.size_label,
              gm.description, gm.downloads_count, gm.rating, gm.status, gm.created_at,
              u.display_name AS author_name, p.slug AS product_slug, p.title AS product_title
       FROM game_mods gm
       JOIN users u ON u.id = gm.author_user_id
       JOIN products p ON p.id = gm.product_id
       WHERE gm.status = 'published' AND p.status = 'active'
       ORDER BY gm.created_at DESC, gm.id DESC
       LIMIT 100`
    );
    res.json({ mods });
  } catch (e) {
    next(e);
  }
});

/* ===================== DANG TAI BAN MOD MOI ===================== */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      productSlug: z.string().trim().min(1).max(180),
      title: z.string().trim().min(3).max(180),
      category: z.string().trim().min(1).max(60),
      version: z.string().trim().min(1).max(32),
      sizeLabel: z.string().trim().min(1).max(32),
      description: z.string().trim().min(10).max(2000),
    }).parse(req.body);

    const product = await resolveDigitalProduct(data.productSlug);
    if (!product) return res.status(404).json({ error: 'product_not_found' });

    const [r] = await db.execute(
      `INSERT INTO game_mods(product_id,author_user_id,title,category,version,size_label,description,status)
       VALUES(?,?,?,?,?,?,?,'published')`,
      [product.id, req.user.sub, data.title, data.category, data.version, data.sizeLabel, data.description]
    );

    const [[mod]] = await db.execute(
      `SELECT gm.id, gm.product_id, gm.author_user_id, gm.title, gm.category, gm.version, gm.size_label,
              gm.description, gm.downloads_count, gm.rating, gm.status, gm.created_at,
              u.display_name AS author_name, p.slug AS product_slug, p.title AS product_title
       FROM game_mods gm
       JOIN users u ON u.id = gm.author_user_id
       JOIN products p ON p.id = gm.product_id
       WHERE gm.id = ?`,
      [r.insertId]
    );
    res.status(201).json({ mod });
  } catch (e) {
    next(e);
  }
});

/* ===================== TAI BAN MOD & TANG LUOT TAI ===================== */
router.post('/:id/download', requireAuth, async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const mod = await inTransaction(async (conn) => {
      const [[cur]] = await conn.execute(
        "SELECT id FROM game_mods WHERE id = ? AND status = 'published' FOR UPDATE",
        [id]
      );
      if (!cur) throw new HttpError(404, 'mod_not_found');

      await conn.execute('UPDATE game_mods SET downloads_count = downloads_count + 1 WHERE id = ?', [id]);
      const [[updated]] = await conn.execute(
        `SELECT gm.id, gm.title, gm.category, gm.version, gm.size_label, gm.description,
                gm.downloads_count, gm.rating, gm.created_at,
                u.display_name AS author_name, p.slug AS product_slug, p.title AS product_title
         FROM game_mods gm
         JOIN users u ON u.id = gm.author_user_id
         JOIN products p ON p.id = gm.product_id
         WHERE gm.id = ?`,
        [id]
      );
      return updated;
    });
    res.json({ ok: true, mod });
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ error: e.code });
    next(e);
  }
});

export default router;
