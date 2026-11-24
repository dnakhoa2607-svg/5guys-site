# 5GUYS Node.js API (`backend/`)

REST API viết bằng **Node.js `>= 20` (ES Modules)**, **Express `4.21`**, **Zod `4.6`**, **JWT**, **Bcryptjs** và **MySQL2 `3.12`** phục vụ nền tảng phân phối game **5GUYS Vault**.

---

## 1. Cấu trúc Mã nguồn Backend

| Thành phần | Chức năng chính |
| :--- | :--- |
| `src/server.js` | Kiểm tra kết nối MySQL, chạy `ensureSchemaReady()` và mở HTTP server trên `PORT` (`3000`) |
| `src/app.js` | Cấu hình `helmet()`, ẩn `x-powered-by`, `cors()`, `express.json({ limit: '32kb' })`, `rateLimit` đa tầng (`/api/auth`, `writeLimiter`, `/api`) & error handlers |
| `src/config.js` | Nạp và kiểm tra biến môi trường `.env` bằng `zod` |
| `src/db.js` | Pool kết nối MySQL2 (`utc`, `decimalNumbers: true`), `inTransaction()` và `ensureSchemaReady()` |
| `src/middleware/auth.js` | `requireAuth` (xác thực JWT + kiểm tra trực tiếp `users.status = 'active'` & `role` từ MySQL) và `requireRole(...roles)` |
| `src/middleware/errors.js` | Chuẩn hóa lỗi `404 not_found`, `400 invalid_request` (Zod), `409 already_exists` (`ER_DUP_ENTRY`), `500` |
| `src/ai/advisor.js` | Trích xuất 3 nhóm dữ liệu (Phần cứng / Sở thích / Ngân sách), hỏi làm rõ và gợi ý game fallback nội bộ |
| `src/api/index.js` | Router tổng `/api` + `GET /api/health` |

---

## 2. Biến Môi trường (`backend/.env`)

Sao chép từ `backend/.env.example`:

| Biến | Mặc định / Định dạng | Mô tả |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Chế độ chạy (`development` / `test` / `production`). Khi là `production`, endpoint thanh toán mô phỏng trả `404` và ẩn `demoCode` quên mật khẩu |
| `PORT` | `3000` | Cổng lắng nghe của API server |
| `FRONTEND_ORIGIN` | `http://127.0.0.1:5500,http://localhost:5500` | Danh sách origin được phép gọi API qua CORS (phân tách bằng dấu phẩy) |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | `127.0.0.1`, `3306`, `5guys_store` | Thông tin máy chủ MySQL |
| `DB_USER`, `DB_PASSWORD` | `5guys_api`, *(bắt buộc)* | Tài khoản MySQL dùng cho API |
| `JWT_SECRET` | *(bắt buộc, `>= 32` ký tự)* | Khóa bí mật ký JSON Web Token |
| `JWT_EXPIRES_IN` | `2h` | Thời hạn hiệu lực của mỗi access token |
| `GEMINI_API_KEY` | *(tùy chọn)* | API Key Google Gemini cho trợ lý `PC2GAMES AI`; nếu trống sẽ tự dùng bộ luật fallback trong `advisor.js` |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Model Gemini chính (tự fallback sang `gemini-3.5-flash-lite` khi quá tải) |

---

## 3. Khởi chạy Cục bộ

1. Tạo cơ sở dữ liệu và nạp dữ liệu mẫu (chi tiết xem [database/README.md](../database/README.md)):
   ```sh
   mysql -u root -p < database/schema.sql
   mysql -u root -p 5guys_store < database/seed.sql
   ```
2. Tạo user MySQL cho API với quyền tối thiểu (`SELECT, INSERT, UPDATE, DELETE` trên `5guys_store.*`).
3. Sao chép `backend/.env.example` thành `backend/.env`, điền `DB_PASSWORD` và `JWT_SECRET` (`>= 32` ký tự).
4. Cài đặt dependencies và khởi động API:
   ```sh
   cd backend
   npm install
   npm run dev
   ```
5. Kiểm tra sức khỏe server: `GET http://localhost:3000/api/health` → `{ "status": "ok" }`.

---

## 4. Tự động Đồng bộ Schema & Seed (`ensureSchemaReady`)

Khi khởi động ở `src/server.js` (và được đảm bảo trước các route liên quan), hàm `ensureSchemaReady()` trong `src/db.js` tự động kiểm tra qua `INFORMATION_SCHEMA.COLUMNS` và `INFORMATION_SCHEMA.TABLE_CONSTRAINTS` để:
- Cập nhật `users.role` bổ sung giá trị `'publisher'`.
- Bổ sung các cột `products.publisher_user_id`, `products.rejection_reason`, khóa ngoại `fk_products_publisher`, cùng `reviews.publisher_reply` và `reviews.publisher_replied_at`.
- Tạo bảng `game_patches` (Module 4) và `game_mods` (Module 3) nếu chưa tồn tại.
- Bổ sung các cột tặng quà trên `orders` (`recipient_user_id`, `gift_email`, `gift_message`, `fk_orders_recipient`).
- Bổ sung `game_library.installed_version` (`'1.0.0'`) và `game_library.dlc_installed` (`FALSE`).
- Chèn an toàn (`INSERT IGNORE`) tài khoản admin `admin@5guys.com` / `Admin@12345`.

Ngoài ra, các route khởi tạo sẵn dữ liệu demo trong transaction nếu bảng đang rỗng:
- `ensurePatchesSeeded()` (`store.routes.js`): Seed bản Patch `v1.2.0` và gói DLC mẫu cho các game số đang bán vào `game_patches`.
- `ensureModsReady()` (`mods.routes.js`): Seed 10 bản Mod mẫu cho 5 tựa game phổ biến vào `game_mods`.
- `ensureAdminReady()` (`admin.routes.js`): Seed 2 ticket hỗ trợ mẫu vào `support_tickets`.

> **Lưu ý quyền MySQL:** Nếu tài khoản `5guys_api` chỉ được cấp `SELECT, INSERT, UPDATE, DELETE`, hãy khởi tạo database bằng `database/schema.sql` (đã gộp đầy đủ cấu trúc v2) dưới tài khoản `root` trước, khi đó `ensureSchemaReady()` sẽ không cần thực thi `ALTER` hay `CREATE`.

---

## 5. Danh sách Đầy đủ REST API Endpoints

### 5.1. Xác thực & Quên mật khẩu (`auth.routes.js` — Giới hạn 30 req / 15 phút)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới (`Bcrypt` cost 12, tạo sẵn `loyalty_accounts`), trả `user` + `token` |
| `POST` | `/api/auth/login` | Đăng nhập xác thực mật khẩu, cập nhật `last_login_at`, trả `user` + `token` |
| `GET` | `/api/auth/me` | *(Auth)* Trả thông tin người dùng đang đăng nhập |
| `POST` | `/api/auth/forgot-password` | *(Demo)* Sinh mã OTP 6 số (hiệu lực 15p, cooldown 60s, lưu băm SHA-256 trong RAM) |
| `POST` | `/api/auth/reset-password` | Kiểm tra OTP bằng `crypto.timingSafeEqual()`, sai 5 lần hủy mã (`too_many_attempts`), đặt mật khẩu mới |

### 5.2. Sản phẩm, Media & Đánh giá (`products.routes.js`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Lọc/tìm kiếm catalog (`q`, `type`, `platform`, `genre`, `limit`, `offset`); khi truyền `type` sẽ chọn đúng bản ghi Số hoặc Đĩa kèm giá và tồn kho khả dụng của định dạng đó |
| `GET` | `/api/products/reviews` | Lấy top 50 đánh giá đã duyệt kèm `helpful_count` từ `review_votes` và `publisher_reply` cho `reviews.html` |
| `GET` | `/api/products/:idOrSlug/gallery` | Reverse proxy lấy trailer & screenshots từ Steam (`galleryCache` TTL 6 giờ, tránh CORS) |
| `GET` | `/api/products/:idOrSlug` | Chi tiết sản phẩm kèm `formats`, `media`, `requirements`, `editions` và `reviews` (gồm `helpful_count`, `publisher_reply`) |
| `POST` | `/api/products/:id/reviews` | *(Auth)* Đăng/cập nhật đánh giá 1–5 sao, tự gắn `verified_purchase` nếu đã mua, cập nhật `products.rating` |
| `POST` | `/api/products/reviews/:reviewId/vote` | *(Auth)* Toggle bình chọn đánh giá hữu ích trong `review_votes`, trả `{ ok, helpfulCount, voted }` |

### 5.3. Giỏ hàng, Đơn hàng, Tặng quà, Kho game & Loyalty (`store.routes.js`, `payments.routes.js` — Yêu cầu `requireAuth`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/cart` | Lấy sản phẩm trong giỏ hàng của người dùng |
| `PUT` | `/api/cart/items` | Thêm/cập nhật số lượng sản phẩm (`digital` tự khóa `1`; `physical` kiểm tra tồn kho khả dụng) |
| `DELETE` | `/api/cart/items/:productId` | Xóa 1 sản phẩm khỏi giỏ hàng |
| `POST` | `/api/orders` | Tạo đơn trong Transaction (giới hạn tối đa 5 đơn `pending_payment`/tài khoản): kiểm tồn kho vật lý, kiểm trùng sở hữu số, tính `computeTotals` phía server (coupon `SELL10`, VAT 10%, phí cổng thanh toán, ship `30.000đ`/`60.000đ`), chụp `shipping_address`, hỗ trợ `{ isGift, giftEmail, giftMessage }` |
| `GET` | `/api/orders` | Lấy danh sách đơn hàng của người dùng kèm sẵn mảng `items` (tránh N+1 HTTP requests), `shipping_address`, `gift_email` và `refund_status` mới nhất |
| `GET` | `/api/orders/:id` | Lấy chi tiết 1 đơn hàng và danh sách `order_items` |
| `POST` | `/api/orders/:id/pay` | *(Demo, khóa khi `NODE_ENV=production`)* Thanh toán mô phỏng: khóa kiểm tra `game_library FOR UPDATE` rồi cấp game số cho `recipient_user_id || req.user.sub`, trừ tồn kho đĩa + tạo `order_fulfillments`, lưu `provider_reference` vào `payments`, cộng điểm và tự động nâng hạng `loyalty_accounts.tier` (`bronze`/`silver`/`gold`) |
| `POST` | `/api/orders/:id/refund` | Khách gửi yêu cầu hoàn tiền (`requested`) cho đơn đã thanh toán (tự động từ chối `gift_order_not_refundable` với đơn quà tặng đã hoàn tất theo Điều 5.5) |
| `GET` | `/api/library` | Trả danh sách game số trong `game_library` kèm `installed_version`, `dlc_installed` và danh sách `patches` từ `game_patches` |
| `POST` | `/api/library/:productId/update` | Cập nhật `installed_version` và `dlc_installed` cho game sở hữu trong `game_library` |
| `GET` | `/api/loyalty` | Lấy số dư điểm, hạng thành viên và 100 biến động điểm gần nhất |

### 5.4. Cộng đồng Mod Động (`mods.routes.js`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/mods?slug=` | Lấy danh sách bản Mod (`status = 'published'`) theo game số (hoặc tối đa 100 mod toàn sàn nếu không truyền `slug`) |
| `POST` | `/api/mods` | *(Auth)* Đăng tải bản Mod mới cho một tựa game số trong `game_mods` |
| `POST` | `/api/mods/:id/download` | *(Auth)* Tăng `downloads_count` an toàn trong Transaction (`FOR UPDATE`) và trả metadata bản Mod |

### 5.5. Cổng Nhà phát hành (`publisher.routes.js` — Yêu cầu `publisher` hoặc `admin`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/publisher/dashboard` | Trả thống kê `stats`, danh sách game của Studio, danh sách review và lịch sử `game_patches` |
| `POST` | `/api/publisher/products` | Tạo game mới (`price >= 1000`, `cover_url` chuẩn `http(s)://`) trong Transaction với `status = 'draft'`, kèm `physical_inventory` hoặc `game_requirements` và bản `'Standard'` trong `product_editions` |
| `PUT` | `/api/publisher/products/:id/pricing` | Cập nhật giá bán (`>= 1000`), giá gốc, tự tính `discount_percent` và đồng bộ `product_editions` `'Standard'` |
| `POST` | `/api/publisher/products/:id/patches` | Phát hành bản vá hoặc DLC mới vào `game_patches` |
| `PUT` | `/api/publisher/reviews/:reviewId/reply` | Gửi phản hồi chính thức của Nhà phát hành cho đánh giá về game của Studio |

### 5.6. Quản trị Hệ thống (`admin.routes.js` — Yêu cầu `admin` hoặc `staff`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Thống kê doanh thu tổng, tách doanh thu Số / Vật lý, đơn theo trạng thái, doanh thu 14 ngày liên tục, top sản phẩm & cảnh báo tồn kho thấp |
| `GET` / `GET` | `/api/admin/orders`, `/api/admin/orders/:id` | Danh sách đơn hàng (tối đa 200) và chi tiết đơn để điều phối giao vận / in phiếu / xem Key |
| `PUT` | `/api/admin/orders/:id/status` | Chuyển trạng thái đơn (`processing`, `shipped`, `fulfilled`, `cancelled`) kèm hoàn giữ chỗ khi hủy |
| `GET` / `PUT` | `/api/admin/refunds`, `/api/admin/refunds/:id` | *(Chỉ `admin` được `PUT`)* Duyệt/từ chối hoàn tiền trong Transaction: thu hồi `game_library`, hoàn tồn kho đĩa (nếu chưa giao), thu hồi điểm & tính lại `tier` Loyalty |
| `GET` / `POST` / `PUT` | `/api/admin/products`, `/api/admin/products/:id` | *(Chỉ `admin` được `POST`/`PUT`)* Quản lý toàn bộ catalog (`cover_url` chuẩn `http(s)://`); đồng bộ giá `product_editions` `'Standard'` và xóa `rejection_reason` khi chuyển `active` |
| `PUT` | `/api/admin/products/:id/approval` | *(Chỉ `admin`)* Phê duyệt (`approve` → `active`) hoặc từ chối (`reject` → `inactive` + lưu `rejection_reason`) game từ Publisher |
| `GET` / `PUT` | `/api/admin/users`, `/api/admin/users/:id` | Danh sách tài khoản và phân quyền (`customer`/`publisher`/`staff`/`admin`, khóa/mở khóa; chỉ `admin` được sửa và chặn tự sửa chính mình) |
| `GET` / `PUT` | `/api/admin/tickets`, `/api/admin/tickets/:id` | Xem danh sách ticket hỗ trợ (tối đa 200), gửi phản hồi và cập nhật trạng thái |

### 5.7. Hồ sơ, Hỗ trợ & PC2GAMES AI (`profile.routes.js`, `support.routes.js`, `ai.routes.js`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` / `PUT` | `/api/profile`, `/api/profile`, `/api/profile/password` | *(Auth)* Xem hồ sơ + thống kê, cập nhật `displayName` + `phone` chuẩn VN 10 số, đổi mật khẩu |
| `POST` / `PUT` / `DELETE` | `/api/profile/addresses`, `/api/profile/addresses/:id` | *(Auth)* Thêm (tối đa 10, tự chống trùng lặp), sửa/đặt mặc định và xóa địa chỉ giao hàng |
| `POST` / `GET` | `/api/support/tickets` | *(Auth)* Khách hàng tạo mới hoặc xem 50 phiếu hỗ trợ gần nhất kèm phản hồi mới nhất |
| `POST` | `/api/ai/advisor` | *(Rate limit 15 req / 1 phút)* Tư vấn cấu hình game theo phần cứng + catalog active (Gemini API hoặc fallback `advisor.js`) |

---

## 6. Bảo mật & Giới hạn Phạm vi Demo

- **Các lớp bảo mật đã cài đặt:** `Bcrypt` (cost 12) + `JWT` có thời hạn `2h`; `requireAuth` và `requireRole` đối chiếu trực tiếp `status = 'active'` & `role` từ MySQL trên mọi request (chặn tức thì tài khoản bị khóa); `Helmet` security headers; `CORS` theo danh sách origin; `express.json({ limit: '32kb' })`; `Express Rate Limit` đa tầng (`/api/auth`: 30 req/15p, tác vụ ghi trên `/api/orders`, `/api/mods`, `/api/support`, `/api/products`: 30 req/15p, toàn cục `/api`: 180 req/phút, `/api/ai`: 15 req/phút); xác thực schema đầu vào bằng `Zod` (ràng buộc `http(s)://` cho `cover_url`); `100%` truy vấn SQL tham số hóa (`Prepared Statements`).
- **Phạm vi mô phỏng học thuật (Hướng phát triển Production):** Chuyển xác thực 2FA TOTP và lưu trữ `totp_secret` về phía Server (cấp `tempToken`), lưu phiên trong `HttpOnly` Cookie kèm Refresh Token, tích hợp cổng thanh toán thật + xác minh chữ ký webhook (kèm worker tự động hủy đơn `pending_payment` quá hạn), gửi email SMTP thật khi quên mật khẩu và cấp key DRM thật từ nhà phát hành gốc. Không đưa thông tin bí mật thật hoặc file `.env` lên Git.
