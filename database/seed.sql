USE `5guys_store`;

-- Tai khoan admin mac dinh: admin@5guys.vn / Admin@12345
INSERT IGNORE INTO users(email,password_hash,display_name,role) VALUES
 ('admin@5guys.vn','$2a$12$pUuj40AP3ieK5j.HeHi6sOKN7Q4VDkEiQDcov7E5mUJ2TS8jETnNy','Admin','admin');

INSERT INTO categories(name,slug) VALUES
 ('Hành động','hanh-dong'),('Phiêu lưu','phieu-luu'),('Metroidvania','metroidvania'),
 ('Souls-like','soulslike'),('RPG','rpg'),('Thế giới mở','the-gioi-mo')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Retire the old fictional storefront examples from earlier demo versions.
UPDATE products SET status='inactive' WHERE slug IN
 ('vuong-quoc-phep-thuat','biet-doi-hu-khong','neon-drift','nong-trai-pixel','hanh-trinh-vo-tan','thuoc-dia-sao','dua-xe-huyen-thoai','hang-toi');

INSERT INTO products(slug,title,description,publisher,developer,release_date,platform,genre,cover_url,product_type,price,original_price,discount_percent,currency,status,rating) VALUES
('hollow-knight','Hollow Knight','Một cuộc phiêu lưu hành động 2D vẽ tay trong vương quốc Hallownest đổ nát. Khám phá hang động, chiến đấu với sinh vật kỳ lạ và mở khóa năng lực mới.','Team Cherry','Team Cherry','2017-02-24','PC','Metroidvania','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900.jpg','digital',375000,375000,0,'VND','active',4.90),
('hollow-knight-silksong','Hollow Knight: Silksong','Hornet chiến đấu và khám phá vương quốc Pharloom xa lạ trong phần tiếp theo của Hollow Knight.','Team Cherry','Team Cherry','2025-09-04','PC','Hành động, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1030300/library_600x900.jpg','digital',500000,500000,0,'VND','active',4.70),
('elden-ring','Elden Ring','Khám phá Lands Between trong một game nhập vai hành động thế giới mở, với chiến đấu thử thách và nhiều hướng phát triển nhân vật.','Bandai Namco Entertainment','FromSoftware','2022-02-25','PC','Souls-like, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900.jpg','digital',1500000,1500000,0,'VND','active',4.80),
('sekiro-shadows-die-twice','Sekiro: Shadows Die Twice','Vào vai shinobi một tay trong hành trình giải cứu chủ nhân và trả thù. Làm chủ nhịp đỡ đòn, lén lút và công cụ cánh tay giả.','Activision','FromSoftware','2019-03-22','PC','Hành động','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/814380/library_600x900.jpg','digital',1300000,1300000,0,'VND','active',4.80),
('dark-souls-remastered','Dark Souls Remastered','Trở lại Lordran trong phiên bản làm lại của game nhập vai hành động đã khởi đầu series Dark Souls, bao gồm Artorias of the Abyss.','Bandai Namco Entertainment','QLOC, FromSoftware','2018-05-23','PlayStation 4','Souls-like, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570940/library_600x900.jpg','physical',1000000,1000000,0,'VND','active',4.50),
('dark-souls-ii-scholar-of-the-first-sin','Dark Souls II: Scholar of the First Sin','Phiên bản mở rộng của Dark Souls II với nội dung và thử thách được sắp xếp lại, bao gồm các gói nội dung bổ sung.','Bandai Namco Entertainment','FromSoftware','2015-04-01','PlayStation 4','Souls-like, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/335300/library_600x900.jpg','physical',900000,900000,0,'VND','active',4.30),
('dark-souls-iii','Dark Souls III','Ngọn lửa đang lụi tàn. Đối đầu những kẻ thù đáng sợ trong chương cuối của series nhập vai hành động Dark Souls.','Bandai Namco Entertainment','FromSoftware','2016-04-12','PlayStation 4','Souls-like, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/374320/library_600x900.jpg','physical',1200000,1200000,0,'VND','active',4.70),
('black-myth-wukong','Black Myth: Wukong','Game nhập vai hành động lấy cảm hứng từ Tây Du Ký. Trong vai Thiên Mệnh Nhân, đối đầu yêu quái và khám phá những bí mật của truyền thuyết.','Game Science','Game Science','2024-08-20','PC','Hành động, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2358720/library_600x900.jpg','digital',1500000,1500000,0,'VND','active',4.80),
('red-dead-redemption','Red Dead Redemption','Bản đĩa console của câu chuyện miền Viễn Tây của John Marston.','Rockstar Games','Rockstar San Diego','2024-10-29','PlayStation 4 / Nintendo Switch','Hành động, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2668510/library_600x900.jpg','physical',1200000,1200000,0,'VND','active',4.40),
('red-dead-redemption-ii','Red Dead Redemption 2','Bản đĩa console theo chân Arthur Morgan và băng Van der Linde.','Rockstar Games','Rockstar Studios','2019-12-05','PlayStation 4 / Xbox One','Hành động, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg','physical',1500000,1500000,0,'VND','active',4.80),
('hollow-knight-physical','Hollow Knight','Phiên bản đĩa vật lý dành cho console, gồm game và nội dung bổ sung.','Team Cherry','Team Cherry','2017-02-24','PlayStation 5 / Nintendo Switch 2','Metroidvania','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900.jpg','physical',950000,950000,0,'VND','active',4.90),
('hollow-knight-silksong-physical','Hollow Knight: Silksong','Phiên bản vật lý cho console; tình trạng và ngày giao hàng thực tế cần xác nhận với nhà phân phối.','Team Cherry','Team Cherry','2025-09-04','PlayStation 5 / Switch 2 / Xbox Series X','Hành động, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1030300/library_600x900.jpg','physical',1100000,1100000,0,'VND','active',4.70),
('elden-ring-physical','Elden Ring','Phiên bản đĩa console tiêu chuẩn.','Bandai Namco Entertainment','FromSoftware','2022-02-25','PlayStation 5 / Xbox Series X','Souls-like, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900.jpg','physical',1750000,1750000,0,'VND','active',4.80),
('sekiro-shadows-die-twice-physical','Sekiro: Shadows Die Twice','Phiên bản đĩa console tiêu chuẩn.','Activision','FromSoftware','2019-03-22','PlayStation 4 / Xbox One','Hành động','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/814380/library_600x900.jpg','physical',1450000,1450000,0,'VND','active',4.80),
('black-myth-wukong-physical','Black Myth: Wukong','Phiên bản đĩa vật lý PlayStation 5.','Game Science, PM Studios','Game Science','2024-08-20','PlayStation 5','Hành động, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2358720/library_600x900.jpg','physical',1750000,1750000,0,'VND','active',4.80),
('dark-souls-remastered-digital','Dark Souls Remastered','Phiên bản kỹ thuật số PC của game nhập vai hành động lấy bối cảnh Lordran.','Bandai Namco Entertainment','QLOC, FromSoftware','2018-05-23','PC','Souls-like, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570940/library_600x900.jpg','digital',1000000,1000000,0,'VND','active',4.50),
('dark-souls-ii-scholar-of-the-first-sin-digital','Dark Souls II: Scholar of the First Sin','Phiên bản kỹ thuật số PC, bao gồm các nội dung bổ sung.','Bandai Namco Entertainment','FromSoftware','2015-04-01','PC','Souls-like, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/335300/library_600x900.jpg','digital',900000,900000,0,'VND','active',4.30),
('dark-souls-iii-digital','Dark Souls III','Phiên bản kỹ thuật số PC của chương cuối trong bộ ba Dark Souls.','Bandai Namco Entertainment','FromSoftware','2016-04-12','PC','Souls-like, RPG','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/374320/library_600x900.jpg','digital',1200000,1200000,0,'VND','active',4.70),
('red-dead-redemption-digital','Red Dead Redemption','Phiên bản kỹ thuật số PC của câu chuyện miền Viễn Tây của John Marston.','Rockstar Games','Rockstar San Diego','2024-10-29','PC','Hành động, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2668510/library_600x900.jpg','digital',1200000,1200000,0,'VND','active',4.40),
('red-dead-redemption-ii-digital','Red Dead Redemption 2','Phiên bản kỹ thuật số PC của câu chuyện Arthur Morgan và băng Van der Linde.','Rockstar Games','Rockstar Studios','2019-12-05','PC','Hành động, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg','digital',1500000,1500000,0,'VND','active',4.80)
ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),publisher=VALUES(publisher),developer=VALUES(developer),release_date=VALUES(release_date),platform=VALUES(platform),genre=VALUES(genre),cover_url=VALUES(cover_url),product_type=VALUES(product_type),price=VALUES(price),original_price=VALUES(original_price),discount_percent=VALUES(discount_percent),status='active',rating=VALUES(rating);

INSERT INTO physical_inventory(product_id,sku,quantity_on_hand)
SELECT id,CONCAT('G5-',UPPER(SUBSTRING(MD5(slug),1,12))),25 FROM products WHERE slug IN
 ('dark-souls-remastered','dark-souls-ii-scholar-of-the-first-sin','dark-souls-iii','red-dead-redemption','red-dead-redemption-ii','hollow-knight-physical','hollow-knight-silksong-physical','elden-ring-physical','sekiro-shadows-die-twice-physical','black-myth-wukong-physical')
ON DUPLICATE KEY UPDATE sku=VALUES(sku);

INSERT INTO product_categories(product_id,category_id)
SELECT p.id,c.id FROM products p JOIN categories c ON FIND_IN_SET(c.name,REPLACE(p.genre,', ',',') )>0
ON DUPLICATE KEY UPDATE category_id=VALUES(category_id);

INSERT INTO product_images(product_id,image_url,alt_text,sort_order)
SELECT id,cover_url,CONCAT(title,' cover art'),0 FROM products WHERE slug IN
 ('hollow-knight','hollow-knight-silksong','elden-ring','sekiro-shadows-die-twice','dark-souls-remastered','dark-souls-ii-scholar-of-the-first-sin','dark-souls-iii','black-myth-wukong','red-dead-redemption','red-dead-redemption-ii','hollow-knight-physical','hollow-knight-silksong-physical','elden-ring-physical','sekiro-shadows-die-twice-physical','black-myth-wukong-physical','dark-souls-remastered-digital','dark-souls-ii-scholar-of-the-first-sin-digital','dark-souls-iii-digital','red-dead-redemption-digital','red-dead-redemption-ii-digital')
ON DUPLICATE KEY UPDATE image_url=VALUES(image_url);

INSERT INTO game_media(product_id,media_type,media_url,caption,sort_order)
SELECT id,'trailer',CONCAT('https://store.steampowered.com/app/',CASE title
 WHEN 'Hollow Knight' THEN '367520' WHEN 'Hollow Knight: Silksong' THEN '1030300' WHEN 'Elden Ring' THEN '1245620'
 WHEN 'Sekiro: Shadows Die Twice' THEN '814380' WHEN 'Dark Souls Remastered' THEN '570940'
 WHEN 'Dark Souls II: Scholar of the First Sin' THEN '335300' WHEN 'Dark Souls III' THEN '374320'
 WHEN 'Black Myth: Wukong' THEN '2358720' WHEN 'Red Dead Redemption' THEN '2668510' ELSE '1174180' END,'/'),
 'Xem trailer và ảnh chụp chính thức trên Steam',0 FROM products WHERE slug IN
 ('hollow-knight','hollow-knight-silksong','elden-ring','sekiro-shadows-die-twice','dark-souls-remastered','dark-souls-ii-scholar-of-the-first-sin','dark-souls-iii','black-myth-wukong','red-dead-redemption','red-dead-redemption-ii','hollow-knight-physical','hollow-knight-silksong-physical','elden-ring-physical','sekiro-shadows-die-twice-physical','black-myth-wukong-physical','dark-souls-remastered-digital','dark-souls-ii-scholar-of-the-first-sin-digital','dark-souls-iii-digital','red-dead-redemption-digital','red-dead-redemption-ii-digital')
AND NOT EXISTS (SELECT 1 FROM game_media gm WHERE gm.product_id=products.id AND gm.media_type='trailer');

INSERT INTO game_requirements(product_id,minimum_requirements,recommended_requirements)
SELECT id,JSON_OBJECT('os','Windows 10 64-bit','processor','Intel Core i5 tương đương','memory','8 GB RAM','graphics','Card đồ họa tương thích DirectX 11','storage','20 GB dung lượng trống'),
JSON_OBJECT('os','Windows 10/11 64-bit','processor','Intel Core i7 tương đương','memory','16 GB RAM','graphics','Card đồ họa rời tương đương GTX 1060','storage','50 GB dung lượng trống')
FROM products WHERE slug IN ('hollow-knight','hollow-knight-silksong','elden-ring','sekiro-shadows-die-twice','dark-souls-remastered','dark-souls-ii-scholar-of-the-first-sin','dark-souls-iii','black-myth-wukong','red-dead-redemption','red-dead-redemption-ii','hollow-knight-physical','hollow-knight-silksong-physical','elden-ring-physical','sekiro-shadows-die-twice-physical','black-myth-wukong-physical','dark-souls-remastered-digital','dark-souls-ii-scholar-of-the-first-sin-digital','dark-souls-iii-digital','red-dead-redemption-digital','red-dead-redemption-ii-digital')
ON DUPLICATE KEY UPDATE minimum_requirements=VALUES(minimum_requirements),recommended_requirements=VALUES(recommended_requirements);

INSERT INTO product_editions(product_id,edition_name,edition_description,price,original_price,product_type)
SELECT id,'Standard','Phiên bản tiêu chuẩn',price,original_price,product_type
FROM products WHERE status='active'
ON DUPLICATE KEY UPDATE price=VALUES(price),original_price=VALUES(original_price);

-- 2 Ticket ho tro mau cho trang Quan tri (chi tao neu bang support_tickets dang trong)
INSERT INTO support_tickets(user_id, subject, message, status, priority)
SELECT (SELECT id FROM users ORDER BY role='customer' DESC, id ASC LIMIT 1),
       'Lỗi kích hoạt Key game số Hollow Knight: Silksong',
       'Chào shop 5GUYS, mình vừa mua bản kỹ thuật số Hollow Knight: Silksong nhưng khi nhập mã Key 5GUYS-SILK-8829-X9A1 vào hệ thống DRM Safe thì báo lỗi chưa đồng bộ máy chủ. Nhờ Admin kiểm tra và kích hoạt lại Key giúp mình nhé!',
       'open', 'high'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM support_tickets);

INSERT INTO support_tickets(user_id, subject, message, status, priority)
SELECT (SELECT id FROM users ORDER BY role='customer' DESC, id ASC LIMIT 1),
       'Hỗ trợ đổi địa chỉ nhận đĩa PS5 Black Myth: Wukong',
       'Shop ơi, mình có đặt mua đĩa vật lý Black Myth: Wukong (bản Blu-ray PS5 nguyên seal). Do tuần này mình chuyển chỗ làm nên muốn đổi địa chỉ nhận hàng sang Số 45 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM. Nhờ shop cập nhật giúp trước khi giao cho đơn vị vận chuyển ạ!',
       'open', 'normal'
FROM DUAL WHERE (SELECT COUNT(*) FROM support_tickets) < 2;
