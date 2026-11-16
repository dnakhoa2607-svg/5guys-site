/* PC2GAMES AI — phần xử lý không phụ thuộc mô hình AI:
 *  - extractProfile: rút 3 nhóm thông tin (cấu hình máy / thể loại-sở thích / ngân sách-hình thức mua)
 *    từ TẤT CẢ tin nhắn của khách trong cuộc trò chuyện.
 *  - clarifyReply: khi chưa đủ 2/3 nhóm -> nhắc lại thông tin đã có + hỏi nhóm còn thiếu (tối đa 2 câu).
 *  - recommend: gợi ý theo luật, CHỈ từ danh sách game trong DB (dùng khi không có/không gọi được Gemini).
 *  - unknownGameNames: kiểm tra câu trả lời của Gemini có nêu game ngoài cửa hàng hay không. */

// Bỏ dấu tiếng Việt để khớp cả khi khách gõ không dấu ("nhap vai", "duoi 1 trieu").
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
  const p = { cpu: null, gpu: null, igpu: false, ram: null, device: null, genres: [], budget: null, cheap: false, format: null };
  for (const raw of userTexts) {
    const lower = String(raw || '').toLowerCase();
    let t = fold(raw);

    let m;
    if ((m = t.match(GPU_RE))) {
      p.gpu = { brand: m[1], num: +m[2], label: `${m[1].toUpperCase()} ${m[2]}${m[3] ? ' ' + m[3].toUpperCase() : ''}` };
      t = t.replace(new RegExp(GPU_RE.source + '(\\s*\\d+\\s*gb)?'), ' ');
    } else if ((m = t.match(GPU_BARE_RE))) {
      p.gpu = { brand: +m[1] >= 2000 ? 'rtx' : 'gtx', num: +m[1], label: `${+m[1] >= 2000 ? 'RTX' : 'GTX'} ${m[1]}${m[2] ? ' Ti' : ''}` };
      t = t.replace(m[0], ' ');
    }
    if (IGPU_RE.test(t)) p.igpu = true;

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
const isConsole = p => !!p.device && !/^(PC|laptop)$/.test(p.device.label);

/* ---------- Diễn đạt lại thông tin khách đã cho ---------- */
function hardwareText(p) {
  const parts = [];
  if (p.device) parts.push(isConsole(p) ? `máy ${p.device.label}` : p.device.label);
  if (p.cpu) parts.push(`CPU ${p.cpu}`);
  if (p.gpu) parts.push(`card ${p.gpu.label}`);
  else if (p.igpu) parts.push('card đồ họa tích hợp (onboard)');
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

/* ---------- Câu hỏi lại khi chưa đủ 2/3 nhóm ---------- */
const Q_GENRE = 'Bạn thích thể loại nào (hành động, nhập vai, đua xe, chơi cùng bạn bè...)?';
const Q_GPU = 'Máy bạn có card đồ họa rời không (ví dụ GTX 1650, RTX 3060)?';
const Q_HARDWARE = 'Bạn chơi trên máy gì: PC/laptop (cho mình biết card đồ họa, ví dụ GTX 1650, RTX 3060) hay console (PS5, Xbox, Switch)?';
const Q_BUDGET = 'Ngân sách của bạn khoảng bao nhiêu (ví dụ dưới 500.000đ, dưới 1 triệu), và bạn muốn bản số hay bản đĩa?';

export function clarifyReply(p) {
  const questions = [];
  if (!hasHardware(p)) questions.push(Q_HARDWARE);
  if (!hasGenre(p)) questions.push(Q_GENRE);
  if (!hasBudget(p) && questions.length < 2) {
    // Chỉ thiếu thêm 1 nhóm nữa là đủ: nếu là PC mà chưa biết card đồ họa thì hỏi card (giúp ước tính FPS) thay cho ngân sách.
    const pcWithoutGpu = hasHardware(p) && !isConsole(p) && !p.gpu && !p.igpu;
    questions.push(pcWithoutGpu ? Q_GPU : Q_BUDGET);
  }
  const recap = recapSentence(p);
  const head = recap
    ? `${recap} Để gợi ý chính xác, bạn cho mình biết thêm:`
    : 'Mình chưa có đủ thông tin để gợi ý game hợp với bạn. Để gợi ý chính xác, bạn cho mình biết thêm:';
  return `${head}\n${questions.slice(0, 2).map(q => '- ' + q).join('\n')}`;
}

/* ---------- Gợi ý theo luật (không cần Gemini), chỉ dùng game trong DB ---------- */
function pcTier(p) {
  if (p.gpu) {
    const { brand, num } = p.gpu;
    if (brand === 'rtx') return num >= 3060 || num >= 4050 ? 'high' : 'mid';
    if (brand === 'gtx') return num >= 1060 && num !== 1630 ? 'mid' : 'low';
    if (brand === 'rx') return num >= 6600 || (num >= 5600 && num < 6000) ? 'high' : num >= 580 ? 'mid' : 'low';
    return 'low';
  }
  if (p.igpu) return 'low';
  // Chưa biết card đồ họa: CPU từ i5/Ryzen 5 trở lên tạm xếp tầm trung.
  if (p.cpu) return /i[579]|ryzen [579]|apple m/i.test(p.cpu) ? 'mid' : 'low';
  if (p.ram) return p.ram >= 16 ? 'mid' : 'low';
  return null;
}
const TIER = {
  high: { label: 'Cao cấp 🔴', setting: 'High/Ultra, khoảng 60+ FPS' },
  mid: { label: 'Tầm trung 🟡', setting: 'Medium/High, khoảng 45–60 FPS' },
  low: { label: 'Nhẹ 🟢', setting: 'Low, khoảng 30–60 FPS tùy game' }
};
const isLight = row => /metroidvania|hollow knight/.test(fold(`${row.genre} ${row.title}`));

export function recommend(p, rows) {
  const consoleMode = isConsole(p);
  const pcMode = !consoleMode && hasHardware(p);
  const tier = pcMode ? pcTier(p) : null;

  let pool = rows.filter(r => {
    const plat = fold(r.platform);
    if (consoleMode && !p.device.platform.test(plat)) return false;
    if (pcMode && !/\bpc\b/.test(plat)) return false;
    if (p.format && r.product_type !== p.format) return false;
    if (p.budget?.max && Number(r.price) > p.budget.max) return false;
    if (p.budget?.min && Number(r.price) < p.budget.min) return false;
    if (tier === 'low' && !isLight(r)) return false;
    return true;
  });

  const wanted = p.genres.filter(g => g.match);
  const unmatched = p.genres.filter(g => !g.match).map(g => g.label);
  const score = r => wanted.filter(g => g.match.test(fold(`${r.genre} ${r.title}`))).length;
  if (wanted.length && pool.some(r => score(r) > 0)) pool = pool.filter(r => score(r) > 0);
  const genreHit = wanted.length > 0 && pool.some(r => score(r) > 0);

  // Mỗi tựa chỉ lấy 1 dòng (bản rẻ nhất phù hợp), xếp theo độ khớp thể loại -> rating -> giá.
  const best = new Map();
  for (const r of pool) {
    const k = fold(r.title), cur = best.get(k);
    if (!cur || Number(r.price) < Number(cur.price)) best.set(k, r);
  }
  const picks = [...best.values()]
    .sort((a, b) => score(b) - score(a) || Number(b.rating || 0) - Number(a.rating || 0) || Number(a.price) - Number(b.price))
    .slice(0, 4);

  const lines = [];
  const recap = recapSentence(p);
  if (tier) lines.push(`${recap} Cấu hình thuộc phân khúc ${TIER[tier].label}.`);
  else lines.push(recap);
  if (unmatched.length) lines.push(`Hiện 5GUYS chưa có game thể loại ${unmatched.join(', ')}.`);

  if (!picks.length) {
    lines.push('Mình chưa tìm thấy game nào tại 5GUYS khớp đủ các tiêu chí này. Bạn thử nới ngân sách hoặc đổi hình thức mua (bản số/bản đĩa) để mình tìm lại nhé!');
    return lines.join('\n');
  }
  lines.push('Gợi ý tại 5GUYS:');
  for (const r of picks) {
    const why = [];
    const hit = wanted.filter(g => g.match.test(fold(`${r.genre} ${r.title}`))).map(g => g.label);
    if (hit.length) why.push(`đúng gu ${hit.join(', ')}`);
    else if (!genreHit) why.push(`thể loại ${r.genre}`);
    if (tier) why.push(`máy bạn chạy mức ${TIER[tier].setting}`);
    else if (consoleMode) {
      const ps4OnPs5 = p.device.label === 'PlayStation 5' && !/playstation 5/.test(fold(r.platform));
      why.push(ps4OnPs5 ? 'bản PS4, chơi được trên PS5' : `có bản cho ${p.device.label}`);
    }
    if (p.budget?.max) why.push('nằm trong ngân sách');
    const fmt = r.product_type === 'digital' ? 'bản số' : 'bản đĩa';
    lines.push(`- **${r.title}** (${r.platform}, ${fmt} ${money(r.price)}): ${why.join('; ') || r.genre}.`);
  }
  if (pcMode && !p.gpu && !p.igpu) lines.push('Mức đồ họa là ước tính vì mình chưa biết card đồ họa của bạn.');
  return lines.join('\n');
}

/* ---------- Kiểm tra câu trả lời của Gemini: mọi tên **in đậm** phải là game có trong cửa hàng ---------- */
export function unknownGameNames(reply, rows) {
  const titles = [...new Set(rows.map(r => fold(r.title)))];
  const names = [...String(reply).matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1].trim());
  return names.filter(n => {
    const f = fold(n).replace(/\s*\(.*?\)\s*/g, '').trim();
    // Cho phép tên rút gọn ("Sekiro" cho "Sekiro: Shadows Die Twice"), không cho tên dài hơn tên trong DB.
    return !titles.some(t => t === f || (f.length >= 4 && t.startsWith(f)));
  });
}
