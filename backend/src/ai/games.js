/* PC2GAMES AI — dữ liệu phần cứng để ước tính game nào chạy được trên máy khách.
 *
 * Điểm GPU là hiệu năng TƯƠNG ĐỐI, lấy GTX 1060 6GB = 100 (ước lượng từ các bảng so sánh phổ biến, độ phân giải 1080p).
 * Cấu hình game lấy theo yêu cầu tối thiểu / khuyến nghị công bố trên Steam (làm tròn).
 * Bảng game_requirements trong DB hiện chỉ là dữ liệu mẫu giống nhau cho mọi game, nên KHÔNG dùng để đánh giá.
 * Thêm game mới vào cửa hàng -> thêm một dòng vào STORE_SPECS. Game nào không có ở đây sẽ được coi là "chưa rõ cấu hình". */

export const EXTERNAL_TAG = '(Hiện không bán tại web)';

const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

/* ---------- Điểm hiệu năng GPU ---------- */
const GPU_TABLE = {
  gt: { 710: 5, 730: 8, 1030: 20 },
  gtx: {
    460: 25, 465: 27, 470: 30, 550: 20, 560: 30, 570: 42, 580: 48, 650: 22, 660: 38, 670: 52, 680: 58,
    750: 28, 760: 48, 770: 58, 780: 68, 950: 45, 960: 52, 970: 75, 980: 88,
    1050: 38, 1060: 100, 1070: 130, 1080: 160, 1630: 30, 1650: 62, 1660: 100
  },
  rtx: {
    2050: 60, 2060: 135, 2070: 160, 2080: 190, 3050: 110, 3060: 155, 3070: 220, 3080: 275, 3090: 310,
    4050: 140, 4060: 185, 4070: 275, 4080: 400, 4090: 500, 5050: 170, 5060: 220, 5070: 330, 5080: 450, 5090: 600
  },
  rx: {
    460: 35, 470: 75, 480: 88, 550: 30, 560: 38, 570: 85, 580: 95, 590: 102, 5500: 85, 5600: 135, 5700: 160,
    6400: 45, 6500: 60, 6600: 150, 6650: 165, 6700: 200, 6750: 210, 6800: 270, 6900: 300,
    7600: 175, 7700: 240, 7800: 290, 7900: 370, 9060: 230, 9070: 350
  }
};
// Bản Ti / Super / XT mạnh hơn bản thường
const SUFFIX_BONUS = { ti: 1.15, super: 1.12, xt: 1.1 };
const SUFFIX_EXACT = { 'gtx 750 ti': 33, 'gtx 1050 ti': 48, 'gtx 1650 super': 82, 'gtx 1660 super': 110, 'gtx 1660 ti': 112, 'gtx 1070 ti': 145, 'gtx 1080 ti': 205, 'rtx 2060 super': 155, 'rtx 2070 super': 178, 'rtx 2080 ti': 240, 'rtx 3060 ti': 195, 'rtx 4060 ti': 215, 'rtx 4070 super': 310, 'rtx 4070 ti': 325, 'rtx 5060 ti': 250, 'rtx 5070 ti': 400 };
export const IGPU_SCORE = 12; // card tích hợp (UHD / Iris Xe / Vega) – ước lượng thận trọng

export function gpuScore(gpu, { laptop = false } = {}) {
  if (!gpu) return null;
  const label = fold(gpu.label).replace(/\s+/g, ' ').trim();
  let score = SUFFIX_EXACT[label];
  if (score == null) {
    const table = GPU_TABLE[gpu.brand] || GPU_TABLE.gtx;
    // Không có trong bảng -> lấy mẫu gần nhất phía dưới (ước lượng thận trọng)
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    const near = keys.filter(k => k <= gpu.num).pop() ?? keys[0];
    score = table[near];
    const suf = (label.match(/\b(ti|super|xt)\b/) || [])[1];
    if (suf) score *= SUFFIX_BONUS[suf];
  }
  // GPU laptop thường yếu hơn bản desktop cùng tên khoảng 15–25%
  return Math.round(laptop ? score * 0.8 : score);
}

/* ---------- Cấu hình game trong cửa hàng (theo Steam) ---------- */
// min/rec: [tên card tham chiếu, điểm], ram: [tối thiểu, khuyến nghị] GB
export const STORE_SPECS = {
  'hollow knight': { min: ['GeForce 9800 GTX+', 10], rec: ['GTX 560', 30], ram: [4, 8] },
  'hollow knight: silksong': { min: ['GTX 650', 15], rec: ['GTX 1050', 38], ram: [4, 8] },
  'neon viper': { min: ['card tích hợp', 8], rec: ['GTX 750 Ti', 33], ram: [4, 8] },
  'dark souls remastered': { min: ['GTX 460', 25], rec: ['GTX 660', 38], ram: [6, 8] },
  'dark souls ii: scholar of the first sin': { min: ['GTX 465', 27], rec: ['GTX 750', 30], ram: [4, 8] },
  'dark souls iii': { min: ['GTX 750 Ti', 33], rec: ['GTX 970', 75], ram: [4, 8] },
  'sekiro: shadows die twice': { min: ['GTX 760', 48], rec: ['GTX 970', 75], ram: [4, 8] },
  'red dead redemption': { min: ['GTX 960', 52], rec: ['GTX 1060 6GB', 100], ram: [8, 12] },
  'red dead redemption 2': { min: ['GTX 770', 58], rec: ['GTX 1060 6GB', 100], ram: [8, 12] },
  'elden ring': { min: ['GTX 1060 3GB', 90], rec: ['GTX 1070', 130], ram: [12, 16] },
  'black myth: wukong': { min: ['GTX 1060 6GB', 100], rec: ['RTX 2060', 135], ram: [16, 16] }
};
export const storeSpec = title => STORE_SPECS[fold(title)] || null;

/* ---------- Game KHÔNG bán tại 5GUYS, dùng để gợi ý thêm (luôn gắn EXTERNAL_TAG) ---------- */
// genres phải trùng với label trong GENRES của advisor.js
export const EXTERNAL_GAMES = [
  { title: 'Stardew Valley', genres: ['nhẹ nhàng, thư giãn', 'nhập vai', 'chơi cùng bạn bè', 'indie'], min: 5, rec: 10, ram: [2, 4] },
  { title: 'Terraria', genres: ['phiêu lưu', 'Metroidvania / 2D', 'chơi cùng bạn bè', 'indie'], min: 5, rec: 12, ram: [4, 4] },
  { title: 'Undertale', genres: ['nhập vai', 'cốt truyện hay', 'indie'], min: 3, rec: 5, ram: [2, 3] },
  { title: 'Hades', genres: ['hành động', 'thử thách khó', 'cốt truyện hay', 'indie'], min: 12, rec: 30, ram: [4, 8] },
  { title: 'Dead Cells', genres: ['hành động', 'Metroidvania / 2D', 'thử thách khó', 'indie'], min: 8, rec: 20, ram: [2, 4] },
  { title: 'Celeste', genres: ['Metroidvania / 2D', 'thử thách khó', 'indie'], min: 5, rec: 10, ram: [2, 4] },
  { title: 'Cuphead', genres: ['hành động', 'thử thách khó', 'chơi cùng bạn bè', 'Metroidvania / 2D'], min: 10, rec: 25, ram: [3, 4] },
  { title: 'Salt and Sanctuary', genres: ['Souls-like', 'Metroidvania / 2D', 'thử thách khó', 'indie'], min: 5, rec: 15, ram: [2, 4] },
  { title: 'Ori and the Will of the Wisps', genres: ['phiêu lưu', 'Metroidvania / 2D'], min: 45, rec: 75, ram: [8, 8] },
  { title: 'The Witcher 3: Wild Hunt', genres: ['nhập vai', 'thế giới mở', 'cốt truyện hay', 'phiêu lưu'], min: 38, rec: 58, ram: [6, 8] },
  { title: 'The Elder Scrolls V: Skyrim Special Edition', genres: ['nhập vai', 'thế giới mở', 'phiêu lưu'], min: 30, rec: 68, ram: [8, 8] },
  { title: 'Divinity: Original Sin 2', genres: ['nhập vai', 'chiến thuật', 'chơi cùng bạn bè', 'cốt truyện hay'], min: 30, rec: 58, ram: [4, 8] },
  { title: "Baldur's Gate 3", genres: ['nhập vai', 'cốt truyện hay', 'chơi cùng bạn bè', 'chiến thuật'], min: 75, rec: 135, ram: [8, 16] },
  { title: 'Lies of P', genres: ['Souls-like', 'hành động', 'thử thách khó'], min: 52, rec: 112, ram: [8, 16] },
  { title: 'It Takes Two', genres: ['chơi cùng bạn bè', 'phiêu lưu', 'giải đố'], min: 38, rec: 88, ram: [8, 16] },
  { title: 'Portal 2', genres: ['giải đố', 'chơi cùng bạn bè'], min: 10, rec: 20, ram: [2, 4] },
  { title: 'Forza Horizon 4', genres: ['đua xe', 'thế giới mở'], min: 30, rec: 75, ram: [8, 12] },
  { title: 'Rocket League', genres: ['thể thao', 'đua xe', 'chơi cùng bạn bè'], min: 25, rec: 60, ram: [4, 8] },
  { title: 'Valorant', genres: ['bắn súng', 'chơi cùng bạn bè'], min: 8, rec: 48, ram: [4, 8] },
  { title: 'Counter-Strike 2', genres: ['bắn súng', 'chơi cùng bạn bè'], min: 35, rec: 80, ram: [8, 16] },
  { title: 'Left 4 Dead 2', genres: ['bắn súng', 'kinh dị', 'chơi cùng bạn bè'], min: 10, rec: 25, ram: [2, 4] },
  { title: 'Phasmophobia', genres: ['kinh dị', 'chơi cùng bạn bè'], min: 75, rec: 100, ram: [8, 16] },
  { title: 'Resident Evil 4 (2023)', genres: ['kinh dị', 'hành động'], min: 48, rec: 130, ram: [8, 16] },
  { title: "Sid Meier's Civilization VI", genres: ['chiến thuật'], min: 30, rec: 58, ram: [4, 8] },
  { title: 'Age of Empires II: Definitive Edition', genres: ['chiến thuật'], min: 8, rec: 22, ram: [4, 8] }
];

/* ---------- Ước tính mức đồ họa ---------- */
// Trả về null nếu máy KHÔNG đủ cấu hình tối thiểu; ngược lại trả về mô tả mức đồ họa ở 1080p.
export function estimate(score, ram, min, rec, ramReq) {
  if (score == null) return { ok: true, level: 'chưa rõ', text: 'chưa ước tính được (thiếu thông tin card đồ họa)' };
  if (score < min * 0.9 || (ram && ramReq && ram < ramReq[0])) return null;
  let level;
  if (score < rec) level = 'low';
  else if (score < rec * 1.6) level = 'high';
  else level = 'ultra';
  // RAM dưới mức khuyến nghị thì không nên kỳ vọng thiết lập cao
  if (ram && ramReq && ram < ramReq[1] && level === 'ultra') level = 'high';
  const TEXT = { low: 'Low–Medium, khoảng 30–45 FPS', high: 'High, khoảng 60 FPS', ultra: 'High–Ultra, 60+ FPS' };
  return { ok: true, level, text: TEXT[level] + ' (1080p)' };
}

export function tierFromScore(score) {
  if (score == null) return null;
  return score < 45 ? 'low' : score < 130 ? 'mid' : 'high';
}
