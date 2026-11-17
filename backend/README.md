# 5GUYS Node.js API

Node.js 20+, Express, MySQL 8.0+. API routes and their logic live in `src/api` (one file per area).

## Start locally

1. Create the database: `mysql -u root -p < database/schema.sql`; optional demo catalog: `mysql -u root -p 5guys_store < database/seed.sql`.
   To load the latest demo catalog or format variants into an existing database, run the seed command again; existing physical stock counts are preserved.
2. Create a restricted MySQL user for the API and grant it access only to `5guys_store`.
3. Copy `.env.example` to `.env`, set database credentials and a random JWT secret of at least 32 characters.
4. Run `npm install`, then `npm run dev` from `backend`.
5. API health: `GET http://localhost:3000/api/health`.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/products/:idOrSlug` also returns sibling digital/physical formats for the same game when both are sold.
- `GET /api/products`, `GET /api/products/:idOrSlug` (includes detail sections: media, requirements, editions, approved reviews)
- Auth required: `GET /api/cart`, `PUT /api/cart/items`, `DELETE /api/cart/items/:productId`
- Auth required: `POST /api/orders` (creates pending order in an InnoDB transaction; no payment is taken), `GET /api/orders`, `GET /api/orders/:id`
- Auth required: `GET /api/library`, `GET /api/loyalty`

All customer queries are scoped to the authenticated user. Passwords use bcrypt; tokens are signed JWTs; SQL is parameterized; public routes have rate limits. Checkout intentionally creates a pending-payment order. A real payment provider, webhook signature verification, physical shipping workflow, mail verification, emailing password-reset codes (currently demo mode), and encryption-key management for digital license delivery need separate production setup. Never put real licenses or production secrets in seed data or Git.

## Cập nhật v2 (Admin, thanh toán mô phỏng, hoàn tiền, đánh giá, hỗ trợ)

- `POST /api/orders` nhận `{ paymentMethod, couponCode, addressId }`; server tự tính giảm giá, VAT 10%, phí thanh toán và tổng tiền.
  - Giỏ có game đĩa thì **bắt buộc** `addressId` (id trong sổ địa chỉ của chính người dùng), thiếu trả `address_required`, không phải của mình trả `address_not_found`. Giỏ chỉ có game số thì không cần.
  - Server lưu **bản chụp** địa chỉ vào đơn (`recipient_name`, `recipient_phone`, `shipping_address`), nên sửa/xóa địa chỉ trong hồ sơ không làm đổi đơn cũ. `GET /api/orders/:id` và `GET /api/admin/orders` trả kèm 3 trường này.
- `POST /api/orders/:id/pay` thanh toán mô phỏng (chỉ khi `NODE_ENV=development`): game số vào thư viện, đĩa trừ tồn kho, cộng điểm.
- `POST /api/orders/:id/refund` khách gửi yêu cầu hoàn tiền.
- `POST /api/products/:id/reviews` viết đánh giá (đánh dấu "đã mua" nếu có đơn đã thanh toán).
- `POST|GET /api/support/tickets` gửi và xem ticket hỗ trợ.
- `/api/admin/*` (vai trò admin/staff, kiểm tra trong database): `stats`, `orders`, `orders/:id/status`, `refunds`, `refunds/:id`, `products`, `users`, `tickets`.
- Database cũ cần chạy `database/update_v2.sql` một lần. Nâng quyền admin bằng `database/make_admin.sql`.

## Cập nhật v3 (Hồ sơ cá nhân, quên mật khẩu)

Tài khoản admin mặc định có sẵn trong `seed.sql`: `admin@5guys.vn` / `Admin@12345`.

### Hồ sơ cá nhân (`src/api/profile.routes.js`, mọi route cần đăng nhập)

| Phương thức | Đường dẫn | Chức năng |
|---|---|---|
| GET | `/api/profile` | Thông tin người dùng, thống kê (đơn, game, điểm, hạng), danh sách địa chỉ |
| PUT | `/api/profile` | Sửa `{ displayName, phone }` |
| PUT | `/api/profile/password` | Đổi mật khẩu `{ currentPassword, newPassword }` |
| POST | `/api/profile/addresses` | Thêm địa chỉ (tối đa 10). Trả `addressId`; nếu trùng hệt địa chỉ đã có (không phân biệt hoa/thường, khoảng trắng) thì dùng lại địa chỉ cũ, `duplicate: true` |
| PUT | `/api/profile/addresses/:id` | Sửa địa chỉ / đặt mặc định |
| DELETE | `/api/profile/addresses/:id` | Xóa địa chỉ |
| PUT / DELETE | `/api/profile/avatar` | Đổi / xóa ảnh đại diện (JPEG ≤ 300KB, lưu ở `backend/uploads/avatars/`). Giao diện chọn ảnh trên `profile.html` **chưa làm** |

- Số điện thoại: đúng 10 số, đầu 03/05/07/08/09, chấp nhận `+84`; lưu dạng `0xxxxxxxxx`. Sai trả `invalid_phone`.
- Mật khẩu mới tối thiểu 10 ký tự; sai mật khẩu hiện tại trả `wrong_password`.
- Địa chỉ dùng bảng `user_addresses` có sẵn; tên Tỉnh/Phường lấy từ API công khai provinces.open-api.vn v2 ở phía frontend.

### Quên mật khẩu (`src/api/auth.routes.js`, chế độ demo)

| Phương thức | Đường dẫn | Body | Chức năng |
|---|---|---|---|
| POST | `/api/auth/forgot-password` | `{ email }` | Tạo mã 6 số, hiệu lực 15 phút. Khi `NODE_ENV` khác `production` trả mã trong `demoCode` và in ra console |
| POST | `/api/auth/reset-password` | `{ email, code, newPassword }` | Kiểm tra mã rồi đặt mật khẩu mới |

- Không gửi email. Mã lưu trong bộ nhớ server (chỉ lưu bản băm SHA-256), khởi động lại server là mất.
- Mã dùng 1 lần; sai 5 lần thì hủy (`too_many_attempts`); mỗi email phải chờ 60 giây mới xin mã mới (`reset_cooldown`).
- Email không tồn tại vẫn trả cùng một thông báo, để không lộ email nào đã đăng ký.
- Không cần chạy thêm SQL nào cho bản v3.

## Community Games (HTML5)

- Database mới: chạy `database/schema.sql` rồi `database/seed.sql`. Database hiện có: chạy `database/update_v3.sql`; migration tạo bảng và nạp 5 game HTML5, không cần chạy lại toàn bộ seed demo.
- Người dùng có tài khoản đang hoạt động tải ZIP qua `POST /api/community-games` (`multipart/form-data`: `title`, `description` tùy chọn, `game` là file ZIP). Game phải có đúng một `index.html`; giới hạn ZIP 20 MB, tối đa 500 file, 25 MB/file và 100 MB sau giải nén. Game mới ở trạng thái chờ duyệt.
- `GET /api/community-games` và `GET /api/community-games/:slug` chỉ trả game đã duyệt. `GET /api/community-games/mine` cần đăng nhập; `GET /api/community-games/:slug/play/:file` chỉ phục vụ nội dung tĩnh của game đã duyệt.
- Admin/staff xem hàng đợi tại `GET /api/admin/community-games`, duyệt/từ chối bằng `PUT /api/admin/community-games/:id` với `{ "action": "publish" | "reject", "reviewNote": "..." }`.
- ZIP được giải nén vào `backend/uploads/community-games/` (có thể đổi bằng `COMMUNITY_GAMES_STORAGE`); thư mục này bị gitignore. Hãy sao lưu/lưu trữ bền vững thư mục này khi triển khai.
- Game chạy trong iframe sandbox với chính sách nội dung riêng. Khi public, nên phục vụ API/nội dung tải lên từ origin tách biệt với frontend; cấu hình `FRONTEND_ORIGIN` đúng domain frontend để iframe game được phép nhúng. Không gộp dữ liệu người đăng vào bảng sản phẩm bán hàng.
