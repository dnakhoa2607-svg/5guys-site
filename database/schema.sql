CREATE DATABASE IF NOT EXISTS `5guys_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `5guys_store`;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  phone VARCHAR(32), status ENUM('active','locked','deleted') NOT NULL DEFAULT 'active',
  role ENUM('customer','publisher','staff','admin') NOT NULL DEFAULT 'customer',
  email_verified_at DATETIME, last_login_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_addresses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
  recipient_name VARCHAR(100) NOT NULL, phone VARCHAR(32) NOT NULL,
  address_line VARCHAR(255) NOT NULL, ward VARCHAR(100), district VARCHAR(100), city VARCHAR(100) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX(user_id,is_default)
) ENGINE=InnoDB;

CREATE TABLE categories (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, slug VARCHAR(120) NOT NULL UNIQUE);
CREATE TABLE products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL, description TEXT, publisher VARCHAR(150), developer VARCHAR(150),
  release_date DATE, platform VARCHAR(80) NOT NULL, genre VARCHAR(80), cover_url VARCHAR(1000),
  product_type ENUM('digital','physical') NOT NULL, price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2), discount_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'VND', status ENUM('draft','active','inactive') NOT NULL DEFAULT 'draft',
  rating DECIMAL(3,2) NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX(product_type,status), INDEX(title), CHECK(price >= 0), CHECK(rating BETWEEN 0 AND 5)
) ENGINE=InnoDB;
CREATE TABLE product_categories (
  product_id BIGINT UNSIGNED NOT NULL, category_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY(product_id,category_id), FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(1000) NOT NULL, alt_text VARCHAR(255), sort_order SMALLINT NOT NULL DEFAULT 0,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE, UNIQUE(product_id,sort_order)
) ENGINE=InnoDB;
CREATE TABLE game_media (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id BIGINT UNSIGNED NOT NULL,
  media_type ENUM('screenshot','trailer') NOT NULL, media_url VARCHAR(1000) NOT NULL,
  caption VARCHAR(255), sort_order SMALLINT NOT NULL DEFAULT 0,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE, INDEX(product_id,sort_order)
) ENGINE=InnoDB;
CREATE TABLE game_requirements (
  product_id BIGINT UNSIGNED PRIMARY KEY, minimum_requirements JSON NOT NULL, recommended_requirements JSON NOT NULL,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE product_editions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id BIGINT UNSIGNED NOT NULL,
  edition_name VARCHAR(100) NOT NULL, edition_description VARCHAR(500), price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2), product_type ENUM('digital','physical') NOT NULL,
  UNIQUE(product_id,edition_name,product_type), FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE physical_inventory (
  product_id BIGINT UNSIGNED PRIMARY KEY, sku VARCHAR(80) UNIQUE, quantity_on_hand INT UNSIGNED NOT NULL DEFAULT 0,
  quantity_reserved INT UNSIGNED NOT NULL DEFAULT 0, low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 5,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id), CHECK(quantity_reserved <= quantity_on_hand)
) ENGINE=InnoDB;
CREATE TABLE digital_licenses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id BIGINT UNSIGNED NOT NULL,
  license_ciphertext VARBINARY(2048) NOT NULL, license_fingerprint BINARY(32) NOT NULL UNIQUE,
  status ENUM('available','reserved','sold','revoked') NOT NULL DEFAULT 'available',
  reserved_until DATETIME, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id), INDEX(product_id,status)
) ENGINE=InnoDB;

CREATE TABLE carts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  currency CHAR(3) NOT NULL DEFAULT 'VND', updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE cart_items (
  cart_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL, quantity INT UNSIGNED NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(cart_id,product_id),
  FOREIGN KEY(cart_id) REFERENCES carts(id) ON DELETE CASCADE, FOREIGN KEY(product_id) REFERENCES products(id), CHECK(quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_number VARCHAR(32) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL, status ENUM('pending_payment','paid','processing','shipped','fulfilled','cancelled','refunded','partially_refunded') NOT NULL DEFAULT 'pending_payment',
  subtotal DECIMAL(12,2) NOT NULL, discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0, shipping_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'VND',
  recipient_name VARCHAR(100), recipient_phone VARCHAR(32), shipping_address JSON,
  placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, paid_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id), INDEX(user_id,placed_at), CHECK(total >= 0)
) ENGINE=InnoDB;
CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL, product_title VARCHAR(200) NOT NULL,
  product_type ENUM('digital','physical') NOT NULL, unit_price DECIMAL(12,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL, line_total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY(product_id) REFERENCES products(id),
  CHECK(quantity > 0)
) ENGINE=InnoDB;
CREATE TABLE order_fulfillments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_item_id BIGINT UNSIGNED NOT NULL,
  license_id BIGINT UNSIGNED, serial_number VARCHAR(120), status ENUM('pending','fulfilled','returned') NOT NULL DEFAULT 'pending',
  fulfilled_at DATETIME, FOREIGN KEY(order_item_id) REFERENCES order_items(id),
  FOREIGN KEY(license_id) REFERENCES digital_licenses(id), UNIQUE(license_id)
) ENGINE=InnoDB;
CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(40) NOT NULL, provider_reference VARCHAR(150), status ENUM('pending','authorized','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  amount DECIMAL(12,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'VND',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id), INDEX(provider,provider_reference)
) ENGINE=InnoDB;
CREATE TABLE refunds (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, payment_id BIGINT UNSIGNED NOT NULL, order_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL, reason VARCHAR(500), status ENUM('requested','approved','rejected','processed') NOT NULL DEFAULT 'requested',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(payment_id) REFERENCES payments(id), FOREIGN KEY(order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE game_library (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NOT NULL, license_id BIGINT UNSIGNED,
  acquired_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, status ENUM('active','revoked') NOT NULL DEFAULT 'active',
  UNIQUE(user_id,product_id), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(order_item_id) REFERENCES order_items(id), FOREIGN KEY(license_id) REFERENCES digital_licenses(id), INDEX(user_id,acquired_at)
) ENGINE=InnoDB;
CREATE TABLE loyalty_accounts (
  user_id BIGINT UNSIGNED PRIMARY KEY, points_balance BIGINT NOT NULL DEFAULT 0,
  lifetime_spend DECIMAL(14,2) NOT NULL DEFAULT 0, tier ENUM('bronze','silver','gold') NOT NULL DEFAULT 'bronze',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, CHECK(points_balance >= 0)
) ENGINE=InnoDB;
CREATE TABLE loyalty_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED, points_delta BIGINT NOT NULL, description VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(order_id) REFERENCES orders(id), INDEX(user_id,created_at)
) ENGINE=InnoDB;
CREATE TABLE wallets (
  user_id BIGINT UNSIGNED PRIMARY KEY, balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, CHECK(balance >= 0)
) ENGINE=InnoDB;
CREATE TABLE wallet_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL, direction ENUM('credit','debit') NOT NULL, reference VARCHAR(100), description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id), INDEX(user_id,created_at)
) ENGINE=InnoDB;
CREATE TABLE gift_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, code_hash BINARY(32) NOT NULL UNIQUE,
  reward_type ENUM('points','wallet_credit','discount') NOT NULL, reward_value DECIMAL(12,2) NOT NULL,
  max_redemptions INT UNSIGNED NOT NULL, redeemed_count INT UNSIGNED NOT NULL DEFAULT 0,
  starts_at DATETIME, expires_at DATETIME, active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;
CREATE TABLE gift_redemptions (
  gift_code_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, redeemed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(gift_code_id,user_id), FOREIGN KEY(gift_code_id) REFERENCES gift_codes(id), FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL, title VARCHAR(180), body TEXT NOT NULL, verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('published','hidden','pending') NOT NULL DEFAULT 'pending', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,product_id), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(product_id) REFERENCES products(id), CHECK(rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;
CREATE TABLE review_votes (
  review_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, helpful BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY(review_id,user_id), FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE support_tickets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED, order_id BIGINT UNSIGNED,
  subject VARCHAR(180) NOT NULL, message TEXT NOT NULL, status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  priority ENUM('low','normal','high') NOT NULL DEFAULT 'normal', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(order_id) REFERENCES orders(id), INDEX(status,created_at)
) ENGINE=InnoDB;
CREATE TABLE support_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, ticket_id BIGINT UNSIGNED NOT NULL, sender_user_id BIGINT UNSIGNED,
  message TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE, FOREIGN KEY(sender_user_id) REFERENCES users(id)
) ENGINE=InnoDB;
