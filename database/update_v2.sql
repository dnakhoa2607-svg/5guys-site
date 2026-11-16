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
