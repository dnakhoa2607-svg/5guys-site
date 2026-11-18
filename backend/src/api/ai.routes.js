import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import db from '../db.js';
import env from '../config.js';
import { extractProfile, groupCount, needsGpu, clarifyReply, profileSummary, recommend, specNote, markExternalGames, tooWeakPicks } from '../ai/advisor.js';
import { EXTERNAL_TAG } from '../ai/games.js';

const router = Router();
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

// Giới hạn để tránh bị spam làm tốn quota Gemini
router.use(rateLimit({ windowMs: 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false }));

// Cache danh sách game trong 5 phút để không truy vấn DB mỗi lần chat.
// (Không dùng bảng game_requirements: dữ liệu mẫu trong đó giống nhau cho mọi game. Cấu hình thật nằm ở ai/games.js)
let catalogCache = { rows: [], titles: [], at: 0 };
async function getCatalog() {
  if (catalogCache.rows.length && Date.now() - catalogCache.at < 5 * 60 * 1000) return catalogCache;
  try {
    const [rows] = await db.execute(`
      SELECT p.title, p.genre, p.platform, p.product_type, p.price, p.rating
      FROM products p
      WHERE p.status = 'active'
      ORDER BY p.title
      LIMIT 200`);
    // Gộp các bản (số/đĩa) của cùng một tựa thành 1 dòng cho lời nhắc Gemini
    const byTitle = new Map();
    for (const g of rows) {
      const cur = byTitle.get(g.title) || { title: g.title, genre: g.genre, items: [] };
      cur.items.push(`${g.product_type === 'digital' ? 'bản số' : 'bản đĩa'} ${g.platform} ${Number(g.price)}đ`);
      byTitle.set(g.title, cur);
    }
    catalogCache = { at: Date.now(), rows, titles: [...byTitle.values()] };
  } catch (e) {
    console.warn('[ai] Không đọc được catalog từ DB:', e.message);
  }
  return catalogCache;
}

// Danh sách game kèm cấu hình thật + ước tính sẵn cho máy của khách này (để Gemini không đánh giá cảm tính).
function catalogText(catalog, profile) {
  return catalog.titles.map(g =>
    `- ${g.title} | thể loại: ${g.genre || '?'} | phiên bản: ${g.items.join('; ')} | ${specNote(g.title, profile)}`
  ).join('\n');
}

function systemPrompt(catalog, profile) {
  return `Bạn là "PC2GAMES AI", trợ lý tư vấn cấu hình và gợi ý game của cửa hàng game 5GUYS.
Nhiệm vụ: người dùng mô tả cấu hình máy, sở thích và ngân sách; bạn đánh giá cấu hình (Nhẹ / Tầm trung / Cao cấp) và gợi ý 3-5 game phù hợp, kèm mức thiết lập đồ hoạ (Low/Medium/High/Ultra), FPS ước tính và lý do ngắn cho từng game.

Quy tắc bắt buộc về việc gợi ý:
- Có 3 nhóm thông tin: (1) Cấu hình máy: CPU, GPU, RAM hoặc loại máy (PC, laptop, PlayStation, Xbox, Switch); (2) Thể loại hoặc sở thích: hành động, nhập vai, Souls-like, chơi cùng bạn bè, cốt truyện...; (3) Ngân sách hoặc hình thức mua: ví dụ dưới 500.000đ, bản số hay bản đĩa.
- CHỈ gợi ý game khi khách đã cho biết ít nhất 2 trong 3 nhóm, tính gộp mọi tin nhắn trước đó trong cuộc trò chuyện. Với PC/laptop, phải biết card đồ họa (hoặc khách xác nhận dùng card onboard / không biết) mới được gợi ý, vì chỉ có CPU thì không đánh giá được.
- Nếu chưa đủ: KHÔNG nêu tên game nào và KHÔNG đoán mò thông tin khách chưa nói. Nhắc lại ngắn gọn thông tin khách đã cho, rồi hỏi đúng những nhóm còn thiếu, tối đa 2 câu hỏi, mỗi câu có ví dụ để khách dễ trả lời.
- Câu quá ngắn hoặc chung chung (ví dụ chỉ "intel core i5", "ram 8gb", "game hay") luôn được coi là CHƯA ĐỦ. Ví dụ cách hỏi lại: "Để tư vấn chính xác, bạn cho mình biết thêm thế hệ chip và card đồ họa (ví dụ i5-12400F + RTX 3060), bạn thích thể loại nào và tầm giá dự kiến nhé!"
- 5GUYS chỉ bán game (bản số và bản đĩa), không bán phần cứng hay phụ kiện. Nếu khách muốn mua chuột, bàn phím, RAM, CPU... thì nói lịch sự rằng cửa hàng chỉ bán game, và mời khách cho biết cấu hình máy để gợi ý game phù hợp.
- Không hỏi lại thông tin khách đã nói ở các tin nhắn trước.
- Khi đã đủ thông tin thì gợi ý ngay, không hỏi thêm.

Quy tắc đánh giá cấu hình (RẤT QUAN TRỌNG, phải thực tế):
- Mỗi game trong danh sách cửa hàng có cấu hình Steam và dòng "với máy khách" đã được hệ thống tính sẵn theo card đồ họa của khách. Dùng ĐÚNG mức đồ họa/FPS đó, không được nâng lên.
- Game ghi "KHÔNG ĐỦ cấu hình" thì TUYỆT ĐỐI không gợi ý; có thể nhắc ngắn rằng máy chưa đủ để chơi game đó và cần tối thiểu card gì.
- Với game ngoài cửa hàng, tự đối chiếu với cấu hình tối thiểu/khuyến nghị thật của game trên Steam; không gợi ý game mà máy khách không đạt cấu hình tối thiểu. Game AAA nặng (ví dụ Black Myth: Wukong, Elden Ring, Cyberpunk 2077) cần card từ GTX 1060 trở lên.

Quy tắc về game ngoài cửa hàng:
- Ưu tiên game có bán tại 5GUYS, viết đúng tên như trong danh sách, tôn trọng loại máy, ngân sách và hình thức mua (bản số/bản đĩa) của khách.
- ĐƯỢC PHÉP gợi ý thêm game KHÔNG có trong danh sách khi chúng hợp với máy và gu của khách (nhất là khi cửa hàng có ít game phù hợp), tối đa 3 game. Mỗi game như vậy BẮT BUỘC viết ngay sau tên: ${EXTERNAL_TAG}. Ví dụ: "- **Stardew Valley** ${EXTERNAL_TAG}: ...".
- Không bịa giá bán cho game ngoài cửa hàng.

Quy tắc trình bày:
- Luôn trả lời bằng tiếng Việt, ngắn gọn (tối đa ~170 từ), thân thiện.
- Mở đầu bằng 1 câu đánh giá cấu hình, sau đó trình bày gợi ý bằng gạch đầu dòng "- ", hoặc bằng một bảng Markdown nhỏ nếu so sánh từ 3 game trở lên, với các cột: Game | Phiên bản & giá | Mức đồ họa | FPS ước tính.
- Chỉ dùng **in đậm** cho tên game được gợi ý; không in đậm chữ nào khác, không dùng tiêu đề hay HTML.
- Từ chối lịch sự các câu hỏi không liên quan đến game/phần cứng.

Thông tin hệ thống đã rút ra từ cuộc trò chuyện (dùng để tham khảo, khách có thể đã nói thêm chi tiết khác):
${profileSummary(profile)}

Danh sách game đang bán tại 5GUYS:
${catalog}`;
}

// Lỗi Gemini đã được phân loại, để ghi log rõ ràng (không bao giờ gửi chi tiết lỗi/key xuống frontend).
class GeminiError extends Error {
  constructor(kind, message, status) { super(message); this.name = 'GeminiError'; this.kind = kind; this.status = status; }
}
function classifyGeminiError(status, err) {
  const reason = err?.details?.find(d => d.reason)?.reason || err?.status || '';
  const msg = err?.message || `HTTP ${status}`;
  if (/API_KEY_INVALID|API_KEY_EXPIRED|API_KEY_SERVICE_BLOCKED/.test(reason) || /api key (not valid|expired)/i.test(msg) || status === 401 || status === 403)
    return new GeminiError('auth', `API key không hợp lệ, hết hạn hoặc đã bị xóa/thu hồi (${reason || status}): ${msg}`, status);
  if (status === 429) return new GeminiError('quota', `Hết quota hoặc gửi quá nhanh: ${msg}`, status);
  if (status === 404) return new GeminiError('model', `Không tìm thấy model: ${msg}`, status);
  if (status >= 500) return new GeminiError('server', `Gemini lỗi phía máy chủ: ${msg}`, status);
  return new GeminiError('request', `Yêu cầu bị từ chối: ${msg}`, status);
}

async function askGemini(contents, sysText) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: sysText }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: 'low' } }
  });
  // Thử model chính trước; nếu quá tải/hết quota/model không còn/lỗi mạng thì chuyển sang model dự phòng.
  const models = [...new Set([env.GEMINI_MODEL, ...FALLBACK_MODELS])];
  let lastError = null;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    let r;
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body,
        signal: AbortSignal.timeout(30000)
      });
    } catch (e) {
      // Mất mạng, DNS lỗi, hoặc quá 30 giây không phản hồi
      lastError = new GeminiError(e.name === 'TimeoutError' ? 'timeout' : 'network', `${model}: ${e.name} ${e.cause?.code || e.message}`);
      console.error('[ai] Gemini', lastError.kind, lastError.message);
      continue;
    }
    const json = await r.json().catch(() => ({}));
    if (r.ok) {
      const cand = json.candidates?.[0];
      const text = (cand?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
      if (text) return text;
      // Bị chặn bởi bộ lọc an toàn hoặc trả về rỗng
      lastError = new GeminiError('empty', `${model}: phản hồi rỗng (finishReason=${cand?.finishReason || json.promptFeedback?.blockReason || '?'})`);
      console.warn('[ai] Gemini', lastError.message);
      break;
    }
    lastError = classifyGeminiError(r.status, json?.error);
    console.error(`[ai] Gemini ${model} ${lastError.kind} (${r.status}):`, lastError.message);
    // Key sai/hết hạn hoặc request sai: đổi model cũng không giúp được -> dừng luôn.
    if (lastError.kind === 'auth' || lastError.kind === 'request') break;
  }
  throw lastError || new GeminiError('unknown', 'Không gọi được Gemini');
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

    // 1) Gộp thông tin khách đã nói trong cả cuộc trò chuyện. Chưa đủ 2/3 nhóm, hoặc PC mà chưa biết card đồ họa
    //    -> hỏi lại, không gợi ý game (chỉ biết CPU thì không đánh giá được game nào chạy nổi).
    const profile = extractProfile([...history.filter(h => h.role === 'user').map(h => h.text), message]);
    if (groupCount(profile) < 2 || needsGpu(profile)) return res.json({ reply: clarifyReply(profile), source: 'clarify' });

    // 2) Đủ thông tin -> gợi ý, chỉ từ danh sách game của cửa hàng.
    const catalog = await getCatalog();
    if (!catalog.rows.length) return res.json({ reply: 'Mình chưa tải được danh sách game của 5GUYS lúc này nên chưa gợi ý được. Bạn thử lại sau ít phút nhé!' });

    if (env.GEMINI_API_KEY) {
      const contents = [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: message }] }
      ];
      try {
        const raw = await askGemini(contents, systemPrompt(catalogText(catalog, profile), profile));
        // Game ngoài cửa hàng được phép, nhưng luôn phải có nhãn "(Hiện không bán tại web)" (tự thêm nếu Gemini quên).
        const reply = markExternalGames(raw, catalog.rows);
        const weak = tooWeakPicks(reply, profile);
        if (!weak.length) return res.json({ reply, source: 'gemini' });
        console.warn('[ai] Gemini gợi ý game máy khách không chạy nổi, dùng gợi ý theo luật:', weak);
      } catch (e) {
        // Key hết hạn / lỗi mạng / Gemini lỗi: chỉ ghi log ở server, khách vẫn nhận được gợi ý theo luật.
        console.error(`[ai] Gemini lỗi (${e.kind || e.name}), dùng gợi ý theo luật:`, e.message);
      }
    }

    // 3) Không có key / Gemini lỗi / Gemini gợi ý game quá nặng -> gợi ý theo luật (dựa trên cấu hình thật của từng game).
    res.json({ reply: recommend(profile, catalog.rows), source: 'rules' });
  } catch (e) {
    next(e);
  }
});

export default router;
