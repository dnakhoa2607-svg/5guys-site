# 5GUYS — Website Thương mại Điện tử Phân phối Game Bản quyền (Số & Vật lý)

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0%2B%20(31%20b%E1%BA%A3ng)-4479A1?logo=mysql&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%2B%20Tailwind%20%2B%20Vanilla%20JS-9d4edd)
![2FA](https://img.shields.io/badge/Auth-Bcrypt%20%2B%20JWT%20%2B%202FA%20TOTP-c77dff)

> **Đồ án Giữa kỳ Môn Nhập môn Công nghệ Thông tin**  
> **Đơn vị thực hiện:** Nhóm **5Guys** — Lớp **26C01**, Khoa Công nghệ Thông tin, Trường Đại học Khoa học Tự nhiên — ĐHQG TP.HCM (HCMUS).

---

## 1. Giới thiệu Tổng quan & Kiến trúc Hệ thống

**5GUYS Vault** là nền tảng thương mại điện tử mô hình **Hybrid Game Store**, phân phối song song trên cùng một giỏ hàng và đơn hàng:
- **Game Kỹ thuật số (`digital`):** Cấp mã bản quyền (`5GUYS DRM Safe Key`) trực tiếp vào Kho game (`game_library`), hỗ trợ mua tặng bạn bè và cập nhật Bản vá (Patch) / DLC.
- **Game Vật lý / Băng đĩa (`physical`):** Quản lý tồn kho khả dụng (`quantity_on_hand - quantity_reserved`), giữ chỗ theo transaction khi đặt hàng, chọn phương thức giao vận (Tiêu chuẩn `30.000đ` / Hỏa tốc `60.000đ`) và lưu bản chụp địa chỉ hành chính độc lập trong đơn hàng.

### Kiến trúc 3 tầng

| Tầng | Công nghệ & Thành phần | Quy mô thực tế |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Tailwind CSS CDN, Font Awesome 6.4.0, Google Fonts (`Inter`), Vanilla JS ES5/ES6, `otpauth` 9.2.2, `qrcodejs` 1.0.0 | **20 trang HTML** + **3 mini-game HTML5** (`frontend/games/`) + **11 asset JS/CSS** (`frontend/assets/`) |
| **Backend** | Node.js `>= 20` (ES Modules), Express `4.21`, MySQL2 `3.12`, Zod `4.6`, JWT, Bcryptjs (cost 12), Helmet, CORS, Express Rate Limit | **11 module route** (`backend/src/api/`), middleware bảo mật & bộ phân tích AI (`backend/src/ai/advisor.js`) |
| **Database** | MySQL `8.0+` (Engine `InnoDB`, charset `utf8mb4`, `DECIMAL(12,2)`, thời gian `UTC`) | **31 bảng** (gộp đầy đủ bản v2 trong `schema.sql` + toàn bộ dữ liệu mẫu trong `seed.sql`) |

### Cấu trúc thư mục dự án

```text
5guys-site/
├── backend/
│   ├── src/
│   │   ├── ai/advisor.js          # Bộ trích xuất cấu hình phần cứng & gợi ý game fallback
│   │   ├── api/
│   │   │   ├── index.js           # Gắn toàn bộ router API & /api/health
│   │   │   ├── auth.routes.js     # Đăng ký, đăng nhập, /me, quên mật khẩu demo
│   │   │   ├── products.routes.js # Catalog, chi tiết game, gallery proxy cache 6h, review & vote
│   │   │   ├── store.routes.js    # Giỏ hàng, đặt hàng/tặng quà, kho game, Auto-Patcher, Loyalty
│   │   │   ├── payments.routes.js # Thanh toán mô phỏng & gửi yêu cầu hoàn tiền
│   │   │   ├── publisher.routes.js# Cổng Nhà phát hành (dashboard, đăng game, giá, patch, reply)
│   │   │   ├── mods.routes.js     # Cộng đồng Mod động (xem, đăng tải, tải manifest & đếm lượt tải)
│   │   │   ├── admin.routes.js    # Quản trị 6 tab (thống kê, đơn, hoàn tiền, SP, duyệt game, user, ticket)
│   │   │   ├── profile.routes.js  # Hồ sơ cá nhân, đổi mật khẩu, sổ địa chỉ (tối đa 10)
│   │   │   ├── support.routes.js  # Phiếu hỗ trợ khách hàng (Support Tickets)
│   │   │   └── ai.routes.js       # Trợ lý cấu hình PC2GAMES AI (/api/ai/advisor)
│   │   ├── middleware/
│   │   │   ├── auth.js            # requireAuth (JWT + kiểm tra khóa tài khoản tức thì) & requireRole
│   │   │   └── errors.js          # 404 & xử lý lỗi Zod / ER_DUP_ENTRY tập trung
│   │   ├── app.js                 # Cấu hình Helmet, CORS, JSON limit 32kb, Rate Limit đa tầng
│   │   ├── config.js              # Xác thực biến môi trường (.env) bằng Zod
│   │   ├── db.js                  # MySQL pool, transaction helper & ensureSchemaReady()
│   │   └── server.js              # Điểm khởi động API & auto-migrate schema
│   ├── .env.example               # Mẫu cấu hình môi trường
│   ├── package.json
│   └── README.md
├── database/
│   ├── schema.sql                 # Khởi tạo 5guys_store & đủ 31 bảng InnoDB (đã gộp bản v2)
│   ├── seed.sql                   # Dữ liệu mẫu (45 sản phẩm Số/Đĩa, 10 thể loại, tài khoản admin)
│   ├── make_admin.sql             # Script nâng quyền Admin nhanh cho tài khoản đã đăng ký
│   └── README.md
├── frontend/
│   ├── assets/                    # shared.js, layout.js, catalog.js, detail.js, hub.js, search.js, address.js...
│   ├── games/                     # 3 mini-game HTML5 (black-myth.html, hollow-knight.html, neon-viper.html)
│   ├── *.html                     # 20 trang giao diện đầy đủ (storefront, vault, publisher, admin, privacy, terms...)
│   └── README.md
├── CHANGELOG-v2.md                # Lịch sử chi tiết các nâng cấp bản v2
└── README.md
```

---

## 2. Danh sách Đầy đủ Các Chức năng (Đã cập nhật bản v2)

### 2.1. Tài khoản, Xác thực 2 lớp (2FA TOTP) & Pháp lý
- **Đăng ký, Đăng nhập & Khôi phục mật khẩu:** Mật khẩu băm một chiều bằng `Bcrypt` (cost factor `12`), xác thực phiên bằng `JWT` (`2h`), đối chiếu trực tiếp trạng thái `status = 'active'` và `role` từ MySQL trên mọi request qua `requireAuth` / `requireRole` (vô hiệu hóa tức thì ngay khi tài khoản bị Admin khóa). Chức năng Quên mật khẩu (`login.html`) sinh mã OTP 6 số băm `SHA-256`, so sánh bằng `crypto.timingSafeEqual()`, hiệu lực 15 phút, sai tối đa 5 lần và cooldown 60 giây.
- **Xác thực 2 bước (2FA TOTP chuẩn RFC 6238):** Tích hợp thư viện `otpauth` (9.2.2) và `qrcodejs` (1.0.0) với chu kỳ 30 giây của Google Authenticator. Khi đăng ký (`register.html`), hệ thống tạo khóa bí mật Base32 và mã QR để người dùng quét; khi đăng nhập (`login.html`), chỉ lưu phiên sau khi vượt qua bước kiểm tra TOTP hợp lệ (đã gỡ bỏ các nút điền nhanh OTP demo).
- **Hồ sơ cá nhân & Sổ địa chỉ (`profile.html`):** Cập nhật tên hiển thị, số điện thoại Việt Nam chuẩn hóa 10 số (`03/05/07/08/09`), đổi mật khẩu, quản lý tối đa 10 địa chỉ giao hàng kết nối API địa giới hành chính 34 Tỉnh/Thành & Phường/Xã (`provinces.open-api.vn` v2).
- **Trang Chính sách Bảo mật (`privacy.html`) & Điều khoản Dịch vụ (`terms.html`):** Bố cục 2 cột (Sticky Sidebar Mục lục 3/12 cột + Nội dung 9/12 cột), trình bày đầy đủ cam kết PCI-DSS SAQ-A, Bcrypt/2FA, 7 điều khoản Bảo mật, 6 điều khoản Dịch vụ Hybrid, Bảng quy định giao nhận/hoàn tiền và thông tin Nhóm 5Guys 26C01; tích hợp checkbox đồng ý bắt buộc tại `register.html` (`#agree-terms`) cùng liên kết đồng bộ tại Footer (`frontend/assets/layout.js`) và `cart.html`.

### 2.2. Mua sắm Hybrid, Thanh toán & Tặng quà (Gifting)
- **Catalog, Tìm kiếm & Chi tiết sản phẩm:** Trang chủ (`index.html`), Game Số (`digital.html`), Game Đĩa (`physical.html`) và Tìm kiếm (`search.html`) tải dữ liệu động từ `GET /api/products`, lọc đa tiêu chí theo thể loại, nền tảng, thanh trượt giá VND và định dạng. Trang chi tiết (`detail.html`) hỗ trợ chuyển đổi phiên bản Số/Đĩa cùng tựa game, hiển thị **Đặc tả bản vật lý** và **Trình xem Trailer & Ảnh chụp (Modal Gallery)** thông qua proxy `/api/products/:idOrSlug/gallery` có cache 6 giờ.
- **Giỏ hàng minh bạch & Thanh toán mô phỏng (`cart.html`):** Tự động khóa số lượng game kỹ thuật số ở mức `1`, tự động hiện/ẩn khung địa chỉ giao hàng khi có game đĩa, tính toán lại 100% ở phía server (`computeTotals`: tạm tính, mã giảm giá `SELL10`, VAT 10%, phí kênh thanh toán, phí ship `30.000đ`/`60.000đ`), trừ tồn kho và cấp game vào thư viện trong Transaction InnoDB.
- **Hệ thống Tặng quà (`Gifting System`):** Tích chọn *"Mua đơn hàng này làm quà tặng cho bạn bè"* tại `cart.html`, nhập Email tài khoản 5GUYS người nhận và lời chúc. Hệ thống kiểm tra người nhận hợp lệ (`gift_recipient_not_found`), chặn tự tặng chính mình (`cannot_gift_self`), kiểm tra khóa `game_library FOR UPDATE` tránh tặng trùng (`recipient_already_owns`), sau khi thanh toán sẽ chuyển bản quyền thẳng vào `game_library` của người nhận, cộng điểm Loyalty cho người mua và chặn hoàn tiền tự động khi quà đã trao (`gift_order_not_refundable`, đúng Điều 5.5 `terms.html`).

### 2.3. Kho Game (Launcher Mô phỏng) & Tự động Cập nhật Bản vá / DLC
- **Kho game của tôi (`library.html`):** Hiển thị toàn bộ game kỹ thuật số đã sở hữu, tự động sinh mã bản quyền `5GUYS-XXXX-0000-XXXX` ổn định theo `(tài khoản + slug)` kèm nút ẩn/hiện & copy, chuyển đổi ổ đĩa lưu trữ giả lập (`Ổ C: Kingston SSD` / `Ổ D: Samsung 990 Pro`), biểu đồ cột thời lượng chơi T2–CN theo từng game và nút **Chơi Ngay** mở trực tiếp 3 mini-game HTML5 (`black-myth.html`, `hollow-knight.html`, `neon-viper.html`).
- **Auto-Patcher & DLC (`POST /api/library/:productId/update`):** Kiểm tra phiên bản bản vá mới nhất từ `game_patches`, chạy thanh tiến trình cài đặt 1.8 giây theo tốc độ đọc ổ NVMe đang chọn, cập nhật `installed_version` / `dlc_installed` trên MySQL và cộng dung lượng bản vá/DLC vào thanh dung lượng ổ cứng.

### 2.4. Cộng đồng Mod Động, Đánh giá, AI & Tiện ích
- **Cộng đồng Mod Động (`mods.html` & `/api/mods`):** Người dùng đã đăng nhập có thể đăng tải bản Mod mới cho từng tựa game số; người chơi duyệt danh sách Mod từ MySQL (`game_mods`), bấm tải để nhận tệp manifest `5GUYS_Mod_<slug>_<version>.json` và tăng bộ đếm `downloads_count` thật trong Transaction.
- **Đánh giá & Bình chọn Hữu ích (`reviews.html`, `detail.js`, `review_votes`):** Đăng đánh giá 1–5 sao tự động gắn huy hiệu `"Đã mua"` nếu đã thanh toán, bình chọn đánh giá hữu ích (`👍 Hữu ích`) realtime qua `POST /api/products/reviews/:reviewId/vote`, và hiển thị phản hồi chính thức từ Nhà phát hành.
- **Chatbot PC2GAMES AI (`/api/ai/advisor`):** Trích xuất cấu hình phần cứng (PC/Laptop/Console, CPU, GPU/iGPU, RAM), sở thích thể loại và ngân sách xuyên suốt lịch sử chat; tự động hỏi lại nếu chưa đủ dữ liệu và chỉ gợi ý các game đang bán tại 5GUYS kèm thiết lập đồ họa/FPS dự kiến.
- **Loyalty, Support Tickets & Easter Eggs:** Tự động tính và nâng/hạ hạng thành viên (`Bronze` / `Silver` từ `5.000.000đ` / `Gold` từ `12.500.000đ`) theo chi tiêu tích lũy cùng lịch sử điểm (`loyalty.html`), gửi và theo dõi Ticket hỗ trợ (`support.html`), cùng các Easter Eggs (mã Konami `↑ ↑ ↓ ↓ ← → ← → B A` đổi con trỏ tay cầm, âm thanh 8-bit Web Audio API khi thêm giỏ/mở rương, đổi tiêu đề tab khi AFK, búa đập phá giao diện ở footer).

### 2.5. Cổng Nhà phát hành (`publisher.html`) & Trang Quản trị (`admin.html`)
- **Publisher Studio (`/api/publisher`):** Dành cho tài khoản có `role = 'publisher'` hoặc `'admin'`. Hỗ trợ thống kê doanh thu/số bản bán của Studio, đăng tải game mới (`digital`/`physical`) ở trạng thái `draft` chờ duyệt, chỉnh sửa giá (tối thiểu `1.000đ`) & % giảm giá đồng bộ `product_editions`, phát hành bản vá (Patch) / DLC mới vào `game_patches`, theo dõi lý do bị từ chối và phản hồi đánh giá của người chơi.
- **Admin Dashboard (`/api/admin`):** 6 tab quản trị chuyên sâu (phân tách rõ quyền `staff` xem báo cáo, điều phối giao vận, xử lý Ticket và quyền `admin` duyệt hoàn tiền, quản lý/duyệt sản phẩm, phân quyền tài khoản):
  1. *Tổng quan:* Biểu đồ doanh thu 14 ngày liên tục, tách bạch doanh thu Số và Vật lý, top sản phẩm & cảnh báo sắp hết hàng.
  2. *Đơn hàng:* Xem danh sách đơn, cập nhật điều phối giao vận (`Chờ lấy hàng` → `Đang giao` → `Đã giao`), xem/copy Key bản quyền DRM Safe cho đơn số, mở & in phiếu điều phối giao hàng cho đơn đĩa.
  3. *Hoàn tiền:* Duyệt hoặc từ chối yêu cầu hoàn tiền; khi duyệt sẽ tự động thu hồi quyền truy cập game số trong `game_library`, hoàn trả tồn kho đĩa (nếu chưa giao) và thu hồi điểm Loyalty trong Transaction.
  4. *Sản phẩm:* Thêm/sửa/ẩn sản phẩm (tự động khóa/mở trường Hybrid, đồng bộ giá `Standard`), lọc *Tất cả / Bản Số / Bản Đĩa / Chờ duyệt*, **Duyệt lên kệ (`approve`)** hoặc **Từ chối kèm lý do (`reject`)** các game do Nhà phát hành gửi lên.
  5. *Người dùng:* Phân quyền (`customer`, `publisher`, `staff`, `admin`) và khóa/mở khóa tài khoản (chặn tự thao tác trên chính mình).
  6. *Hỗ trợ:* Xem nội dung chi tiết Ticket, phản hồi và đóng Ticket đồng bộ với bộ đếm ở tab Tổng quan.

---

## 3. Hướng dẫn Cài đặt & Khởi chạy từng bước

### Yêu cầu môi trường
- **Node.js `20+`**
- **MySQL `8.0+`** (kèm MySQL Workbench hoặc MySQL CLI)
- **VS Code + Extension Live Server** (khuyến nghị mở Frontend tại cổng `5500`)
- **Git**

### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL
Trong **MySQL Workbench** (hoặc MySQL CLI), chạy lần lượt **2 script** sau:
1. Chạy `database/schema.sql` — Tạo database `5guys_store` và đầy đủ 31 bảng (bao gồm `game_patches`, `game_mods`, cột tặng quà, cột nhà phát hành & Auto-Patcher).
2. Chạy `database/seed.sql` — Nạp toàn bộ catalog game mẫu (24 tựa game / 45 biến thể Số & Đĩa, 10 thể loại) cùng tài khoản admin mặc định (`admin@5guys.com`, `admin@5guys.vn`).
3. Tạo tài khoản MySQL riêng cho Backend API:
   ```sql
   CREATE USER '5guys_api'@'localhost' IDENTIFIED BY '<mat-khau>';
   GRANT SELECT,INSERT,UPDATE,DELETE ON `5guys_store`.* TO '5guys_api'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Bước 2: Cấu hình & Khởi chạy Backend
1. Sao chép `backend/.env.example` thành `backend/.env`:
   - Điền `DB_PASSWORD` khớp với user `5guys_api`.
   - Điền `JWT_SECRET` (chuỗi ngẫu nhiên **tối thiểu 32 ký tự**).
   - *(Tùy chọn)* Điền `GEMINI_API_KEY` nếu muốn bật phản hồi qua Google Gemini cho PC2GAMES AI.
2. Cài đặt thư viện và chạy server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Khi thành công, terminal hiển thị `5GUYS API listening on port 3000` (kiểm tra nhanh tại `http://localhost:3000/api/health`).

### Bước 3: Mở Giao diện Frontend
- Mở `frontend/index.html` bằng **VS Code Live Server** (địa chỉ `http://127.0.0.1:5500` hoặc `http://localhost:5500`).
- **Không** mở trực tiếp qua giao thức `file://` vì trình duyệt sẽ chặn gọi API (CORS).

---

## 4. Ghi chú Quan trọng (Notes & Caveats)

### Tài khoản Quản trị & Chính sách Xác thực 2 Bước (2FA)
- **Tài khoản `admin@5guys.com` / `Admin@12345`:** Được **đặc cách duy nhất** bỏ qua bước nhập mã 2FA khi đăng nhập tại `login.html` để thuận tiện kiểm thử nhanh.
- **Tất cả các tài khoản khác (bao gồm `admin@5guys.vn` / `Admin@12345` và mọi tài khoản mới đăng ký):** Đều **bắt buộc xác thực 2FA 6 số qua Google Authenticator**.
  - Các nút *"Tự động điền mã"* / *"Điền nhanh mã OTP"* trên modal 2FA đã được gỡ bỏ hoàn toàn để đảm bảo tính thực tế của luồng bảo mật.
  - Với các tài khoản có sẵn từ trước chưa lưu khóa bí mật trong `localStorage`, nhấn nút **"Hiện mã QR Google Authenticator"** ngay trong modal đăng nhập (hoặc dùng khóa Base32 mặc định `JBSWY3DPEHPK3PXP`) để quét bằng ứng dụng Google Authenticator.
- Để nâng quyền cho tài khoản bạn tự đăng ký thành Admin, dùng script `database/make_admin.sql` (sau đó đăng xuất và đăng nhập lại).
- **Khuyến nghị bảo mật:** Đổi mật khẩu mặc định trong `profile.html` nếu triển khai ngoài môi trường demo, và **tuyệt đối không đưa `backend/.env` lên GitHub**.

### Tự động Đồng bộ Schema & Seed Dữ liệu (`ensureSchemaReady`)
- Ngay khi Backend khởi động (`server.js`), hàm `ensureSchemaReady()` trong `backend/src/db.js` tự động đối chiếu `INFORMATION_SCHEMA` để bổ sung an toàn các cột/bảng của bản v2 nếu chạy trên database cũ hơn (kèm đảm bảo tài khoản `admin@5guys.com`).
- Các module `store.routes.js`, `mods.routes.js`, `admin.routes.js` tự động seed dữ liệu mẫu cho Bản vá (`game_patches`), Bản Mod (`game_mods`) và Ticket hỗ trợ (`support_tickets`) trong transaction nếu bảng tương ứng đang trống.
- *(Lưu ý: Nếu dùng user MySQL `5guys_api` không có quyền `ALTER`/`CREATE`, hãy chạy `database/schema.sql` bằng tài khoản `root` trước khi chạy `npm run dev` để mọi cột/bảng đã tồn tại sẵn).*

### Chế độ Demo / Mô phỏng trong Đồ án
- **Thanh toán (`POST /api/orders/:id/pay`):** Chạy luồng thanh toán mô phỏng phục vụ đồ án, **không thu tiền thật** và tự động trả về `404` khi `NODE_ENV=production`.
- **Quên mật khẩu (`/api/auth/forgot-password`):** Không gửi email thật; khi `NODE_ENV !== 'production'`, mã OTP 6 số được in ra console Backend và trả trong `demoCode` để hiển thị kiểm thử. Mã lưu trong bộ nhớ server (dạng băm `SHA-256`) nên khởi động lại Backend sẽ hủy các mã cũ.
- **Chatbot PC2GAMES AI:** Nếu chưa cấu hình `GEMINI_API_KEY` trong `backend/.env`, trợ lý AI vẫn hoạt động bình thường nhờ bộ luật phân tích phần cứng nội bộ (`backend/src/ai/advisor.js`) kết hợp dữ liệu game thật từ MySQL.

### Bảo mật & Chống lỗi Đã Áp dụng
- **Chống DOM XSS:** Chuẩn hóa thoát ký tự HTML qua `G5.esc()` (`shared.js`) và `escapeHtml()` (`index.html`), kết hợp dựng phần tử an toàn bằng `textContent` và event delegation trên toàn bộ các trang danh mục, đơn hàng, cộng đồng, giỏ hàng, hỗ trợ, điểm thưởng và quản trị; chỉ chấp nhận giao thức `http(s)://` cho `cover_url`.
- **Chống Double-Submit, Găm hàng & Race Condition:** Khóa nút gửi khi request đang chạy ở trang Đăng nhập, Thanh toán giỏ hàng, Gửi ticket và Yêu cầu hoàn tiền; khóa số lượng sản phẩm `digital` = `1`, giới hạn tối đa 5 đơn `pending_payment`/tài khoản chống chiếm giữ tồn kho đĩa và cập nhật bộ đệm giỏ hàng đồng bộ trong `G5.setCart()`.
- **Tối ưu hiệu năng Mạng:** Gộp danh sách `order_items` trong `GET /api/orders` để `G5.syncOrders()` không còn phát sinh lỗi `N+1 HTTP requests` khi chuyển trang.
- **Bảo mật HTTP & API:** `Helmet` Security Headers, ẩn `x-powered-by`, `CORS` whitelist theo `FRONTEND_ORIGIN`, giới hạn JSON `32kb`, `Rate Limiting` đa tầng (`/api/auth`: 30 req/15 phút; tác vụ ghi trên `/api/orders`, `/api/mods`, `/api/support`, `/api/products`: 30 req/15 phút; toàn cục `/api`: 180 req/phút; `/api/ai`: 15 req/1 phút) và 100% câu truy vấn SQL tham số hóa (`Prepared Statements`).
- **Master Layout:** Toàn bộ thanh điều hướng và chân trang dùng chung nằm ở `frontend/assets/layout.js` (trừ `login.html`, `register.html`, `admin.html` có bố cục riêng).
