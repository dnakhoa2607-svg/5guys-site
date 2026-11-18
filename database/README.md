# Cơ sở dữ liệu MySQL (`database/`)

Hệ quản trị **MySQL `8.0+`** (Engine `InnoDB`, charset `utf8mb4_0900_ai_ci`) cho nền tảng phân phối game **5GUYS Vault**. Tổng cộng gồm **31 bảng** (**29 bảng gốc** trong `schema.sql` và **2 bảng mở rộng v2** trong `update_v2.sql`).

---

## 1. Thứ tự Chạy Script SQL

Chạy lần lượt các tệp sau trong **MySQL Workbench** hoặc **MySQL CLI**:

```sh
mysql -u root -p < database/schema.sql
mysql -u root -p 5guys_store < database/seed.sql
mysql -u root -p 5guys_store < database/update_v2.sql
```

*(Tùy chọn)* Nâng quyền Admin cho một tài khoản đã đăng ký: chỉnh lại email trong `database/make_admin.sql` rồi chạy trên `5guys_store`, sau đó đăng xuất và đăng nhập lại trên web.

---

## 2. Cấu trúc 31 Bảng dữ liệu

### 2.1. 29 bảng nền tảng (`database/schema.sql`)

| Nhóm nghiệp vụ | Danh sách bảng | Chức năng chính |
| :--- | :--- | :--- |
| **Người dùng & Địa chỉ** (2) | `users`, `user_addresses` | Tài khoản (`email`, `password_hash`, `display_name`, `role`, `status`) và sổ địa chỉ giao đĩa (tối đa 10/user) |
| **Catalog & Thuộc tính** (7) | `categories`, `products`, `product_categories`, `product_images`, `game_media`, `game_requirements`, `product_editions` | Danh mục sản phẩm Số/Đĩa, ảnh bìa, media trailer, cấu hình tối thiểu/khuyến nghị (JSON) và các phiên bản giá (`Standard`, ...) |
| **Tồn kho & Kho Key** (2) | `physical_inventory`, `digital_licenses` | Quản lý tồn kho thực/giữ chỗ cho game đĩa và kho key mã hóa cho game số |
| **Giỏ hàng & Đơn hàng** (5) | `carts`, `cart_items`, `orders`, `order_items`, `order_fulfillments` | Giỏ hàng theo user, đơn hàng (kèm bản chụp `shipping_address` JSON), chi tiết đơn và trạng thái cấp phát |
| **Thanh toán & Hoàn tiền** (2) | `payments`, `refunds` | Kênh thanh toán (`provider`) + mã tham chiếu đối soát (`provider_reference` theo PCI-DSS SAQ-A) và yêu cầu hoàn tiền |
| **Thư viện, Loyalty & Ví** (7) | `game_library`, `loyalty_accounts`, `loyalty_transactions`, `wallets`, `wallet_transactions`, `gift_codes`, `gift_redemptions` | Thư viện game sở hữu (`user_id`, `product_id`, `status`), tích/thu hồi điểm thưởng, ví và mã quà tặng |
| **Cộng đồng & Hỗ trợ** (4) | `reviews`, `review_votes`, `support_tickets`, `support_messages` | Đánh giá 1–5 sao, bình chọn đánh giá hữu ích (`review_votes`) và phiếu hỗ trợ + phản hồi Admin |

### 2.2. Nâng cấp bản v2 (`database/update_v2.sql`) — +2 bảng & mở rộng cột

- **2 bảng mới (nâng tổng số lên 31 bảng):**
  - `game_patches`: Lưu lịch sử Bản vá (`Patch`) và gói mở rộng `DLC` theo từng `product_id` (`version`, `title`, `patch_notes`, `size_mb`, `is_dlc`, `released_at`).
  - `game_mods`: Lưu các bản Mod do cộng đồng đăng tải (`product_id`, `author_user_id`, `title`, `category`, `version`, `size_label`, `description`, `downloads_count`, `rating`, `status`).
- **Mở rộng các bảng hiện có:**
  - `users.role`: Mở rộng `ENUM('customer','publisher','staff','admin')` bổ sung vai trò **Nhà phát hành (Publisher)**.
  - `orders.status`: Mở rộng thêm trạng thái `'shipped'` phục vụ điều phối vận chuyển đĩa vật lý.
  - `orders`: Bổ sung `recipient_user_id` (`fk_orders_recipient`), `gift_email`, `gift_message` cho hệ thống **Tặng quà (Gifting)**.
  - `products`: Bổ sung `publisher_user_id` (`fk_products_publisher`) và `rejection_reason` phục vụ luồng đăng game & duyệt game (`draft` → `active`/`inactive`).
  - `reviews`: Bổ sung `publisher_reply` và `publisher_replied_at` để Nhà phát hành trả lời đánh giá người chơi.
  - `game_library`: Bổ sung `installed_version` (mặc định `'1.0.0'`) và `dlc_installed` (mặc định `FALSE`) cho Auto-Patcher trong Kho game.

> **Cơ chế tự động bảo toàn (`ensureSchemaReady`):** Khi Backend khởi động, `backend/src/db.js` tự động kiểm tra qua `INFORMATION_SCHEMA` để áp dụng an toàn mọi thay đổi v2 nếu database cũ chưa chạy `update_v2.sql`.

---

## 3. Dữ liệu & Tài khoản Seed Mặc định (`seed.sql` & `update_v2.sql`)

- **Tài khoản Admin mặc định (mật khẩu chung `Admin@12345`):**
  - `admin@5guys.com`: Tạo tự động qua `seed.sql` / `update_v2.sql` / `ensureSchemaReady()` — **được đặc cách bỏ qua bước 2FA** trên `login.html` để kiểm thử nhanh.
  - `admin@5guys.vn`: Tạo trong `seed.sql` — **bắt buộc xác thực 2FA** (cùng khóa Base32 mặc định `JBSWY3DPEHPK3PXP` nếu chưa có khóa riêng trong trình duyệt).
- **Dữ liệu minh họa khác:**
  - 6 danh mục thể loại, 20 bản ghi sản phẩm mẫu (bao gồm biến thể bản Số & bản Đĩa của 10 tựa game nổi bật), tồn kho mặc định 25 đĩa/mẫu, thông số cấu hình PC, phiên bản `Standard` và 2 phiếu hỗ trợ mẫu trong `support_tickets`.
  - Ảnh bìa catalog trỏ tới Steam CDN; giá bán và thông số phục vụ minh họa đồ án.

---

## 4. Quy tắc Toàn vẹn & Bảo mật Database

- Toàn bộ giá trị tiền tệ dùng `DECIMAL(12,2)` (hoặc `DECIMAL(14,2)` cho `lifetime_spend`), thời gian lưu chuẩn `UTC`.
- Mật khẩu chỉ lưu dạng chuỗi băm **Bcrypt (cost 12)** trong `users.password_hash`.
- Hệ thống **không lưu số thẻ ngân hàng hay mã CVV/CVC**; bảng `payments` chỉ lưu tên kênh thanh toán (`provider`) và mã tham chiếu giao dịch (`provider_reference`).
- Sử dụng tài khoản MySQL riêng (`5guys_api`) chỉ với các quyền dữ liệu tối thiểu (`SELECT, INSERT, UPDATE, DELETE` trên `5guys_store.*`), không dùng tài khoản `root` để chạy API.
