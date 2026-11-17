-- Cap nhat database cho ban v2 (Admin, giao hang, hoan tien, danh gia, ho tro).
-- Chay MOT LAN tren database da tao truoc do. Database tao moi bang schema.sql da co san thay doi nay.
USE `5guys_store`;

-- Them trang thai "shipped" (dang giao) cho don hang
ALTER TABLE orders MODIFY status
  ENUM('pending_payment','paid','processing','shipped','fulfilled','cancelled','refunded','partially_refunded')
  NOT NULL DEFAULT 'pending_payment';

-- Them vai tro "publisher" (Nha phat hanh) cho nguoi dung
ALTER TABLE users MODIFY role
  ENUM('customer','publisher','staff','admin')
  NOT NULL DEFAULT 'customer';

-- Phien ban "Standard" cho moi game (bu phan bi cut o cuoi seed.sql ban cu)
INSERT INTO product_editions(product_id,edition_name,edition_description,price,original_price,product_type)
SELECT id,'Standard','Standard edition',price,original_price,product_type FROM products WHERE status='active'
ON DUPLICATE KEY UPDATE price=VALUES(price);

-- Mo rong cho Module 1: Nha phat hanh (Publisher Portal) & Phe duyet game
ALTER TABLE products
  ADD COLUMN publisher_user_id BIGINT UNSIGNED NULL AFTER developer,
  ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER status,
  ADD CONSTRAINT fk_products_publisher FOREIGN KEY (publisher_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reviews
  ADD COLUMN publisher_reply TEXT NULL AFTER body,
  ADD COLUMN publisher_replied_at DATETIME NULL AFTER publisher_reply;
CREATE TABLE IF NOT EXISTS game_patches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  version VARCHAR(32) NOT NULL,
  title VARCHAR(200) NOT NULL,
  patch_notes TEXT NOT NULL,
  size_mb INT UNSIGNED NOT NULL DEFAULT 150,
  is_dlc BOOLEAN NOT NULL DEFAULT FALSE,
  released_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX(product_id, released_at)
) ENGINE=InnoDB;

-- Mo rong cho Module 2: Mua game lam qua tang (Gifting)
ALTER TABLE orders
  ADD COLUMN recipient_user_id BIGINT UNSIGNED NULL AFTER user_id,
  ADD COLUMN gift_email VARCHAR(254) NULL AFTER shipping_address,
  ADD COLUMN gift_message VARCHAR(500) NULL AFTER gift_email,
  ADD CONSTRAINT fk_orders_recipient FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Mo rong cho Module 3: Cong dong Mod dong (game_mods)
CREATE TABLE IF NOT EXISTS game_mods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(60) NOT NULL DEFAULT 'LỐI CHỌI',
  version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  size_label VARCHAR(32) NOT NULL DEFAULT '15 MB',
  description TEXT NOT NULL,
  downloads_count INT UNSIGNED NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 4.80,
  status ENUM('published','hidden') NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX(product_id, status)
) ENGINE=InnoDB;

-- Mo rong cho Module 4: Tu dong cap nhat ban va & DLC trong Kho game
ALTER TABLE game_library
  ADD COLUMN installed_version VARCHAR(32) NOT NULL DEFAULT '1.0.0' AFTER status,
  ADD COLUMN dlc_installed BOOLEAN NOT NULL DEFAULT FALSE AFTER installed_version;

-- Dam bao tai khoan admin@5guys.com ton tai de dang nhap nhanh khong qua 2FA
INSERT IGNORE INTO users(email,password_hash,display_name,role) VALUES
  ('admin@5guys.com','$2a$12$pUuj40AP3ieK5j.HeHi6sOKN7Q4VDkEiQDcov7E5mUJ2TS8jETnNy','Admin','admin');
