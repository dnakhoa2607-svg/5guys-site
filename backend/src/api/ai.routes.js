import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import db from '../db.js';
import env from '../config.js';
import { extractProfile, groupCount, clarifyReply, profileSummary, recommend, unknownGameNames } from '../ai/advisor.js';

const router = Router();
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

// Giới hạn để tránh bị spam làm tốn quota Gemini
router.use(rateLimit({ windowMs: 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false }));

// Cache danh sách game trong 5 phút để không truy vấn DB mỗi lần chat
let catalogCache = { rows: [], text: '', at: 0 };
async function getCatalog() {
  if (catalogCache.rows.length && Date.now() - catalogCache.at < 5 * 60 * 1000) return catalogCache;
  try {
    const [rows] = await db.execute(`
      SELECT p.title, p.genre, p.platform, p.product_type, p.price, p.rating,
        r.minimum_requirements AS min_req, r.recommended_requirements AS rec_req
      FROM products p
      LEFT JOIN game_requirements r ON r.product_id = p.id
      WHERE p.status = 'active'
      ORDER BY p.title
      LIMIT 200`);
    const clip = (s, n) => (s ? (typeof s === 'string' ? s : JSON.stringify(s)).replace(/\s+/g, ' ').slice(0, n) : '');
    // Gộp các bản (số/đĩa) của cùng một tựa thành 1 dòng cho lời nhắc Gemini
    const byTitle = new Map();
    for (const g of rows) {
      const cur = byTitle.get(g.title) || { title: g.title, genre: g.genre, items: [], min_req: g.min_req, rec_req: g.rec_req };
      cur.items.push(`${g.product_type === 'digital' ? 'bản số' : 'bản đĩa'} ${g.platform} ${Number(g.price)}đ`);
      byTitle.set(g.title, cur);
    }
    catalogCache = {
      at: Date.now(),
      rows,
      text: [...byTitle.values()].map(g =>
        `- ${g.title} | thể loại: ${g.genre || '?'} | phiên bản: ${g.items.join('; ')}` +
        (g.min_req ? ` | tối thiểu: ${clip(g.min_req, 160)}` : '') +
        (g.rec_req ? ` | khuyến nghị: ${clip(g.rec_req, 160)}` : '')
      ).join('\n')
    };
  } catch (e) {
    console.warn('[ai] Không đọc được catalog từ DB:', e.message);
  }
  return catalogCache;
}

function systemPrompt(catalog, profile) {
  return `Bạn là "PC2GAMES AI", trợ lý tư vấn cấu hình và gợi ý game của cửa hàng game 5GUYS.
Nhiệm vụ: người dùng mô tả cấu hình máy, sở thích và ngân sách; bạn đánh giá cấu hình (Nhẹ / Tầm trung / Cao cấp) và gợi ý 3-5 game phù hợp, kèm mức thiết lập đồ hoạ (Low/Medium/High/Ultra), FPS ước tính và lý do ngắn cho từng game.

Quy tắc bắt buộc về việc gợi ý:
- Có 3 nhóm thông tin: (1) Cấu hình máy: CPU, GPU, RAM hoặc loại máy (PC, laptop, PlayStation, Xbox, Switch); (2) Thể loại hoặc sở thích: hành động, nhập vai, Souls-like, chơi cùng bạn bè, cốt truyện...; (3) Ngân sách hoặc hình thức mua: ví dụ dưới 500.000đ, bản số hay bản đĩa.
- CHỈ gợi ý game khi khách đã cho biết ít nhất 2 trong 3 nhóm, tính gộp mọi tin nhắn trước đó trong cuộc trò chuyện.
- Nếu chưa đủ: KHÔNG nêu tên game nào. Nhắc lại ngắn gọn thông tin khách đã cho, rồi hỏi đúng những nhóm còn thiếu, tối đa 2 câu hỏi, mỗi câu có ví dụ để khách dễ trả lời.
- Không hỏi lại thông tin khách đã nói ở các tin nhắn trước.
- Khi đã đủ thông tin thì gợi ý ngay, không hỏi thêm.
- CHỈ gợi ý game CÓ TRONG danh sách cửa hàng bên dưới, viết đúng tên như trong danh sách. Tuyệt đối không nêu tên game ngoài danh sách. Phải tôn trọng loại máy, ngân sách và hình thức mua (bản số/bản đĩa) của khách. Nếu không có game nào khớp, nói thật và gợi ý khách nới tiêu chí.

Quy tắc trình bày:
- Luôn trả lời bằng tiếng Việt, ngắn gọn (tối đa ~120 từ), thân thiện.
- Chỉ dùng **in đậm** cho tên game và gạch đầu dòng "- "; không in đậm chữ nào khác, không dùng tiêu đề, bảng hay HTML.
- Từ chối lịch sự các câu hỏi không liên quan đến game/phần cứng.

Thông tin hệ thống đã rút ra từ cuộc trò chuyện (dùng để tham khảo, khách có thể đã nói thêm chi tiết khác):
${profileSummary(profile)}

Danh sách game đang bán tại 5GUYS:
${catalog}`;
}

async function askGemini(contents, sysText) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: sysText }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: 'low' } }
  });
  // Thử model chính trước; nếu quá tải (503/429) hoặc không còn (404) thì chuyển sang model dự phòng
  const models = [...new Set([env.GEMINI_MODEL, ...FALLBACK_MODELS])];
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body,
      signal: AbortSignal.timeout(30000)
    });
    const json = await r.json().catch(() => ({}));
    if (r.ok) return (json.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
    console.error(`[ai] Gemini ${model} error`, r.status, json?.error?.message);
    if (![404, 429, 500, 503].includes(r.status)) break;
  }
  return '';
}

const schema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string().max(2000)
  })).max(20).default([])
});

router.post('/advisor', async (req, res, next) => {
  try {
    const { message, history } = schema.parse(req.body);

    // 1) Gộp thông tin khách đã nói trong cả cuộc trò chuyện. Chưa đủ 2/3 nhóm -> hỏi lại, không gợi ý game.
    const profile = extractProfile([...history.filter(h => h.role === 'user').map(h => h.text), message]);
    if (groupCount(profile) < 2) return res.json({ reply: clarifyReply(profile) });

    // 2) Đủ thông tin -> gợi ý, chỉ từ danh sách game của cửa hàng.
    const catalog = await getCatalog();
    if (!catalog.rows.length) return res.json({ reply: 'Mình chưa tải được danh sách game của 5GUYS lúc này nên chưa gợi ý được. Bạn thử lại sau ít phút nhé!' });

    if (env.GEMINI_API_KEY) {
      const contents = [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: message }] }
      ];
      try {
        const reply = await askGemini(contents, systemPrompt(catalog.text, profile));
        const unknown = reply ? unknownGameNames(reply, catalog.rows) : [];
        if (reply && !unknown.length) return res.json({ reply });
        if (unknown.length) console.warn('[ai] Gemini nêu game ngoài cửa hàng, dùng gợi ý theo luật:', unknown);
      } catch (e) {
        console.error('[ai] Gemini lỗi, dùng gợi ý theo luật:', e.name, e.message);
      }
    }

    // 3) Không có key / Gemini lỗi / Gemini nêu game ngoài cửa hàng -> gợi ý theo luật từ DB.
    res.json({ reply: recommend(profile, catalog.rows) });
  } catch (e) {
    next(e);
  }
});

export default router;
