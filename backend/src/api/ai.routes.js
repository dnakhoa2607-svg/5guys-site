import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import db from '../db.js';
import env from '../config.js';

const router = Router();
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

// Giới hạn để tránh bị spam làm tốn quota Gemini
router.use(rateLimit({ windowMs: 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false }));

// Cache danh sách game trong 5 phút để không truy vấn DB mỗi lần chat
let catalogCache = { text: '', at: 0 };
async function getCatalogText() {
  if (catalogCache.text && Date.now() - catalogCache.at < 5 * 60 * 1000) return catalogCache.text;
  try {
    const [rows] = await db.execute(`
      SELECT p.title, p.genre,
        GROUP_CONCAT(DISTINCT p.platform SEPARATOR '/') AS platforms,
        GROUP_CONCAT(DISTINCT p.product_type SEPARATOR '/') AS formats,
        MIN(p.price) AS price,
        MAX(r.minimum_requirements) AS min_req,
        MAX(r.recommended_requirements) AS rec_req
      FROM products p
      LEFT JOIN game_requirements r ON r.product_id = p.id
      WHERE p.status = 'active'
      GROUP BY p.title, p.genre
      ORDER BY p.title
      LIMIT 200`);
    const clip = (s, n) => (s ? (typeof s === 'string' ? s : JSON.stringify(s)).replace(/\s+/g, ' ').slice(0, n) : '');
    catalogCache = {
      at: Date.now(),
      text: rows.map(g =>
        `- ${g.title} | thể loại: ${g.genre || '?'} | nền tảng: ${g.platforms || '?'} | định dạng: ${g.formats || '?'} | giá từ: ${g.price}` +
        (g.min_req ? ` | tối thiểu: ${clip(g.min_req, 160)}` : '') +
        (g.rec_req ? ` | khuyến nghị: ${clip(g.rec_req, 160)}` : '')
      ).join('\n')
    };
  } catch (e) {
    console.warn('[ai] Không đọc được catalog từ DB:', e.message);
  }
  return catalogCache.text;
}

function systemPrompt(catalog) {
  return `Bạn là "PC2GAMES AI", trợ lý tư vấn cấu hình và gợi ý game của cửa hàng game 5GUYS.
Nhiệm vụ: người dùng mô tả cấu hình PC (CPU, RAM, VGA, ổ cứng...) hoặc sở thích; bạn đánh giá cấu hình (Nhẹ / Tầm trung / Cao cấp) và gợi ý 3-5 game phù hợp, kèm mức thiết lập đồ hoạ (Low/Medium/High/Ultra) và FPS ước tính.
Quy tắc:
- Luôn trả lời bằng tiếng Việt, ngắn gọn (tối đa ~120 từ), thân thiện.
- Ưu tiên gợi ý game CÓ TRONG danh sách cửa hàng bên dưới; nếu gợi ý game ngoài danh sách thì ghi rõ "(chưa có tại 5GUYS)".
- Nếu người dùng chưa cung cấp đủ thông tin CPU/RAM/VGA, hãy hỏi lại ngắn gọn.
- Chỉ dùng **in đậm** cho tên game và gạch đầu dòng "- "; không dùng tiêu đề, bảng hay HTML.
- Từ chối lịch sự các câu hỏi không liên quan đến game/phần cứng.

Danh sách game đang bán tại 5GUYS:
${catalog || '(không tải được danh sách — hãy gợi ý các game phổ biến)'}`;
}

const schema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string().max(2000)
  })).max(10).default([])
});

router.post('/advisor', async (req, res, next) => {
  try {
    if (!env.GEMINI_API_KEY) return res.status(503).json({ error: 'ai_not_configured' });
    const { message, history } = schema.parse(req.body);
    const catalog = await getCatalogText();

    const contents = [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(catalog) }] },
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: 'low' } }
    });

    // Thử model chính trước; nếu quá tải (503/429) hoặc không còn (404) thì chuyển sang model dự phòng
    const models = [...new Set([env.GEMINI_MODEL, ...FALLBACK_MODELS])];
    let data = null;
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body,
        signal: AbortSignal.timeout(30000)
      });
      const json = await r.json().catch(() => ({}));
      if (r.ok) { data = json; break; }
      console.error(`[ai] Gemini ${model} error`, r.status, json?.error?.message);
      if (![404, 429, 500, 503].includes(r.status)) break;
    }
    if (!data) return res.status(502).json({ error: 'ai_upstream_error' });
    const reply = (data.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
    if (!reply) return res.status(502).json({ error: 'ai_empty_reply' });
    res.json({ reply });
  } catch (e) {
    if (e.name === 'TimeoutError') return res.status(504).json({ error: 'ai_timeout' });
    next(e);
  }
});

export default router;
