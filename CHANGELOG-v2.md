# Thay đổi bản v2

## Trang Điều khoản Dịch vụ, Checkbox Bắt buộc Đăng ký & Liên kết Toàn trang (`frontend/terms.html`, `frontend/assets/layout.js`, `frontend/register.html`, `frontend/cart.html`)
- **Tạo mới `frontend/terms.html`:**
  - Đồng bộ 100% kiến trúc giao diện Cyberpunk Vault của `frontend/privacy.html` (Tailwind CDN, FontAwesome 6.4.0, Google Fonts `Inter`, `assets/shared.css`, `assets/tailwind-config.js`, `assets/shared.js`, `assets/layout.js` `nav` + `footer`).
  - Header Banner gồm huy hiệu `"Hiệu lực: Tháng 11/2026 • Phiên bản v2.0 • 5GUYS Vault"`, tiêu đề lớn `"ĐIỀU KHOẢN DỊCH VỤ & QUY ĐỊNH SỬ DỤNG"`, thông tin pháp lý tham chiếu (Bộ luật Dân sự 91/2015/QH13, Luật GDĐT 20/2023/QH15, Nghị định 52/2013 & 85/2021, Luật SHTT 50/2005, Luật BVQLNTD 19/2023) và 3 thẻ tóm tắt nhanh (Quyền lợi Người dùng, Minh bạch Giao dịch Hybrid, Bảo hộ Sở hữu Trí tuệ).
  - Bố cục 2 cột (Sticky TOC 3/12 cột `#terms-toc` với `scroll-behavior: smooth` và `IntersectionObserver` + Main Content 9/12 cột) trình bày trọn vẹn 100% **Điều 1 đến Điều 6**, Bảng 5.5 Tóm tắt Quy định Giao nhận/Vận chuyển/Hoàn tiền và Thông tin liên hệ Ban Quản trị Nhóm 5Guys 26C01 - HCMUS.
- **Checkbox bắt buộc & đồng bộ liên kết (`frontend/register.html`, `frontend/assets/layout.js`, `frontend/cart.html`):**
  - `frontend/register.html`: Thay dòng ghi chú bằng checkbox bắt buộc `#agree-terms` (kèm `#terms-error-msg`, liên kết tới `terms.html` & `privacy.html`), kiểm tra bắt buộc trong `handleRegister()` và tự ẩn thông báo lỗi khi tick chọn.
  - `frontend/assets/layout.js`: Đổi đường dẫn `Điều khoản dịch vụ` trong `L.footer` từ `href="support.html"` sang `href="terms.html"`.
  - `frontend/cart.html`: Bổ sung cả liên kết `Điều khoản dịch vụ` (`terms.html`) và `Chính sách bảo mật giao dịch` (`privacy.html`) ngay bên dưới nút `THANH TOÁN`.

## Gỡ bỏ nút Điền nhanh mã xác thực 2FA (`frontend/login.html`, `frontend/register.html`)
- **`frontend/login.html`:** Gỡ bỏ nút `#btn-autofill-otp` (*Tự động điền mã*), hàm `autofillOTP()` và đoạn cập nhật mã tự động trong `startCountdown()` ở modal xác thực 2 bước (2FA); giữ nguyên nút **Hiện mã QR Google Authenticator** (`#btn-show-qr`), đồng hồ đếm ngược 30 giây, cơ chế xác thực TOTP và đặc cách duy nhất tài khoản `admin@5guys.com`.
- **`frontend/register.html`:** Gỡ bỏ nút `#demo-code-pill` (*Điền nhanh mã hiện tại*), CSS `.demo-code-pill`, hàm `fillDemoOtp()` và đoạn cập nhật `#demo-code` trong `startCountdown()`; giữ nguyên mã QR quét Google Authenticator, sao chép khóa bí mật, đồng hồ 30 giây và kiểm tra OTP 6 số.

## Trang Chính sách Bảo mật & Tích hợp Liên kết (`frontend/privacy.html`, `frontend/assets/layout.js`, `frontend/register.html`, `frontend/cart.html`)
- **Tạo mới `frontend/privacy.html`:**
  - Chuyển đổi đầy đủ 100% nội dung từ văn bản *Chính sách Bảo mật & An toàn Dữ liệu (v2.0)* của 5GUYS Vault gồm phần Mở đầu pháp lý, Bản tóm tắt Cam kết cốt lõi (03 thẻ tóm tắt) và trọn vẹn **Điều 1 đến Điều 7** (kèm bảng phân loại dữ liệu MySQL, bảng khóa `localStorage`/`sessionStorage`, các tiểu mục a–d, công thức Bcrypt & TOTP RFC 6238, và thông tin Ban Quản trị Nhóm 5Guys 26C01 - FIT HCMUS).
  - Đồng bộ hoàn toàn giao diện Cyberpunk (`#12091c`, `#2a1645`, `#1f1032`, `#9d4edd`, `#c77dff`), nhúng `assets/shared.css`, `assets/tailwind-config.js`, `assets/shared.js`, `assets/layout.js` (`nav` + `footer`), và bố cục 2 cột (Sticky Sidebar Mục lục 3/12 cột với `scroll-behavior: smooth` + Main Content 9/12 cột).
- **Cập nhật liên kết trên 3 file hiện có:**
  - `frontend/assets/layout.js`: Đổi đường dẫn mục `Chính sách bảo mật` trong `L.footer` từ `href="support.html"` sang `href="privacy.html"`.
  - `frontend/register.html`: Thêm dòng chú thích đồng ý *Chính sách bảo mật* dẫn tới `privacy.html` (`target="_blank"`) ngay phía trên nút **THIẾT LẬP TÀI KHOẢN**.
  - `frontend/cart.html`: Bổ sung liên kết *Chính sách bảo mật giao dịch* dẫn tới `privacy.html` (`target="_blank"`) vào dòng ghi chú bảo mật ngay bên dưới nút **THANH TOÁN**.

## Rà soát QA, Tăng cường Bảo mật (XSS, 2FA, Double-Submit) & Tối ưu Hiệu năng (`frontend/login.html`, `frontend/register.html`, `frontend/assets/shared.js`, `frontend/cart.html`, `frontend/support.html`, `frontend/orders.html`, `frontend/loyalty.html`, `frontend/index.html`, `frontend/admin.html`, `frontend/publisher.html`, `frontend/assets/hub.js`, `frontend/assets/catalog.js`, `backend/src/api/store.routes.js`, `backend/src/api/admin.routes.js`, `database/seed.sql`, `database/update_v2.sql`, `backend/src/db.js`)
- **Chính sách Xác thực 2 Bước (2FA) & Đặc cách duy nhất `admin@5guys.com` (`frontend/login.html`, `database/seed.sql`, `database/update_v2.sql`, `backend/src/db.js`):**
  - Cập nhật `handleSignInSubmit()` trong `frontend/login.html`: **Chỉ duy nhất** tài khoản `admin@5guys.com` được phép bỏ qua xác thực 2 bước (`normalizedEmail === 'admin@5guys.com'`) và đăng nhập thẳng sau khi xác thực mật khẩu. Tất cả các tài khoản khác (kể cả `admin@5guys.vn` hay bất kỳ tài khoản được tạo thêm / đăng nhập) đều bắt buộc phải qua bước xác thực mã 6 số Google Authenticator (TOTP).
  - Bổ sung seed an toàn `INSERT IGNORE` cho tài khoản `admin@5guys.com` trong `database/seed.sql`, `database/update_v2.sql` và `ensureSchemaReady()` (`backend/src/db.js`).
- **Chống DOM XSS trên toàn hệ thống (`frontend/assets/shared.js`, `frontend/support.html`, `frontend/index.html`, `frontend/cart.html`, `frontend/loyalty.html`):**
  - Thêm hàm tiện ích dùng chung `G5.esc(str)` trong `frontend/assets/shared.js` để mã hóa các ký tự HTML đặc biệt (`&`, `<`, `>`, `"`, `'`).
  - Bọc `esc()` cho nội dung tin nhắn chat trong `frontend/support.html`, tên sản phẩm trong `frontend/cart.html`, mô tả lịch sử điểm trong `frontend/loyalty.html`, và sửa hàm `escapeHtml()` kèm mã đơn tra cứu trong `frontend/index.html`.
- **Chống Double-Submit & Race Condition (`frontend/login.html`, `frontend/cart.html`, `frontend/support.html`, `frontend/orders.html`, `frontend/assets/shared.js`):**
  - Loại bỏ event listener `click` gắn trùng trên `#btn-login-submit` ở `frontend/login.html`; thêm cờ `isSubmittingLogin` và khóa nút đăng nhập kèm trạng thái `"ĐANG XÁC THỰC..."` trong suốt quá trình gọi `POST /api/auth/login`.
  - Khóa nút bấm (`disabled = true` trong khối `try...finally`) khi bấm Thanh toán (`#pay` ở `frontend/cart.html`), Gửi ticket hỗ trợ (`#ts` ở `frontend/support.html`) và Gửi yêu cầu hoàn tiền (`#sb` ở `frontend/orders.html`).
  - Trong `frontend/cart.html` và `G5.setCart` / `G5.add` (`frontend/assets/shared.js`): Khóa tăng số lượng `> 1` đối với sản phẩm `digital` (khớp 100% với quy tắc Backend) và cập nhật đồng bộ `5guys_api_cart_cache` ngay lập tức trước khi gọi chuỗi `DELETE`/`PUT /api/cart/items` để triệt tiêu race condition khi bấm `+`/`-` liên tục.
- **Tối ưu N+1 HTTP Requests & Đồng bộ Dữ liệu Quản trị (`backend/src/api/store.routes.js`, `backend/src/api/admin.routes.js`, `frontend/assets/shared.js`, `frontend/admin.html`):**
  - Cập nhật `GET /api/orders` (`backend/src/api/store.routes.js`) trả về kèm danh sách `items` và thông tin giao hàng trong 1 truy vấn gộp; cập nhật `G5.syncOrders()` (`frontend/assets/shared.js`) đọc trực tiếp `o.items` thay vì bắn `1 + N` requests mỗi lần chuyển trang.
  - Cho phép Admin xóa trắng các trường văn bản tùy chọn (`genre`, `publisher`, `developer`, `cover_url`, `description`) khi sửa sản phẩm trong `frontend/admin.html`, đồng thời cập nhật đồng bộ giá phiên bản `'Standard'` trong bảng `product_editions` tại `PUT /api/admin/products/:id` (`backend/src/api/admin.routes.js`).
- **Sửa lỗi Điều hướng, Launcher Kho Game & UI/UX (`frontend/assets/hub.js`, `frontend/login.html`, `frontend/register.html`, `frontend/loyalty.html`, `frontend/assets/catalog.js`, `frontend/admin.html`, `frontend/publisher.html`):**
  - Bổ sung ánh xạ `'black-myth-wukong': 'games/black-myth.html'` và `'hollow-knight': 'games/hollow-knight.html'` vào `GAME_LAUNCHERS` trong `frontend/assets/hub.js`, khắc phục lỗi 404 khi bấm **Chơi Ngay** trong Kho game.
  - Mở rộng Regex kiểm tra tham số chuyển hướng `?next=` trên `frontend/login.html` và `frontend/register.html` (kèm `G5.promptLogin` trong `shared.js`) để giữ nguyên query string hợp lệ (VD: `detail.html?slug=elden-ring`, `mods.html?game=elden-ring`).
  - Cập nhật `frontend/loyalty.html` tự động tính và hiển thị đúng hạng hiện tại (`Bronze` / `Silver` / `Gold`), phần trăm thanh tiến trình và huy hiệu `"CỦA BẠN"`.
  - Bổ sung nút `"Thử tải lại"` khi lỗi mạng ở `frontend/assets/catalog.js` và tối ưu chiều rộng ô tìm kiếm (`w-full sm:!w-60`, `w-full sm:!w-52`) trên màn hình nhỏ 320px tại `frontend/admin.html` và `frontend/publisher.html`.

## Hệ thống Tự động Cập nhật Bản vá & DLC trong Kho Game (`frontend/library.html`, `frontend/assets/hub.js`, `backend/src/api/store.routes.js`, `database/update_v2.sql`)
- **Mở rộng Database & Tự động Seed dữ liệu Bản vá (`database/update_v2.sql`, `backend/src/db.js`, `backend/src/api/store.routes.js`):**
  - Thêm các cột `game_library.installed_version` (mặc định `'1.0.0'`) và `game_library.dlc_installed` (mặc định `FALSE`) vào `database/update_v2.sql` và `ensureSchemaReady()` trong `backend/src/db.js`.
  - Bổ sung `ensurePatchesSeeded()` trong `backend/src/api/store.routes.js` tự động seed 1 bản Patch `v1.2.0` và 1 gói mở rộng DLC cho các game kỹ thuật số đang bán nếu bảng `game_patches` đang trống.
- **API Kho Game & Cập nhật Bản vá (`backend/src/api/store.routes.js`):**
  - Cập nhật `GET /api/library`: Trả về thêm `installed_version`, `dlc_installed` và danh sách `patches` mới nhất từ `game_patches` cho từng game trong thư viện.
  - Thêm route `POST /api/library/:productId/update` (yêu cầu `requireAuth`): Nhận `{ targetVersion, installDlc }`, kiểm tra quyền sở hữu trong `game_library` (`library_game_not_found`) và cập nhật `installed_version`, `dlc_installed`.
- **Giao diện Kho Game & Thanh tiến trình NVMe (`frontend/library.html`, `frontend/assets/hub.js`, `frontend/assets/shared.js`):**
  - Thêm khung **Cập nhật Bản vá & Nội dung DLC (Auto-Patcher)** vào `#library-game-details` trong `frontend/library.html` với `#game-installed-ver`, `#game-latest-ver`, `#game-dlc-badge`, `#patch-notes-summary`, `#patch-progress-bar`, `#btn-check-patch` và `#btn-update-patch`.
  - Cập nhật `hub.js`: Đồng bộ thông tin phiên bản/bản vá khi chọn game (`selectCard`), chạy thanh tiến trình mượt trong 1.8 giây hiển thị tốc độ ổ đĩa NVMe đang chọn, gọi `POST /api/library/:productId/update` (kèm fallback `localStorage`), cộng dung lượng bản vá/DLC vào thanh ổ cứng (`renderDrive()`) và hiển thị `showToast('Cập Nhật Hoàn Tất ✨', ...)`.
  - Bổ sung mã lỗi `library_game_not_found` vào `G5.errorText` trong `frontend/assets/shared.js`.

## Cộng đồng Mod Động (`frontend/mods.html`, `frontend/assets/hub.js`, `backend/src/api/mods.routes.js`, `database/update_v2.sql`)
- **Mở rộng Database & Tự động Seed dữ liệu (`database/update_v2.sql`, `backend/src/db.js`, `backend/src/api/mods.routes.js`):**
  - Thêm bảng `game_mods` vào `database/update_v2.sql` và vào hàm `ensureSchemaReady()` trong `backend/src/db.js`.
  - Bổ sung hàm `ensureModsReady()` trong `backend/src/api/mods.routes.js` tự động seed sẵn 10 bản Mod mẫu cho 5 tựa game (*Hollow Knight*, *Hollow Knight: Silksong*, *Elden Ring*, *Sekiro: Shadows Die Twice*, *Black Myth: Wukong*) trong transaction nếu bảng `game_mods` đang trống.
- **API Cộng đồng Mod (`backend/src/api/mods.routes.js`, `backend/src/api/index.js`):**
  - Đăng ký `api.use('/mods', mods)` trong `backend/src/api/index.js`.
  - `GET /api/mods?slug=<game_slug>`: Phân giải `product_id` bản kỹ thuật số theo `slug` (hoặc theo cùng `title`), trả về danh sách mod `status='published'` kèm `display_name AS author_name`.
  - `POST /api/mods` (yêu cầu `requireAuth`): Xác thực body bằng `zod` (`productSlug`, `title`, `category`, `version`, `sizeLabel`, `description`) và lưu bản Mod mới với `author_user_id = req.user.sub`.
  - `POST /api/mods/:id/download` (yêu cầu `requireAuth`): Tăng `downloads_count = downloads_count + 1` trong transaction và trả về `{ ok: true, mod }` gồm thông tin chi tiết để tạo manifest tải về.
- **Giao diện Cộng đồng Mod (`frontend/mods.html`, `frontend/assets/hub.js`, `frontend/assets/shared.js`):**
  - Thêm nút `+ Đăng tải Bản Mod` cạnh `#mod-grid-title` và modal `#modal-upload-mod` chuẩn tông màu `surface-container` / `brand-purple` trong `frontend/mods.html`.
  - Cập nhật `initMods()` trong `frontend/assets/hub.js` để tải mod thật từ `GET /api/mods?slug=...` (chỉ fallback về mảng `MODS` cục bộ khi API offline), mở khóa nút `Tải Mod`, tăng lượt tải qua `POST /api/mods/:id/download` và tự động tải xuống tệp manifest `5GUYS_Mod_<slug>_<version>.json` kèm thông báo `showToast`.
  - Bổ sung `mod_not_found` vào `G5.errorText` trong `frontend/assets/shared.js` và xử lý hiển thị an toàn nội dung trong `showToast` của `hub.js`.

## Hệ thống Tặng quà (Gifting System) & Bình chọn Đánh giá Hữu ích (`frontend/cart.html`, `frontend/reviews.html`, `frontend/assets/detail.js`, `backend/src/api/store.routes.js`, `backend/src/api/payments.routes.js`, `backend/src/api/products.routes.js`, `database/update_v2.sql`)
- **Mở rộng Database & Tự động khởi tạo an toàn (`database/update_v2.sql`, `backend/src/db.js`):**
  - Bổ sung vào `database/update_v2.sql` các cột `orders.recipient_user_id` (khóa ngoại `fk_orders_recipient` tham chiếu `users(id)`), `orders.gift_email` và `orders.gift_message`.
  - Mở rộng `ensureSchemaReady()` trong `backend/src/db.js` kiểm tra qua `INFORMATION_SCHEMA.COLUMNS` và `INFORMATION_SCHEMA.TABLE_CONSTRAINTS` để tự động bổ sung các cột tặng quà nếu database chưa chạy script SQL.
- **API Tặng quà (`backend/src/api/store.routes.js`, `backend/src/api/payments.routes.js`):**
  - `PUT /api/cart/items`: Cho phép thêm game kỹ thuật số vào giỏ ngay cả khi người mua đã sở hữu (để mua tặng bạn bè); kiểm tra trùng sở hữu (`already_owned` / `recipient_already_owns`) được thực thi trong transaction khi tạo đơn `POST /api/orders`.
  - `POST /api/orders`: Nhận thêm `{ isGift, giftEmail, giftMessage }`. Nếu tặng quà, kiểm tra không tự tặng chính mình (`cannot_gift_self`), kiểm tra tài khoản người nhận đang hoạt động (`gift_recipient_not_found`), kiểm tra người nhận chưa sở hữu game digital đó (`recipient_already_owns`), và lưu `recipient_user_id`, `gift_email`, `gift_message` vào bảng `orders`.
  - `POST /api/orders/:id/pay`: Khi xử lý item `digital`, cấp bản quyền vào `game_library` cho `order.recipient_user_id || req.user.sub`, trong khi điểm thưởng (`loyalty_transactions`, `loyalty_accounts`) vẫn cộng cho người thanh toán (`req.user.sub`).
- **API & Giao diện Bình chọn Đánh giá Hữu ích (`backend/src/api/products.routes.js`, `frontend/assets/detail.js`, `frontend/reviews.html`):**
  - `GET /api/products/:idOrSlug` & `GET /api/products/reviews`: Trả về thêm `r.id`, `r.publisher_reply`, `r.publisher_replied_at` và `helpful_count` đếm từ bảng `review_votes`.
  - `POST /api/products/reviews/:reviewId/vote`: Yêu cầu `requireAuth`, toggle trạng thái `helpful` trong bảng `review_votes` và trả về `{ ok: true, helpfulCount, voted }`.
  - Cập nhật `frontend/assets/detail.js` và `frontend/reviews.html`: Hiển thị nút `👍 Hữu ích (<span data-helpful-count>...</span>)` dưới mỗi thẻ đánh giá, gọi API bình chọn và cập nhật số lượng tức thì (đồng thời giữ fallback demo khi `reviews.html` chạy offline).
- **Giao diện Tặng quà & Đồng bộ Error Code (`frontend/cart.html`, `frontend/assets/shared.js`):**
  - Thêm khối quà tặng trên `frontend/cart.html` với checkbox `#gift-toggle`, ô `#gift-email` và `#gift-message`, truyền `{ isGift, giftEmail, giftMessage }` vào `G5.placeOrder` khi thanh toán.
  - Bổ sung bản dịch tiếng Việt trong `G5.errorText` (`frontend/assets/shared.js`) cho `gift_recipient_not_found`, `recipient_already_owns`, `cannot_gift_self`, `gift_email_required`.

## Cổng Nhà phát hành (Publisher Studio) & Luồng Phê duyệt Game (`frontend/publisher.html`, `backend/src/api/publisher.routes.js`, `frontend/admin.html`, `database/update_v2.sql`)
- **Mở rộng Database & Tự động khởi tạo an toàn (`database/update_v2.sql`, `backend/src/db.js`, `backend/src/server.js`):**
  - Bổ sung vào `database/update_v2.sql` các cột `products.publisher_user_id` (khóa ngoại `fk_products_publisher` tham chiếu `users(id)`), `products.rejection_reason`, `reviews.publisher_reply`, `reviews.publisher_replied_at` và bảng `game_patches` lưu lịch sử bản vá / DLC.
  - Bổ sung hàm `ensureSchemaReady()` trong `backend/src/db.js` kiểm tra qua `INFORMATION_SCHEMA.COLUMNS` và `INFORMATION_SCHEMA.TABLE_CONSTRAINTS` trước khi thực thi `ALTER TABLE` / `CREATE TABLE IF NOT EXISTS` (kèm bọc `try/catch` khi cập nhật `users.role`), được gọi tự động khi khởi động ở `backend/src/server.js` và trước các route liên quan.
- **API Nhà phát hành & Phê duyệt sản phẩm (`backend/src/api/publisher.routes.js`, `backend/src/api/index.js`, `backend/src/api/admin.routes.js`, `backend/src/api/products.routes.js`):**
  - Tạo mới `backend/src/api/publisher.routes.js` và gắn tại `/api/publisher` trong `backend/src/api/index.js`, bảo vệ toàn bộ bằng `requireAuth` và `requireRole('publisher', 'admin')`:
    - `GET /api/publisher/dashboard`: Trả về danh sách game thuộc sở hữu của Nhà phát hành (`p.publisher_user_id = req.user.sub`, hoặc tất cả nếu là `admin`), kèm số lượng đã bán (`SUM(oi.quantity)`), doanh thu (`SUM(oi.line_total)` từ các đơn `paid`/`processing`/`shipped`/`fulfilled`), tồn kho đĩa `physical_inventory`, trạng thái + `rejection_reason`, danh sách `reviews`, lịch sử `patches` và tổng hợp `stats`.
    - `POST /api/publisher/products`: Kiểm tra dữ liệu bằng `zod`, bọc trong transaction (`inTransaction`) để chèn `products` ở trạng thái `draft`, chèn `physical_inventory` (nếu `physical`) hoặc `game_requirements` (nếu `digital`), đồng thời tạo phiên bản `'Standard'` trong `product_editions`, trả về `201 { id, status: 'draft' }`.
    - `PUT /api/publisher/products/:id/pricing`: Xác minh quyền sở hữu, tính tự động `discount_percent`, cập nhật đồng bộ `products` và `product_editions` (`Standard`) trong transaction.
    - `POST /api/publisher/products/:id/patches`: Xác minh quyền sở hữu và thêm bản vá / DLC mới vào `game_patches`.
    - `PUT /api/publisher/reviews/:reviewId/reply`: Xác minh đánh giá thuộc game của Nhà phát hành và cập nhật `publisher_reply`, `publisher_replied_at = UTC_TIMESTAMP()`.
  - Cập nhật `backend/src/api/admin.routes.js`: Thêm `PUT /api/admin/products/:id/approval` (`approve` -> `status='active', rejection_reason=NULL`; `reject` -> `status='inactive', rejection_reason=?`) và mở rộng `GET /api/admin/products` trả về `rejection_reason`, `publisher_user_id`, thông tin Studio và ưu tiên các game `draft` lên đầu danh sách.
  - Cập nhật `backend/src/api/products.routes.js`: Bổ sung `r.publisher_reply` và `r.publisher_replied_at` vào dữ liệu trả về của `GET /api/products/:idOrSlug`.
- **Giao diện Nhà phát hành, Phê duyệt Admin & Phản hồi Đánh giá (`frontend/publisher.html`, `frontend/admin.html`, `frontend/assets/shared.js`, `frontend/assets/detail.js`):**
  - Cập nhật `frontend/assets/shared.js`: Thêm `G5.isPublisher()`, tự động chèn mục `<a data-nav href="publisher.html"><i class="fa-solid fa-code-branch"></i> Nhà phát hành</a>` lên thanh điều hướng trước khi đánh dấu `.is-current`, đồng thời đồng bộ đầy đủ bản dịch tiếng Việt cho các mã lỗi backend trong `G5.errorText` (như `review_not_found`, `order_not_found`, `product_unavailable`, `invalid_transition`, `stock_below_reserved`, `ticket_not_found`, `cannot_change_self`, v.v.).
  - Tạo mới `frontend/publisher.html`: Giữ nguyên bảng màu Cyberpunk tím/đen (`#12091c`, `#2a1645`, `#9d4edd`, `#c77dff`) cùng navbar/footer dùng chung (`assets/layout.js`), hiển thị 4 thẻ thống kê Studio và 4 khu vực chức năng: Đăng tải Game mới (`digital`/`physical`), Danh sách Game & Cài đặt giá/giảm giá (hiển thị badge `Chờ duyệt` / `Đang bán` / `Bị từ chối` + lý do và modal chỉnh sửa giá), Form đăng Bản vá/DLC + lịch sử cập nhật, và Quản lý & phản hồi đánh giá người chơi.
  - Cập nhật `frontend/admin.html`: Trong tab **Sản phẩm**, bổ sung bộ lọc `Chờ duyệt`, hiển thị badge vàng `Chờ duyệt` cùng 2 nút `Duyệt lên kệ` và `Từ chối` (kèm modal nhập lý do từ chối) cho các sản phẩm `status === 'draft'`.
  - Cập nhật `frontend/assets/detail.js`: Hiển thị khung thụt lề `"Phản hồi từ Nhà phát hành"` bên dưới đánh giá trong `#game-reviews` khi `review.publisher_reply` có dữ liệu.

## Bảo mật Xác thực 2 Bước (TOTP Google Authenticator) & Tinh gọn Đăng nhập / Đăng ký (`frontend/login.html`, `frontend/register.html`)
- **Xoá phần Xác thực nhanh (Discord & Steam):**
  - Loại bỏ hoàn toàn khối `<div class="divider">Xác thực nhanh</div>`, `<div class="social-buttons">` và các class CSS liên quan trên cả `login.html` và `register.html`.
  - Căn chỉnh lại `margin-top`, `padding-top` và đường viền phân tách của khối `.switch-auth` cho cân đối.
- **Tích hợp thiết lập Google Authenticator (TOTP QR Code) trên `frontend/register.html`:**
  - Nhúng thư viện `otpauth` (v9.2.2) và `qrcodejs` (v1.0.0); khôi phục đầy đủ cấu trúc HTML của `#modal-2fa`.
  - Khi bấm **THIẾT LẬP TÀI KHOẢN** (`handleRegister`): Sinh khóa bí mật Base32 (`new OTPAuth.Secret({ size: 10 }).base32`), mở `#modal-2fa` và vẽ mã QR chuẩn `otpauth://totp/5GUYS:${email}?secret=${secret}&issuer=5GUYS` kèm chuỗi `secret` dạng chữ để quét bằng ứng dụng Google Authenticator.
  - Bổ sung nút `.demo-code-pill` tự động lấy mã 6 số hợp lệ của chu kỳ 30 giây hiện tại (`totp.generate()`).
  - Kiểm tra nghiêm ngặt mã 6 số bằng `totp.validate({ token: code, window: 1 })`: nếu sai hiện lỗi đỏ `#otp-error-msg` ("Mã Google Authenticator không chính xác!") và chặn tạo tài khoản; nếu đúng mới lưu cặp `email -> secret` vào `localStorage` (`g5_totp_secrets`), gọi `G5.api("/auth/register")` và chuyển hướng sang `login.html`.
- **Kiểm tra mã Google Authenticator (TOTP) thật trên `frontend/login.html`:**
  - **Đặc cách duy nhất tài khoản `admin@5guys.com`:** Bỏ qua bước xác thực 2 lớp (2FA), tự động lưu phiên `G5.setApiSession` và chuyển hướng vào trang chủ ngay sau khi nhập đúng mật khẩu để thuận tiện truy cập nhanh; mọi tài khoản khác đều bắt buộc qua 2FA.
  - Với các tài khoản khác trong `handleSignInSubmit`: Khi `G5.api('/auth/login')` thành công, chỉ lưu tạm `result.token` và `result.user` vào `pendingSession` (chưa gọi `G5.setApiSession` trước khi vượt qua bước 2FA) rồi mở `#modal-2fa`.
  - Tra cứu `secret` theo email từ `g5_totp_secrets`; nếu tài khoản có sẵn từ trước chưa có trong `g5_totp_secrets`, tự động gán Secret Base32 cố định `JBSWY3DPEHPK3PXP` và cung cấp nút *"Hiện mã QR Google Authenticator"* ngay trong modal.
  - Đồng hồ `#timer-count` đếm ngược theo nhịp 30 giây thực tế của thuật toán TOTP (`30 - (Math.floor(Date.now() / 1000) % 30)`); nút `#btn-autofill-otp` tính động mã 6 số thực tế bằng `totp.generate()`.
  - Hàm `executeVerification()` xác thực bằng `totp.validate({ token: code, window: 1 })`: chặn và báo lỗi đỏ nếu nhập sai mã; chỉ khi đúng mã mới gọi `G5.setApiSession(pendingSession.token, pendingSession.user)` và chuyển vào `index.html`.

## Nâng cấp & Sửa lỗi Bảng Quản Trị (`frontend/admin.html`, `backend/src/api/admin.routes.js`, `database/*.sql`)
- **Tab "Hoàn tiền" (Sửa lỗi tràn và đè chữ):**
  - Áp dụng `max-width: 280px`, `white-space: normal`, `word-break: break-word` kết hợp giới hạn 2 dòng (`line-clamp-2`) và tooltip đầy đủ khi hover cho cột `Lý do`; tăng `padding` và cố định `whitespace-nowrap` cho các cột `Trạng thái`, `Ngày gửi`, `Thao tác` để tách biệt hoàn toàn.
- **Tab "Đơn hàng" (Điều phối giao vận, Xem Key & Sửa lệch badge):**
  - Gom các huy hiệu trạng thái đơn và trạng thái hoàn tiền vào khối dọc (`flex-col gap-1`) nằm gọn trong cột `Trạng thái`, không đè vào dòng địa chỉ giao hàng.
  - Đơn hàng `(đĩa)` (Vật lý): Bổ sung dropdown cập nhật trạng thái giao vận (`📦 Chờ lấy hàng` -> `🚚 Đang giao` -> `✅ Đã giao`) và nút `Chi tiết / In đơn` (mở phiếu điều phối hỗ trợ `window.print()`).
  - Đơn hàng `(số)` (Kỹ thuật số): Bổ sung nút `Xem chi tiết` để kiểm tra và sao chép mã Key bản quyền (`5GUYS DRM Safe`) đã cấp cho khách.
- **Tab "Tổng quan" (Biểu đồ 14 ngày & Tách doanh thu Hybrid):**
  - Biểu đồ "Doanh thu 14 ngày gần nhất" hiển thị đầy đủ trục 14 ngày liên tục (ngày không có đơn hiển thị cột mốc thấp kèm nhãn `0đ`), gắn nhãn số tiền trực tiếp trên đầu cột và tooltip chi tiết khi rê chuột.
  - Thẻ "Doanh thu (đơn đã thanh toán)" bổ sung dòng phụ chú tách bạch doanh thu từ mảng **Kỹ thuật số** và **Đĩa vật lý**.
- **Tab "Sản phẩm" (Tối ưu hóa nhập liệu Hybrid & Bộ lọc nhanh):**
  - Trong form thêm/sửa: Khi chọn `Kỹ thuật số`, tự động khóa ô `Tồn kho (đĩa)` (`∞`) và hiện ô `Cấu hình tối thiểu`; khi chọn `Vật lý (Đĩa)`, bắt buộc nhập `Tồn kho (đĩa)` và hiện ô `Trọng lượng / Phụ kiện đi kèm`.
  - Thêm bộ lọc nhanh `Tất cả` | `Bản Số` | `Bản Đĩa` kèm số lượng bên cạnh ô tìm kiếm.
- **Tab "Người dùng" (Bảo vệ tài khoản Admin & Thêm Role mới):**
  - Làm mờ và khóa (`disabled`) dropdown đổi `Vai trò` cùng nút `Khóa` ở dòng tài khoản đang đăng nhập (`Admin (bạn)`).
  - Bổ sung vai trò **`Nhà phát hành (Publisher)`** (`publisher`) vào danh sách phân quyền người dùng và schema database.
- **Tab "Hỗ trợ" (Dữ liệu Ticket mẫu & Giao diện phản hồi):**
  - Khởi tạo sẵn 2 Ticket hỗ trợ mẫu ở trạng thái `Đang mở` (1 ticket hỏi về lỗi kích hoạt Key game số, 1 ticket hỏi về đổi địa chỉ nhận đĩa PS5).
  - Cho phép bấm mở xem nội dung chi tiết, nhập câu trả lời và bấm `Phản hồi & Đóng ticket`, tự động đồng bộ số lượng với thẻ "Ticket hỗ trợ đang mở" ở tab Tổng quan.

## Cập nhật Giao diện & Trải nghiệm người dùng (UI/UX Hybrid)
- **Trang Chi tiết Sản phẩm (`frontend/assets/detail.js`, `backend/src/api/products.routes.js`):**
  - Bổ sung khối **Đặc tả bản vật lý** (Physical Specs Box: tình trạng Nguyên Seal 100%, hộp đĩa Blu-ray PS5 tiêu chuẩn kèm bìa lót & booklet, trọng lượng 180g, phương thức vận chuyển) hiển thị ngay dưới phần chọn phiên bản khi ở tab "Vật lý".
  - Thay nút điều hướng sang Steam bằng **Trình xem Trailer & Ảnh chụp màn hình (Modal Gallery)** trực tiếp trên 5GUYS (hỗ trợ phát video MP4/WebM/HLS, strip ảnh thu nhỏ, phím tắt `←`/`→`/`Esc`). Thêm API proxy `GET /api/products/:idOrSlug/gallery` có cache 6 giờ để lấy dữ liệu media mà không bị chặn CORS.
- **Trang Kho Game (`frontend/library.html`, `frontend/assets/hub.js`):**
  - **Khối ổ cứng lưu trữ:** Cho phép bấm mở dropdown chuyển đổi giữa `Ổ C: Kingston SSD (Trống 120 GB)` và `Ổ D: Samsung 990 Pro (Trống 358 GB)` (lưu vào `localStorage`), đồng thời hiển thị dung lượng cài đặt riêng của từng game đang chọn (VD: *Hollow Knight: Silksong - 12 GB*, *Black Myth: Wukong - 130 GB*).
  - **Biểu đồ Thời lượng chơi tuần này:** Gắn dữ liệu giờ chơi từ T2 đến CN và tổng số giờ riêng biệt cho từng tựa game; tự động cập nhật biểu đồ cột khi chuyển đổi giữa các game trong kho.
  - **Mã bản quyền 5GUYS DRM Safe:** Tự động sinh mã Key định dạng `5GUYS-XXXX-0000-XXXX` cố định theo tài khoản và từng game; mặc định làm mờ/che dấu sao (`*`), tích hợp nút con mắt ẩn/hiện và nút Copy vào clipboard.
- **Trang Giỏ hàng & Thanh toán (`frontend/cart.html`, `backend/src/api/store.routes.js`):**
  - Tự động kiểm tra sản phẩm mang nhãn `VẬT LÝ` để hiển thị tùy chọn **Giao tiêu chuẩn (30.000đ)** hoặc **Giao hỏa tốc (60.000đ)** trong khung Địa chỉ giao hàng.
  - Hiển thị dòng **Phí vận chuyển** trong bảng "Chi tiết chi phí" và cộng trực tiếp vào `TỔNG CỘNG` (đồng bộ công thức tính và lưu `shipping_total` phía backend). Nếu giỏ hàng chỉ có game `KỸ THUẬT SỐ`, phí vận chuyển = `0đ` và ẩn khung địa chỉ giao hàng.

## Chức năng mới
- Thanh toán mô phỏng: đơn chuyển trạng thái, game số vào Kho game, đĩa trừ tồn kho, tích điểm.
- Trang Quản trị `frontend/admin.html`: tổng quan doanh thu, quản lý đơn (giao hàng / hoàn tất / hủy), duyệt hoàn tiền, thêm/sửa/ẩn sản phẩm và tồn kho, phân quyền và khóa tài khoản, trả lời ticket hỗ trợ.
- Khách hàng: gửi yêu cầu hoàn tiền thật, viết đánh giá trên trang chi tiết game, gửi và theo dõi ticket hỗ trợ.
- Phân quyền theo vai trò (customer / staff / admin), kiểm tra trên server.

## Sửa lỗi
- Đăng ký lỗi khi bấm nút hiện mật khẩu.
- Giá trên trang Đơn hàng bị nhân 25.000 lần.
- Thêm bản đĩa vào giỏ lại thêm nhầm bản số.
- Đăng nhập xong bị mất thông tin vai trò.
- Tổng tiền giữa giỏ hàng và server không khớp (server tự tính VAT, phí, mã giảm giá).
- Game số chỉ mua 1 bản, không mua lại game đã sở hữu.
- Thông báo lỗi rõ ràng thay cho câu chung "Không kết nối được API".
- `seed.sql` bị cụt dòng cuối.
