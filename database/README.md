# Cơ sở dữ liệu MySQL (`database/`)

Hệ quản trị **MySQL `8.0+`** (Engine `InnoDB`, charset `utf8mb4_0900_ai_ci`) cho nền tảng phân phối game **5GUYS Vault**. Toàn bộ **31 bảng** (đã gộp đầy đủ cấu trúc v2) nằm gọn trong `schema.sql`, và toàn bộ dữ liệu mẫu nằm gọn trong `seed.sql`.

---

## 1. Thứ tự Chạy Script SQL

Chạy lần lượt **2 tệp** sau trong **MySQL Workbench** hoặc **MySQL CLI**:

```sh
mysql -u root -p < database/schema.sql
mysql -u root -p 5guys_store < database/seed.sql
```

*(Tùy chọn)* Nâng quyền Admin cho một tài khoản đã đăng ký: chỉnh lại email trong `database/make_admin.sql` rồi chạy trên `5guys_store`, sau đó đăng xuất và đăng nhập lại trên web.

---

## 2. Cấu trúc 31 Bảng dữ liệu (`database/schema.sql`)

| Nhóm nghiệp vụ | Danh sách bảng | Chức năng chính |
| :--- | :--- | :--- |
| **Người dùng & Địa chỉ** (2) | `users`, `user_addresses` | Tài khoản (`email`, `password_hash`, `display_name`, `role` gồm `customer/publisher/staff/admin`, `status`) và sổ địa chỉ giao đĩa (tối đa 10/user) |
| **Catalog & Thuộc tính** (8) | `categories`, `products`, `product_categories`, `product_images`, `game_media`, `game_requirements`, `product_editions`, `game_patches` | Danh mục sản phẩm Số/Đĩa (kèm `publisher_user_id`, `rejection_reason`), ảnh bìa, media trailer, cấu hình (JSON), phiên bản giá và lịch sử Bản vá / DLC (`game_patches`) |
| **Tồn kho & Kho Key** (2) | `physical_inventory`, `digital_licenses` | Quản lý tồn kho thực/giữ chỗ cho game đĩa và kho key mã hóa cho game số |
| **Giỏ hàng & Đơn hàng** (5) | `carts`, `cart_items`, `orders`, `order_items`, `order_fulfillments` | Giỏ hàng theo user, đơn hàng (kèm trạng thái `'shipped'`, `shipping_address` JSON và cột tặng quà `recipient_user_id`, `gift_email`, `gift_message`), chi tiết đơn và cấp phát |
| **Thanh toán & Hoàn tiền** (2) | `payments`, `refunds` | Kênh thanh toán (`provider`) + mã tham chiếu đối soát (`provider_reference` theo PCI-DSS SAQ-A) và yêu cầu hoàn tiền |
| **Thư viện, Loyalty & Ví** (7) | `game_library`, `loyalty_accounts`, `loyalty_transactions`, `wallets`, `wallet_transactions`, `gift_codes`, `gift_redemptions` | Thư viện game sở hữu (kèm `installed_version`, `dlc_installed` cho Auto-Patcher), tích/thu hồi điểm thưởng, ví và mã quà tặng |
| **Cộng đồng, Mod & Hỗ trợ** (5) | `reviews`, `review_votes`, `game_mods`, `support_tickets`, `support_messages` | Đánh giá 1–5 sao (kèm `publisher_reply`), bình chọn hữu ích (`review_votes`), Cộng đồng Mod (`game_mods`) và phiếu hỗ trợ |

> **Cơ chế tự động bảo toàn (`ensureSchemaReady`):** Khi Backend khởi động, `backend/src/db.js` tự động kiểm tra qua `INFORMATION_SCHEMA` để bổ sung an toàn mọi cột/bảng mới nếu chạy trên database cũ hơn.

---

## 3. Dữ liệu & Tài khoản Seed Mặc định (`database/seed.sql`)

- **Tài khoản Admin mặc định (mật khẩu chung `Admin@12345`):**
  - `admin@5guys.com`: Được đặc cách bỏ qua bước 2FA trên `login.html` để kiểm thử nhanh.
  - `admin@5guys.vn`: Bắt buộc xác thực 2FA (khóa Base32 mặc định `JBSWY3DPEHPK3PXP` nếu chưa có khóa riêng trong trình duyệt).
- **Dữ liệu catalog minh họa (chạy lại nhiều lần an toàn với `ON DUPLICATE KEY UPDATE`):**
  - **10 danh mục thể loại** (`Hành động`, `Phiêu lưu`, `Metroidvania`, `Souls-like`, `RPG`, `Thế giới mở`, `Indie`, `Kinh dị`, `Mô phỏng`, `Platformer`).
  - **45 bản ghi sản phẩm** (bao gồm 24 tựa game nổi bật với biến thể Bản Số & Bản Đĩa, cùng mini-game web `neon-viper`, `black-myth`), tồn kho mặc định 25 đĩa/mẫu, ảnh bìa Steam CDN, trailer, thông số cấu hình PC và phiên bản `Standard`.

---

## 4. Quy tắc Toàn vẹn & Bảo mật Database

- Toàn bộ giá trị tiền tệ dùng `DECIMAL(12,2)` (hoặc `DECIMAL(14,2)` cho `lifetime_spend`), thời gian lưu chuẩn `UTC`.
- Mật khẩu chỉ lưu dạng chuỗi băm **Bcrypt (cost 12)** trong `users.password_hash`.
- Hệ thống **không lưu số thẻ ngân hàng hay mã CVV/CVC**; bảng `payments` chỉ lưu tên kênh thanh toán (`provider`) và mã tham chiếu giao dịch (`provider_reference`).
- Sử dụng tài khoản MySQL riêng (`5guys_api`) chỉ với các quyền dữ liệu tối thiểu (`SELECT, INSERT, UPDATE, DELETE` trên `5guys_store.*`), không dùng tài khoản `root` để chạy API.
