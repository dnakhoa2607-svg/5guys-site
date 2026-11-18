# 5GUYS — Giao diện Frontend (`frontend/`)

Giao diện web cửa hàng game **5GUYS Vault** xây dựng bằng **HTML5 + Tailwind CSS + Vanilla JavaScript**, hỗ trợ chạy đầy đủ qua **Backend Node.js + MySQL** (chế độ `apiMode`) và giữ khả năng fallback demo cục bộ khi chạy ngoại tuyến.

Khởi chạy qua máy chủ tĩnh (ví dụ VS Code Live Server tại `http://127.0.0.1:5500` hoặc `http://localhost:5500`); **không mở qua `file://`** để tránh trình duyệt chặn CORS khi gọi API.

---

## 1. Danh sách 20 Trang Giao diện & 3 Mini-Game

### 1.1. 20 trang HTML chính (`frontend/*.html`)

| File | Trang | Quyền truy cập & Chức năng chính |
| :--- | :--- | :--- |
| `index.html` | Trang chủ | Showcase catalog động, PC2GAMES AI chat widget, tra cứu/gửi ticket, hiệu ứng Easter Egg |
| `digital.html` | Game Kỹ thuật số | Danh mục game bản quyền tải tức thì (`type=digital`), thêm trực tiếp vào giỏ |
| `physical.html` | Game Vật lý & Băng đĩa | Danh mục đĩa PS4/PS5/Xbox/Switch (`type=physical`) kèm trạng thái tồn kho khả dụng |
| `detail.html` | Chi tiết sản phẩm (`?slug=`) | Chuyển đổi định dạng Số/Đĩa cùng game, Đặc tả bản vật lý, Modal Gallery (Trailer & ảnh), cấu hình, đánh giá + bình chọn Hữu ích + phản hồi từ Nhà phát hành |
| `search.html` | Tìm kiếm & Lọc đa tiêu chí | Hỗ trợ `?q=`, lọc theo thể loại, nền tảng, thanh trượt giá VND, định dạng và phân trang |
| `cart.html` | Giỏ hàng & Thanh toán | Khóa SL game số = 1, tặng quà (`#gift-toggle` + email + lời chúc), sổ địa chỉ & chọn gói ship (Tiêu chuẩn `30.000đ` / Hỏa tốc `60.000đ`), tính VAT + phí kênh thanh toán, liên kết tới `terms.html` & `privacy.html` |
| `orders.html` | Quản lý Đơn hàng | *(Cần đăng nhập)* Theo dõi tiến trình xử lý/giao vận, địa chỉ giao hàng và gửi yêu cầu hoàn tiền |
| `library.html` | Kho game (Launcher mô phỏng) | *(Cần đăng nhập)* Mã bản quyền `5GUYS-XXXX-0000-XXXX` (ẩn/hiện & copy), đổi ổ đĩa `Kingston SSD` / `Samsung 990 Pro`, biểu đồ giờ chơi T2–CN, khởi chạy mini-game HTML5, **Auto-Patcher & mở khóa DLC** theo tốc độ NVMe |
| `mods.html` | Cộng đồng Mod Động | Duyệt Mod theo tựa game số từ MySQL (`?game=`), đăng tải bản Mod mới (cần đăng nhập), tải manifest `.json` và tăng lượt tải thật |
| `rental.html` | Thuê cấu hình Cloud | Xem gói cấu hình Cloud, đo kiểm mạng Pre-Flight, nạp ví bằng Gift Code demo (`5GUYS-WELCOME`, `CYBER2026`, `MODPASS`) |
| `reviews.html` | Đánh giá & Cộng đồng | Xem và đăng đánh giá 1–5 sao, bình chọn `👍 Hữu ích` realtime (`review_votes`) và Hub thảo luận |
| `loyalty.html` | Khách hàng thân thiết | *(Cần đăng nhập)* Tự động đồng bộ điểm, hạng thành viên (`Bronze`/`Silver`/`Gold`), thanh tiến trình và lịch sử điểm |
| `profile.html` | Hồ sơ cá nhân | *(Cần đăng nhập)* Cập nhật GamerTag, SĐT chuẩn VN 10 số, đổi mật khẩu, quản lý tối đa 10 địa chỉ hành chính qua `provinces.open-api.vn` |
| `support.html` | Chăm sóc khách hàng | Chat trực tiếp, FAQ, gửi và theo dõi lịch sử Support Ticket |
| `login.html` | Đăng nhập & 2FA TOTP | Xác thực mật khẩu, popup Quên mật khẩu (demo OTP), kiểm tra mã **2FA TOTP 6 số** (đặc cách duy nhất `admin@5guys.com` không qua 2FA) |
| `register.html` | Đăng ký & Thiết lập 2FA | Sinh khóa Base32 & vẽ QR Google Authenticator (`otpauth` + `qrcodejs`), checkbox bắt buộc đồng ý `terms.html` & `privacy.html`, kiểm tra mã 6 số rồi gọi API tạo tài khoản |
| `publisher.html` | Cổng Nhà phát hành | *(Role `publisher`/`admin`)* Thống kê doanh thu Studio, đăng game mới (`draft`), cài đặt giá/giảm giá, phát hành Patch/DLC, trả lời đánh giá |
| `admin.html` | Bảng Quản trị | *(Role `admin`/`staff`)* 6 tab: Tổng quan (biểu đồ 14 ngày, doanh thu Số/Đĩa), Đơn hàng (điều phối ship, in phiếu, xem Key), Hoàn tiền, Sản phẩm + **Duyệt/Từ chối game**, Người dùng, Hỗ trợ |
| `privacy.html` | Chính sách Bảo mật | Trang 2 cột (Sticky Mục lục 3/12 cột + Nội dung 9/12 cột) trình bày 3 cam kết cốt lõi & 7 điều khoản pháp lý – kỹ thuật (PCI-DSS SAQ-A, Bcrypt, 2FA, LocalStorage, quyền người dùng & thông tin Nhóm 5Guys 26C01) |
| `terms.html` | Điều khoản Dịch vụ | Trang 2 cột (Sticky Mục lục 3/12 cột + Nội dung 9/12 cột) trình bày 3 thẻ tóm tắt, căn cứ pháp lý, trọn vẹn 6 điều khoản dịch vụ Hybrid & Bảng quy định giao nhận / vận chuyển / hoàn tiền |

### 1.2. Mini-Game HTML5 chơi trực tiếp (`frontend/games/`)
- `frontend/games/black-myth.html` (ánh xạ từ slug `black-myth-wukong`)
- `frontend/games/hollow-knight.html` (ánh xạ từ slug `hollow-knight` và `hollow-knight-silksong`)
- `frontend/games/neon-viper.html` (ánh xạ từ slug `neon-viper`)

---

## 2. Kiến trúc JS & CSS dùng chung (`frontend/assets/`)

| File | Vai trò |
| :--- | :--- |
| `assets/layout.js` | **Master Layout:** Chèn Navbar (`data-part="nav"`) và Footer (`data-part="footer"`, trỏ *Điều khoản dịch vụ* tới `terms.html` & *Chính sách bảo mật* tới `privacy.html`) đồng nhất cho các trang |
| `assets/shared.js` | Lớp lõi `window.G5`: gọi API (`G5.api`), quản lý phiên JWT, bộ đệm giỏ hàng/đơn hàng, bảng dịch mã lỗi `G5.errorText`, `G5.isAdmin()`, `G5.isPublisher()`, hàm chống XSS `G5.esc()`, tự động gắn link *Quản trị* / *Nhà phát hành* lên menu, `G5.askAi()`, âm thanh Web Audio 8-bit & Konami Easter Egg |
| `assets/shared.css` | Quy tắc responsive thống nhất (chống tràn ngang mobile 320px+, đồng nhất nút chat/CSKH, hỗ trợ `prefers-reduced-motion`) |
| `assets/tailwind-config.js` | Cấu hình token màu Cyberpunk dùng cho phần lớn trang storefront & account |
| `assets/tailwind-config-hub.js` | Cấu hình token màu riêng cho 3 trang Hub (`library.html`, `rental.html`, `mods.html`) |
| `assets/catalog.js` | Render thẻ game động từ `GET /api/products`, fallback ảnh bìa & nút **"Thử tải lại"** khi mất kết nối API |
| `assets/detail.js` | Xử lý chuyển đổi định dạng Số/Đĩa, render Đặc tả bản vật lý, Modal Gallery Video/Ảnh, viết & bình chọn Review, hiển thị phản hồi Nhà phát hành |
| `assets/search.js` | Logic tìm kiếm, lọc đa tiêu chí, sắp xếp và phân trang kết quả |
| `assets/hub.js` | Logic cho Kho game (Key DRM, chọn ổ đĩa NVMe, thời lượng chơi, launcher, Auto-Patcher & DLC), Cloud Rental và Cộng đồng Mod Động |
| `assets/address.js` | Tải 34 Tỉnh/Thành & Phường/Xã từ `https://provinces.open-api.vn/api/v2`, chuẩn hóa và định dạng số điện thoại VN |
| `assets/float-widgets.js` | Điều khiển khung chat PC2GAMES AI & Trung tâm hỗ trợ nổi |

---

## 3. Bảo mật 2FA TOTP & Lưu trữ Trình duyệt

### Cơ chế Xác thực 2 lớp (Google Authenticator)
- Thư viện sử dụng: `otpauth` v9.2.2 (chuẩn RFC 6238, SHA1, 6 chữ số, chu kỳ 30 giây) và `qrcodejs` v1.0.0.
- Khi đăng ký mới tại `register.html`: sinh khóa bí mật Base32 ngẫu nhiên (`16` ký tự), vẽ mã QR để người dùng quét bằng Google Authenticator và chỉ gọi `POST /api/auth/register` sau khi nhập đúng mã 6 số.
- Khi đăng nhập tại `login.html`: **chỉ duy nhất tài khoản `admin@5guys.com` được bỏ qua 2FA**. Mọi tài khoản khác (kể cả `admin@5guys.vn` hay tài khoản mới tạo) đều phải qua modal 2FA và chỉ gọi `G5.setApiSession()` sau khi `currentTotp.validate()` thành công. Nút điền nhanh mã OTP demo đã được gỡ bỏ khỏi giao diện đăng nhập và đăng ký.

### Các khóa `localStorage` & `sessionStorage` sử dụng trên trình duyệt
- `5guys_api_token` (`localStorage`): Lưu chuỗi JWT xác thực API (`Authorization: Bearer`).
- `5guys_user` (`localStorage`): Thông tin hiển thị tài khoản (`id`, `email`, `name`, `role`) để dựng Header tức thì.
- `g5_totp_secrets` (`localStorage`): Lưu ánh xạ `email → Base32 secret` phục vụ kiểm tra TOTP trên thiết bị.
- `5guys_api_cart_cache` & `5guys_api_orders_cache` (`localStorage`): Đệm nhanh giỏ hàng & đơn hàng đồng bộ từ MySQL (hoặc fallback chế độ Demo offline với `5guys_cart_*`, `5guys_orders_*`, `5guys_wallet_*`, `5guys_points_*`).
- `5guys_library_drive` (`localStorage`): Ghi nhớ ổ đĩa lưu trữ giả lập (`C` Kingston SSD hoặc `D` Samsung 990 Pro) trong `library.html`.
- `5guys_favorites` (`localStorage`): Lưu danh sách `slug` game đã đánh dấu Yêu thích.
- `5guys_konami` (`sessionStorage`): Trạng thái con trỏ tay cầm chơi game khi nhập Konami Code (tự xóa khi đóng tab).

---

## 4. Kết nối Backend & Tối ưu Bảo mật Frontend

- Địa chỉ API mặc định là `http://localhost:3000/api` (có thể ghi đè bằng `window.G5_API_BASE` trước khi nạp `assets/shared.js`).
- **Chống DOM XSS:** Sử dụng `G5.esc()` (`shared.js`) và `escapeHtml()` (`index.html`) kết hợp DOM API (`textContent`, `createElement`) cho dữ liệu người dùng nhập (chat hỗ trợ, tra cứu mã đơn, tên game trong giỏ hàng, lịch sử điểm, đánh giá, mod).
- **Chống Double-Submit & Race Condition:** Khóa nút submit trong lúc chờ phản hồi API trên `login.html`, `cart.html`, `support.html`, `orders.html`; khóa số lượng sản phẩm `digital` = `1` và cập nhật cache đồng bộ trước khi gọi API trong `G5.setCart()`.
- **Loại bỏ N+1 HTTP Requests:** `G5.syncOrders()` sử dụng dữ liệu `items` trả gộp trực tiếp từ `GET /api/orders` thay vì gọi thêm `N` request lẻ cho từng đơn hàng.
