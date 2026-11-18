/* PC2GAMES AI — phần xử lý không phụ thuộc mô hình AI:
 *  - extractProfile: rút 3 nhóm thông tin (cấu hình máy / thể loại-sở thích / ngân sách-hình thức mua)
 *    từ TẤT CẢ tin nhắn của khách trong cuộc trò chuyện.
 *  - clarifyReply: khi chưa đủ 2/3 nhóm -> nhắc lại thông tin đã có + hỏi nhóm còn thiếu (tối đa 2 câu).
 *  - recommend: gợi ý theo luật, CHỈ từ danh sách game trong DB (dùng khi không có/không gọi được Gemini).
 *  - markExternalGames / tooWeakPicks: hậu kiểm câu trả lời của Gemini (gắn nhãn game ngoài cửa hàng, chặn game quá nặng).
 *  Cấu hình thật của từng game + điểm GPU nằm ở ./games.js. */

// Bỏ dấu tiếng Việt để khớp cả khi khách gõ không dấu ("nhap vai", "duoi 1 trieu").
import { gpuScore, IGPU_SCORE, storeSpec, EXTERNAL_GAMES, EXTERNAL_TAG, estimate, tierFromScore } from './games.js';

export const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
const money = n => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + 'đ';

/* ---------- Nhóm 2: thể loại / sở thích ---------- */
// label: cách nhắc lại cho khách; re: mẫu trên chữ đã bỏ dấu; match: mẫu khớp với thể loại/tên game trong DB.
const GENRES = [
  { label: 'hành động', re: /\b(hanh dong|action|danh nhau|chien dau)\b/, match: /hanh dong|action|souls|metroidvania/ },
  { label: 'nhập vai', re: /\b(nhap vai|rpg|arpg)\b/, match: /rpg|nhap vai/ },
  { label: 'Souls-like', re: /\b(souls ?-?like|soulslike|dark souls|kieu souls)\b/, match: /souls/ },
  { label: 'thế giới mở', re: /\b(the gioi mo|open ?world)\b/, match: /the gioi mo|open world/ },
  { label: 'phiêu lưu', re: /\b(phieu luu|adventure|kham pha)\b/, match: /phieu luu|metroidvania|the gioi mo/ },
  { label: 'Metroidvania / 2D', re: /\b(metroidvania|platformer|game 2d|2d)\b/, match: /metroidvania/ },
  { label: 'cốt truyện hay', re: /\b(cot truyen|story|truyen hay|kich ban)\b/, match: /rpg|the gioi mo/ },
  { label: 'thử thách khó', re: /\b(game kho|kho nhai|thu thach|hardcore)\b/, match: /souls|metroidvania|sekiro/ },
  { label: 'miền Tây / cao bồi', re: /\b(mien tay|cao boi|western)\b/, match: /red dead/ },
  { label: 'chơi cùng bạn bè', re: /\b(choi cung ban|choi voi ban|choi chung|ban be|co-?op|nhieu nguoi|multiplayer|online)\b/, match: null },
  { label: 'đua xe', re: /\b(dua xe|racing)\b/, match: null },
  { label: 'bắn súng', re: /\b(ban sung|shooter|game fps)\b/, match: null },
  { label: 'kinh dị', re: /\b(kinh di|horror)\b/, match: null },
  { label: 'chiến thuật', re: /\b(chien thuat|strategy|rts)\b/, match: null },
  { label: 'thể thao', re: /\b(the thao|bong da|fifa)\b/, match: null },
  { label: 'giải đố', re: /\b(giai do|puzzle)\b/, match: null },
  { label: 'nhẹ nhàng, thư giãn', re: /\b(nhe nhang|thu gian|casual)\b/, match: null },
  { label: 'indie', re: /\bindie\b/, match: /metroidvania/ }
];

/* ---------- Nhóm 1: cấu hình máy ---------- */
const DEVICES = [
  { label: 'PlayStation 5', re: /\b(ps ?5|playstation ?5)\b/, platform: /playstation/ },
  { label: 'PlayStation 4', re: /\b(ps ?4|playstation ?4)\b/, platform: /playstation 4/ },
  { label: 'PlayStation', re: /\b(playstation|play station)\b/, platform: /playstation/ },
  { label: 'Xbox', re: /\bxbox\b/, platform: /xbox/ },
  { label: 'Nintendo Switch', re: /\b(switch|nintendo)\b/, platform: /switch/ },
  { label: 'laptop', re: /\b(laptop|macbook|may tinh xach tay)\b/, platform: /\bpc\b/ },
  { label: 'PC', re: /\b(pc|may tinh|desktop|may ban|steam deck)\b/, platform: /\bpc\b/ }
];
const GPU_RE = /\b(rtx|gtx|rx|gt)\s*-?\s*(\d{3,4})\s*(ti|super|xt)?\b/;
const GPU_BARE_RE = /(?:^|[^\d.,])((?:10[5-8]|16[56]|20[6-8]|30[5-9]|40[5-9]|50[5-9])0)(\s*ti)?(?![\d.,]|\s*(?:k|d|vnd|gb|tr|trieu|nghin|ngan)\b)/;
const IGPU_RE = /\b(iris|uhd|vega|onboard|card onboard|khong co card|ko co card|k co card|igpu|card tich hop)\b/;

/* ---------- Nhóm 3: ngân sách / hình thức mua ---------- */
const BUDGET_WORD_RE = /\b(gia re|re thoi|tiet kiem|giam gia|dang sale|khuyen mai)\b|(^|[^\p{L}])rẻ([^\p{L}]|$)/u;
const DIGITAL_RE = /\b(ban so|ky thuat so|digital|key|steam key|ma kich hoat)\b/;
const PHYSICAL_RE = /\b(ban dia|dia game|game dia|mua dia|dia vat ly|ban vat ly|vat ly|physical|hop dia)\b/;

// Phụ kiện/linh kiện: 5GUYS không bán, chỉ bán game.
const ACCESSORY_RE = /\b(chuot|ban phim|tai nghe|headphone|keyboard|mouse|lot chuot|man hinh|loa|webcam|micro|ghe gaming|tay cam|gamepad|linh kien|nguon may tinh|vo case)\b/;
const BUY_HW_RE = /\b(mua|ban|gia)\s+(ram|cpu|chip|vga|card|o cung|ssd|main|mainboard|laptop|pc|may tinh)\b/;

function parseBudget(t) {
  // Cách nói tắt "1tr2", "1 triệu 5" = 1,2 / 1,5 triệu
  t = t.replace(/(\d+)\s*(trieu|tr|cu)\s*(\d)(?!\d)/g, '$1.$3 trieu');
  // số tiền + đơn vị, hoặc số đi sau từ khóa ngân sách ("dưới 500", "tối đa 800k")
  const re = /(duoi|toi da|khong qua|tam|khoang|ngan sach|gia|tien|budget|tren|tu|<=?|>=?)?\s*(\d+(?:[.,]\d+)*)\s*(trieu|tr|cu|k|nghin|ngan|ngin|vnd|dong|d)?(?![\p{L}\d])/gu;
  let m;
  while ((m = re.exec(t))) {
    const [, kw, num, unit] = m;
    if (!kw && !unit) continue;
    let v;
    if (/^(trieu|tr|cu)$/.test(unit || '')) v = parseFloat(num.replace(',', '.')) * 1e6;
    else if (/^(k|nghin|ngan|ngin)$/.test(unit || '')) v = parseFloat(num.replace(',', '.')) * 1e3;
    else { v = parseInt(num.replace(/[.,]/g, ''), 10); if (!unit && v < 5000) v *= 1000; }
    if (!(v >= 10000 && v <= 100e6)) continue;
    return /^(tren|tu|>=?)$/.test(kw || '') ? { min: v } : { max: v };
  }
  return null;
}

export function extractProfile(userTexts) {
  const p = { cpu: null, gpu: null, igpu: false, ram: null, device: null, genres: [], budget: null, cheap: false, format: null, wantsHardware: false };
  for (const raw of userTexts) {
    const lower = String(raw || '').toLowerCase();
    let t = fold(raw);
    if (ACCESSORY_RE.test(t) || BUY_HW_RE.test(t)) p.wantsHardware = true;

    let m;
    if ((m = t.match(GPU_RE))) {
      p.gpu = { brand: m[1], num: +m[2], label: `${m[1].toUpperCase()} ${m[2]}${m[3] ? ' ' + m[3].toUpperCase() : ''}` };
      // Bỏ cả dung lượng VRAM đi kèm ("rtx 3060 12gb"), nhưng "16gb ram" ngay sau tên card là RAM, phải giữ lại
      t = t.replace(new RegExp(GPU_RE.source + '(\\s*\\d+\\s*gb(?!\\s*ram))?'), ' ');
    } else if ((m = t.match(GPU_BARE_RE))) {
      p.gpu = { brand: +m[1] >= 2000 ? 'rtx' : 'gtx', num: +m[1], label: `${+m[1] >= 2000 ? 'RTX' : 'GTX'} ${m[1]}${m[2] ? ' Ti' : ''}` };
      t = t.replace(m[0], ' ');
    }
    if (IGPU_RE.test(t)) p.igpu = true;
    // Khách nói không biết card đồ họa -> vẫn gợi ý, nhưng ước tính thận trọng như card tích hợp
    // (chỉ khi câu trả lời ngắn kiểu "không biết", hoặc có nhắc tới card, để không nhầm với "không biết chơi gì")
    const dunno = /\b(khong|ko|k|chua|hong)\s*(biet|ro|nho)\b/.test(t);
    if (dunno && (t.trim().length <= 20 || /\b(card|vga|gpu|do hoa)\b/.test(t))) p.gpuUnknown = true;

    if ((m = t.match(/\b(?:core\s*)?(i[3579])(?:\s*-?\s*(\d{4,5}[a-z]{0,2}))?\b/))) p.cpu = `Core ${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}`;
    else if ((m = t.match(/\bryzen\s*([3579])(?:\s*(\d{4}[a-z]{0,2}))?\b/))) p.cpu = `Ryzen ${m[1]}${m[2] ? ' ' + m[2].toUpperCase() : ''}`;
    else if ((m = t.match(/\b(pentium|celeron|athlon|xeon)\b/))) p.cpu = m[1][0].toUpperCase() + m[1].slice(1);
    else if ((m = t.match(/\b(?:apple|macbook)\s*(m[1-4])(\s*(?:pro|max))?\b/))) p.cpu = `Apple ${m[1].toUpperCase()}${m[2] || ''}`;

    if ((m = t.match(/\bram\s*:?\s*(\d{1,3})\s*g(?:b)?\b/) || t.match(/\b(\d{1,3})\s*g(?:b)?\s*ram\b/) ||
        t.match(/\b(4|6|8|12|16|24|32|48|64)\s*gb\b(?!\s*(ssd|hdd|vram|o cung|luu tru))/))) p.ram = +m[1];

    for (const d of DEVICES) if (d.re.test(t)) { p.device = d; break; }

    for (const g of GENRES) if (g.re.test(t) && !p.genres.includes(g)) p.genres.push(g);

    const b = parseBudget(t);
    if (b) p.budget = b;
    if (BUDGET_WORD_RE.test(t) || BUDGET_WORD_RE.test(lower)) p.cheap = true;
    if (DIGITAL_RE.test(t)) p.format = 'digital';
    else if (PHYSICAL_RE.test(t) || (/đĩa/.test(lower) && !/ổ đĩa|đĩa cứng|đĩa trống/.test(lower))) p.format = 'physical';
  }
  return p;
}

export const hasHardware = p => !!(p.cpu || p.gpu || p.igpu || p.ram || p.device);
export const hasGenre = p => p.genres.length > 0;
export const hasBudget = p => !!(p.budget || p.cheap || p.format);
export const groupCount = p => [hasHardware(p), hasGenre(p), hasBudget(p)].filter(Boolean).length;
export const isConsole = p => !!p.device && !/^(PC|laptop)$/.test(p.device.label);
// PC/laptop mà chưa biết card đồ họa thì KHÔNG đánh giá được game nào chạy nổi -> phải hỏi card trước khi gợi ý.
export const needsGpu = p => hasHardware(p) && !isConsole(p) && !p.gpu && !p.igpu && !p.gpuUnknown;
// Điểm hiệu năng GPU của máy khách (null với console hoặc chưa rõ)
export function userGpuScore(p) {
  if (isConsole(p) || !hasHardware(p)) return null;
  if (p.gpu) return gpuScore(p.gpu, { laptop: p.device?.label === 'laptop' });
  if (p.igpu || p.gpuUnknown) return IGPU_SCORE;
  return null;
}

/* ---------- Diễn đạt lại thông tin khách đã cho ---------- */
function hardwareText(p) {
  const parts = [];
  if (p.device) parts.push(isConsole(p) ? `máy ${p.device.label}` : p.device.label);
  if (p.cpu) parts.push(`CPU ${p.cpu}`);
  if (p.gpu) parts.push(`card ${p.gpu.label}`);
  else if (p.igpu) parts.push('card đồ họa tích hợp (onboard)');
  else if (p.gpuUnknown && parts.length) parts.push('chưa rõ card đồ họa');
  if (p.ram) parts.push(`RAM ${p.ram}GB`);
  return parts.join(', ');
}
function budgetText(p) {
  const parts = [];
  if (p.budget?.max) parts.push(`ngân sách dưới ${money(p.budget.max)}`);
  else if (p.budget?.min) parts.push(`ngân sách từ ${money(p.budget.min)} trở lên`);
  else if (p.cheap) parts.push('ưu tiên game giá rẻ');
  if (p.format) parts.push(p.format === 'digital' ? 'mua bản số (key)' : 'mua bản đĩa');
  return parts.join(', ');
}
export function profileSummary(p) {
  return [
    `- Cấu hình máy: ${hardwareText(p) || '(chưa có)'}`,
    `- Thể loại/sở thích: ${p.genres.map(g => g.label).join(', ') || '(chưa có)'}`,
    `- Ngân sách/hình thức mua: ${budgetText(p) || '(chưa có)'}`
  ].join('\n');
}
function recapSentence(p) {
  const bits = [];
  const hw = hardwareText(p);
  if (hw) bits.push(`bạn dùng ${hw}`);
  if (hasGenre(p)) bits.push(`thích game ${p.genres.map(g => g.label).join(', ')}`);
  const bd = budgetText(p);
  if (bd) bits.push(bd);
  if (!bits.length) return '';
  const s = bits.join('; ');
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------- Câu hỏi lại khi chưa đủ thông tin ---------- */
const Q_GENRE = 'Bạn thích thể loại nào (hành động, nhập vai, đua xe, chơi cùng bạn bè...)?';
const Q_GPU = 'Máy bạn dùng card đồ họa nào (ví dụ GTX 1650, RTX 3060)? Chỉ có CPU thì mình chưa biết game nào chạy mượt. Nếu không có card rời, bạn cứ nói "card onboard" nhé.';
const Q_HARDWARE = 'Bạn chơi trên máy gì: PC/laptop (cho mình biết card đồ họa, ví dụ GTX 1650, RTX 3060) hay console (PS5, Xbox, Switch)?';
const Q_BUDGET = 'Ngân sách của bạn khoảng bao nhiêu (ví dụ dưới 500.000đ, dưới 1 triệu), và bạn muốn bản số hay bản đĩa?';

export function clarifyReply(p) {
  const questions = [];
  if (!hasHardware(p)) questions.push(Q_HARDWARE);
  else if (needsGpu(p)) questions.push(Q_GPU);
  if (!hasGenre(p)) questions.push(Q_GENRE);
  if (!hasBudget(p) && groupCount(p) < 2 && questions.length < 2) questions.push(Q_BUDGET);
  const recap = recapSentence(p);
  const scope = p.wantsHardware
    ? '5GUYS hiện chỉ bán game (bản số và bản đĩa), chưa bán phụ kiện hay linh kiện máy tính. Mình có thể gợi ý game hợp với máy của bạn. '
    : '';
  const head = recap
    ? `${scope}${recap} Để gợi ý chính xác, bạn cho mình biết thêm:`
    : `${scope || 'Mình chưa có đủ thông tin để gợi ý game hợp với bạn. '}Để gợi ý chính xác, bạn cho mình biết thêm:`;
  return `${head}\n${questions.slice(0, 2).map(q => '- ' + q).join('\n')}`;
}

/* ---------- Đánh giá từng game theo cấu hình thật của máy khách ---------- */
const TIER_LABEL = { high: 'Cao cấp 🔴', mid: 'Tầm trung 🟡', low: 'Nhẹ 🟢' };
const reqText = spec => `${spec.min[0]}, ${spec.ram[0]}GB RAM`;

// Ghi chú cấu hình cho 1 game trong cửa hàng, dùng trong lời nhắc gửi Gemini.
export function specNote(title, p) {
  const spec = storeSpec(title);
  if (!spec) return 'cấu hình: chưa có dữ liệu';
  let note = `cấu hình Steam: tối thiểu ${reqText(spec)}; khuyến nghị ${spec.rec[0]}, ${spec.ram[1]}GB RAM`;
  const score = userGpuScore(p);
  if (score != null) {
    const est = estimate(score, p.ram, spec.min[1], spec.rec[1], spec.ram);
    note += est ? ` | với máy khách: ${est.text}` : ' | với máy khách: KHÔNG ĐỦ cấu hình, không được gợi ý';
  }
  return note;
}

/* ---------- Gợi ý theo luật (không cần Gemini) ---------- */
export function recommend(p, rows) {
  const consoleMode = isConsole(p);
  const pcMode = !consoleMode && hasHardware(p);
  const score = pcMode ? userGpuScore(p) : null;
  const tier = tierFromScore(score);
  const wanted = p.genres;
  const storeHits = r => wanted.filter(g => g.match && g.match.test(fold(`${r.genre} ${r.title}`))).map(g => g.label);
  const extHits = e => wanted.filter(g => e.genres.includes(g.label)).map(g => g.label);

  // 1) Game trong cửa hàng: lọc theo nền tảng / hình thức / ngân sách, rồi theo khả năng chạy của máy.
  const tooWeak = new Map();
  let pool = [];
  for (const r of rows) {
    const plat = fold(r.platform);
    if (consoleMode && !p.device.platform.test(plat)) continue;
    if (pcMode && !/\bpc\b/.test(plat)) continue;
    if (p.format && r.product_type !== p.format) continue;
    if (p.budget?.max && Number(r.price) > p.budget.max) continue;
    if (p.budget?.min && Number(r.price) < p.budget.min) continue;
    let est = null;
    if (pcMode) {
      const spec = storeSpec(r.title);
      if (spec) {
        est = estimate(score, p.ram, spec.min[1], spec.rec[1], spec.ram);
        if (!est) { tooWeak.set(fold(r.title), { r, spec }); continue; }
      }
    }
    pool.push({ r, est, hits: storeHits(r) });
  }
  if (wanted.length && pool.some(x => x.hits.length)) pool = pool.filter(x => x.hits.length);

  // Mỗi tựa 1 dòng (bản rẻ nhất), xếp theo độ khớp thể loại -> rating -> giá
  const best = new Map();
  for (const x of pool) {
    const k = fold(x.r.title), cur = best.get(k);
    if (!cur || Number(x.r.price) < Number(cur.r.price)) best.set(k, x);
  }
  const storePicks = [...best.values()]
    .sort((a, b) => b.hits.length - a.hits.length || Number(b.r.rating || 0) - Number(a.r.rating || 0) || Number(a.r.price) - Number(b.r.price))
    .slice(0, 3);

  // 2) Game ngoài cửa hàng (chỉ cho PC, chỉ khi biết thể loại khách thích), luôn gắn nhãn "Hiện không bán tại web".
  let extPicks = [];
  if (pcMode && wanted.length) {
    const LV = { ultra: 3, high: 2, low: 1 };
    extPicks = EXTERNAL_GAMES
      .map(e => ({ e, est: estimate(score, p.ram, e.min, e.rec, e.ram), hits: extHits(e) }))
      .filter(x => x.est && x.hits.length)
      .sort((a, b) => b.hits.length - a.hits.length || (LV[b.est.level] || 0) - (LV[a.est.level] || 0))
      .slice(0, storePicks.length >= 3 ? 1 : storePicks.length ? 2 : 3);
  }

  // 3) Trình bày
  const lines = [];
  let head = recapSentence(p);
  if (tier && p.gpu) head += ` Card ${p.gpu.label}${p.device?.label === 'laptop' ? ' (bản laptop)' : ''} thuộc phân khúc ${TIER_LABEL[tier]}.`;
  else if (tier) head += ` Máy thuộc phân khúc ${TIER_LABEL[tier]}.`;
  lines.push(head);
  if (p.gpuUnknown && !p.gpu && !p.igpu) lines.push('Vì chưa rõ card đồ họa, mình ước tính thận trọng như máy dùng card tích hợp.');

  if (!storePicks.length && !extPicks.length) {
    lines.push('Mình chưa tìm thấy game nào khớp đủ các tiêu chí và chạy ổn trên máy này. Bạn thử nới ngân sách, đổi hình thức mua (bản số/bản đĩa) hoặc thể loại để mình tìm lại nhé!');
  } else {
    if (storePicks.length) lines.push('Gợi ý tại 5GUYS:');
    else lines.push('Hiện 5GUYS chưa có game hợp với máy và gu của bạn. Bạn có thể tham khảo:');
    for (const { r, est, hits } of storePicks) {
      const why = [];
      if (hits.length) why.push(`đúng gu ${hits.join(', ')}`);
      else why.push(`thể loại ${r.genre}`);
      if (est) why.push(`máy bạn chạy mức ${est.text}`);
      else if (pcMode) why.push('chưa có dữ liệu cấu hình để ước tính');
      else if (consoleMode) {
        const ps4OnPs5 = p.device.label === 'PlayStation 5' && !/playstation 5/.test(fold(r.platform));
        why.push(ps4OnPs5 ? 'bản PS4, chơi được trên PS5' : `có bản cho ${p.device.label}`);
      }
      if (p.budget?.max) why.push('nằm trong ngân sách');
      const fmt = r.product_type === 'digital' ? 'bản số' : 'bản đĩa';
      lines.push(`- **${r.title}** (${r.platform}, ${fmt} ${money(r.price)}): ${why.join('; ')}.`);
    }
    if (extPicks.length) {
      if (storePicks.length) lines.push('Gợi ý thêm ngoài cửa hàng:');
      for (const { e, est, hits } of extPicks) lines.push(`- **${e.title}** ${EXTERNAL_TAG}: ${hits.join(', ')}; máy bạn chạy mức ${est.text}.`);
    }
  }

  // Nói rõ game nào trong cửa hàng hợp gu nhưng máy chưa đủ sức
  const weak = [...tooWeak.values()].filter(({ r }) => !wanted.length || storeHits(r).length).slice(0, 3);
  if (weak.length) lines.push(`Chưa nên chọn: ${weak.map(({ r, spec }) => `${r.title} (cần tối thiểu ${reqText(spec)})`).join('; ')}.`);
  if (pcMode && (storePicks.some(x => x.est) || extPicks.length)) lines.push('Mức đồ họa và FPS là ước tính ở 1080p.');
  return lines.join('\n');
}

/* ---------- Hậu kiểm câu trả lời của Gemini ---------- */
// Mọi tên **in đậm** không có trong cửa hàng phải kèm nhãn "(Hiện không bán tại web)"; game có bán thì không được gắn nhãn này.
const TAG_RE_SRC = '\\s*\\(\\s*hiện không bán tại web\\s*\\)';
export function markExternalGames(reply, rows) {
  const titles = [...new Set(rows.map(r => fold(r.title)))];
  const inStore = name => {
    const f = fold(name).replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    // Cho phép tên rút gọn ("Sekiro" cho "Sekiro: Shadows Die Twice")
    return titles.some(t => t === f || (f.length >= 4 && t.startsWith(f)));
  };
  return String(reply).replace(new RegExp(`\\*\\*(.+?)\\*\\*(${TAG_RE_SRC})?`, 'giu'), (m, name) => {
    const clean = name.replace(new RegExp(TAG_RE_SRC, 'iu'), '').trim();
    return inStore(clean) ? `**${clean}**` : `**${clean}** ${EXTERNAL_TAG}`;
  });
}

// Gemini có lỡ gợi ý (in đậm) game của cửa hàng mà máy khách KHÔNG đủ cấu hình không? Trả về danh sách tên vi phạm.
export function tooWeakPicks(reply, p) {
  const score = userGpuScore(p);
  if (score == null) return [];
  return [...String(reply).matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1].trim()).filter(name => {
    const spec = storeSpec(name);
    return spec && !estimate(score, p.ram, spec.min[1], spec.rec[1], spec.ram);
  });
}
