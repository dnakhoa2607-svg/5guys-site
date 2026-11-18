USE `5guys_store`;
-- 5GUYS: them 14 tua game (kem ban dia vat ly cho 9 game). Chay an toan nhieu lan (idempotent).
-- Cach chay: mysql -u root -p 5guys_store < database/add_games.sql  (hoac dan vao MySQL Workbench)

INSERT INTO categories(name,slug) VALUES
 ('Indie','indie'),('Kinh dị','kinh-di'),('Mô phỏng','mo-phong'),('Platformer','platformer')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO products(slug,title,description,publisher,developer,release_date,platform,genre,cover_url,product_type,price,original_price,discount_percent,currency,status,rating) VALUES
('cyberpunk-2077','Cyberpunk 2077','Game nhập vai hành động thế giới mở tại Night City, nơi bạn là V - tay lính đánh thuê săn lùng con chip bất tử.','CD PROJEKT RED','CD PROJEKT RED','2020-12-10','PC','Hành động, RPG, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg','digital',1050000,1500000,30,'VND','active',4.40),
('cyberpunk-2077-physical','Cyberpunk 2077','Phiên bản đĩa vật lý, giao hàng tận nơi. Game nhập vai hành động thế giới mở tại Night City, nơi bạn là V - tay lính đánh thuê săn lùng con chip bất tử.','CD PROJEKT RED','CD PROJEKT RED','2020-12-10','PlayStation 5','Hành động, RPG, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg','physical',1450000,1450000,0,'VND','active',4.40),
('the-witcher-3-wild-hunt','The Witcher 3: Wild Hunt','Vào vai thợ săn quái vật Geralt, lên đường truy tìm đứa con nuôi trong thế giới mở rộng lớn đầy lựa chọn đạo đức.','CD PROJEKT RED','CD PROJEKT RED','2015-05-18','PC','RPG, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900.jpg','digital',450000,750000,40,'VND','active',4.90),
('the-witcher-3-wild-hunt-physical','The Witcher 3: Wild Hunt','Phiên bản đĩa vật lý, giao hàng tận nơi. Vào vai thợ săn quái vật Geralt, lên đường truy tìm đứa con nuôi trong thế giới mở rộng lớn đầy lựa chọn đạo đức.','CD PROJEKT RED','CD PROJEKT RED','2015-05-18','PlayStation 5','RPG, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900.jpg','physical',1250000,1250000,0,'VND','active',4.90),
('god-of-war','God of War','Kratos cùng con trai Atreus bước vào hành trình qua vùng đất thần thoại Bắc Âu với lối chiến đấu nặng tay, điện ảnh.','Sony Interactive Entertainment','Santa Monica Studio','2022-01-14','PC','Hành động, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/library_600x900.jpg','digital',1100000,1100000,0,'VND','active',4.80),
('god-of-war-physical','God of War','Phiên bản đĩa vật lý, giao hàng tận nơi. Kratos cùng con trai Atreus bước vào hành trình qua vùng đất thần thoại Bắc Âu với lối chiến đấu nặng tay, điện ảnh.','Sony Interactive Entertainment','Santa Monica Studio','2022-01-14','PlayStation 4','Hành động, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/library_600x900.jpg','physical',1100000,1100000,0,'VND','active',4.80),
('resident-evil-4','Resident Evil 4','Bản làm lại kinh điển: Leon S. Kennedy cứu con gái tổng thống khỏi giáo phái bí ẩn tại ngôi làng hẻo lánh.','Capcom','Capcom','2023-03-24','PC','Hành động, Kinh dị','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2050650/library_600x900.jpg','digital',1200000,1200000,0,'VND','active',4.80),
('resident-evil-4-physical','Resident Evil 4','Phiên bản đĩa vật lý, giao hàng tận nơi. Bản làm lại kinh điển: Leon S. Kennedy cứu con gái tổng thống khỏi giáo phái bí ẩn tại ngôi làng hẻo lánh.','Capcom','Capcom','2023-03-24','PlayStation 5','Hành động, Kinh dị','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2050650/library_600x900.jpg','physical',1600000,1600000,0,'VND','active',4.80),
('baldurs-gate-3','Baldur''s Gate 3','RPG nhập vai theo lượt dựa trên Dungeons & Dragons, mỗi lựa chọn đều thay đổi câu chuyện và đồng đội của bạn.','Larian Studios','Larian Studios','2023-08-03','PC','RPG, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900.jpg','digital',1400000,1400000,0,'VND','active',4.90),
('baldurs-gate-3-physical','Baldur''s Gate 3','Phiên bản đĩa vật lý, giao hàng tận nơi. RPG nhập vai theo lượt dựa trên Dungeons & Dragons, mỗi lựa chọn đều thay đổi câu chuyện và đồng đội của bạn.','Larian Studios','Larian Studios','2023-08-03','PlayStation 5','RPG, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900.jpg','physical',1700000,1700000,0,'VND','active',4.90),
('grand-theft-auto-v','Grand Theft Auto V','Ba nhân vật, một thành phố Los Santos rộng lớn: cướp ngân hàng, đua xe và tự do khám phá thế giới mở.','Rockstar Games','Rockstar North','2015-04-14','PC','Hành động, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg','digital',500000,500000,0,'VND','active',4.60),
('grand-theft-auto-v-physical','Grand Theft Auto V','Phiên bản đĩa vật lý, giao hàng tận nơi. Ba nhân vật, một thành phố Los Santos rộng lớn: cướp ngân hàng, đua xe và tự do khám phá thế giới mở.','Rockstar Games','Rockstar North','2015-04-14','PlayStation 5','Hành động, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg','physical',1100000,1100000,0,'VND','active',4.60),
('persona-5-royal','Persona 5 Royal','Học sinh trung học ban ngày, Phantom Thief ban đêm: JRPG phong cách đỉnh cao với cốt truyện và âm nhạc đáng nhớ.','SEGA','ATLUS','2022-10-21','PC','RPG, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1687950/library_600x900.jpg','digital',1300000,1300000,0,'VND','active',4.80),
('persona-5-royal-physical','Persona 5 Royal','Phiên bản đĩa vật lý, giao hàng tận nơi. Học sinh trung học ban ngày, Phantom Thief ban đêm: JRPG phong cách đỉnh cao với cốt truyện và âm nhạc đáng nhớ.','SEGA','ATLUS','2022-10-21','PlayStation 5','RPG, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1687950/library_600x900.jpg','physical',1500000,1500000,0,'VND','active',4.80),
('hogwarts-legacy','Hogwarts Legacy','Trải nghiệm thế giới phù thủy thế kỷ 19: học phép, bay chổi và khám phá lâu đài Hogwarts trong game nhập vai thế giới mở.','Warner Bros. Games','Avalanche Software','2023-02-10','PC','RPG, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/990080/library_600x900.jpg','digital',1300000,1500000,13,'VND','active',4.50),
('hogwarts-legacy-physical','Hogwarts Legacy','Phiên bản đĩa vật lý, giao hàng tận nơi. Trải nghiệm thế giới phù thủy thế kỷ 19: học phép, bay chổi và khám phá lâu đài Hogwarts trong game nhập vai thế giới mở.','Warner Bros. Games','Avalanche Software','2023-02-10','PlayStation 5','RPG, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/990080/library_600x900.jpg','physical',1550000,1550000,0,'VND','active',4.50),
('monster-hunter-world','Monster Hunter: World','Săn những con quái vật khổng lồ trong hệ sinh thái sống động, chế tạo trang bị từ chiến lợi phẩm và đi săn cùng bạn bè.','Capcom','Capcom','2018-08-09','PC','Hành động, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/582010/library_600x900.jpg','digital',450000,450000,0,'VND','active',4.60),
('monster-hunter-world-physical','Monster Hunter: World','Phiên bản đĩa vật lý, giao hàng tận nơi. Săn những con quái vật khổng lồ trong hệ sinh thái sống động, chế tạo trang bị từ chiến lợi phẩm và đi săn cùng bạn bè.','Capcom','Capcom','2018-08-09','PlayStation 4','Hành động, Phiêu lưu','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/582010/library_600x900.jpg','physical',900000,900000,0,'VND','active',4.60),
('hades','Hades','Roguelike hành động: vào vai Zagreus, con trai thần Hades, liên tục vượt ngục khỏi Địa phủ với dàn vũ khí và ân huệ của các vị thần.','Supergiant Games','Supergiant Games','2020-09-17','PC','Hành động, Indie','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/library_600x900.jpg','digital',250000,250000,0,'VND','active',4.90),
('stardew-valley','Stardew Valley','Thừa kế nông trại cũ của ông nội: trồng trọt, nuôi gia súc, câu cá, kết bạn và khám phá hang động.','ConcernedApe','ConcernedApe','2016-02-26','PC','Mô phỏng, Indie','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/library_600x900.jpg','digital',150000,150000,0,'VND','active',4.90),
('celeste','Celeste','Giúp Madeline leo lên đỉnh núi Celeste trong game platformer pixel đầy thử thách và cảm xúc.','Maddy Makes Games','Maddy Makes Games','2018-01-25','PC','Platformer, Indie','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/504230/library_600x900.jpg','digital',180000,180000,0,'VND','active',4.80),
('cuphead','Cuphead','Game bắn súng chạy-và-bắn phong cách hoạt hình thập niên 1930, nổi tiếng với những trận đánh trùm đầy thử thách.','Studio MDHR','Studio MDHR','2017-09-29','PC','Hành động, Platformer, Indie','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/268910/library_600x900.jpg','digital',250000,250000,0,'VND','active',4.70),
('terraria','Terraria','Đào, xây dựng, chiến đấu và khám phá thế giới 2D vô tận, chơi một mình hoặc cùng bạn bè.','Re-Logic','Re-Logic','2011-05-16','PC','Phiêu lưu, Mô phỏng, Indie','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/105600/library_600x900.jpg','digital',120000,120000,0,'VND','active',4.90)
ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),publisher=VALUES(publisher),developer=VALUES(developer),release_date=VALUES(release_date),platform=VALUES(platform),genre=VALUES(genre),cover_url=VALUES(cover_url),product_type=VALUES(product_type),price=VALUES(price),original_price=VALUES(original_price),discount_percent=VALUES(discount_percent),status='active',rating=VALUES(rating);

INSERT INTO physical_inventory(product_id,sku,quantity_on_hand)
SELECT id,CONCAT('G5-',UPPER(SUBSTRING(MD5(slug),1,12))),25 FROM products WHERE slug IN
 ('cyberpunk-2077-physical','the-witcher-3-wild-hunt-physical','god-of-war-physical','resident-evil-4-physical','baldurs-gate-3-physical','grand-theft-auto-v-physical','persona-5-royal-physical','hogwarts-legacy-physical','monster-hunter-world-physical')
ON DUPLICATE KEY UPDATE sku=VALUES(sku);

INSERT INTO product_categories(product_id,category_id)
SELECT p.id,c.id FROM products p JOIN categories c ON FIND_IN_SET(c.name,REPLACE(p.genre,', ',','))>0
WHERE p.slug IN ('cyberpunk-2077','cyberpunk-2077-physical','the-witcher-3-wild-hunt','the-witcher-3-wild-hunt-physical','god-of-war','god-of-war-physical','resident-evil-4','resident-evil-4-physical','baldurs-gate-3','baldurs-gate-3-physical','grand-theft-auto-v','grand-theft-auto-v-physical','persona-5-royal','persona-5-royal-physical','hogwarts-legacy','hogwarts-legacy-physical','monster-hunter-world','monster-hunter-world-physical','hades','stardew-valley','celeste','cuphead','terraria')
ON DUPLICATE KEY UPDATE category_id=VALUES(category_id);

INSERT INTO product_images(product_id,image_url,alt_text,sort_order)
SELECT id,cover_url,CONCAT(title,' cover art'),0 FROM products WHERE slug IN ('cyberpunk-2077','cyberpunk-2077-physical','the-witcher-3-wild-hunt','the-witcher-3-wild-hunt-physical','god-of-war','god-of-war-physical','resident-evil-4','resident-evil-4-physical','baldurs-gate-3','baldurs-gate-3-physical','grand-theft-auto-v','grand-theft-auto-v-physical','persona-5-royal','persona-5-royal-physical','hogwarts-legacy','hogwarts-legacy-physical','monster-hunter-world','monster-hunter-world-physical','hades','stardew-valley','celeste','cuphead','terraria')
ON DUPLICATE KEY UPDATE image_url=VALUES(image_url);

INSERT INTO game_media(product_id,media_type,media_url,caption,sort_order)
SELECT id,'trailer',CONCAT('https://store.steampowered.com/app/',CASE slug
 WHEN 'cyberpunk-2077' THEN '1091500'
 WHEN 'cyberpunk-2077-physical' THEN '1091500'
 WHEN 'the-witcher-3-wild-hunt' THEN '292030'
 WHEN 'the-witcher-3-wild-hunt-physical' THEN '292030'
 WHEN 'god-of-war' THEN '1593500'
 WHEN 'god-of-war-physical' THEN '1593500'
 WHEN 'resident-evil-4' THEN '2050650'
 WHEN 'resident-evil-4-physical' THEN '2050650'
 WHEN 'baldurs-gate-3' THEN '1086940'
 WHEN 'baldurs-gate-3-physical' THEN '1086940'
 WHEN 'grand-theft-auto-v' THEN '271590'
 WHEN 'grand-theft-auto-v-physical' THEN '271590'
 WHEN 'persona-5-royal' THEN '1687950'
 WHEN 'persona-5-royal-physical' THEN '1687950'
 WHEN 'hogwarts-legacy' THEN '990080'
 WHEN 'hogwarts-legacy-physical' THEN '990080'
 WHEN 'monster-hunter-world' THEN '582010'
 WHEN 'monster-hunter-world-physical' THEN '582010'
 WHEN 'hades' THEN '1145360'
 WHEN 'stardew-valley' THEN '413150'
 WHEN 'celeste' THEN '504230'
 WHEN 'cuphead' THEN '268910'
 WHEN 'terraria' THEN '105600'
 END,'/'),'Xem trailer và ảnh chụp chính thức trên Steam',0 FROM products WHERE slug IN ('cyberpunk-2077','cyberpunk-2077-physical','the-witcher-3-wild-hunt','the-witcher-3-wild-hunt-physical','god-of-war','god-of-war-physical','resident-evil-4','resident-evil-4-physical','baldurs-gate-3','baldurs-gate-3-physical','grand-theft-auto-v','grand-theft-auto-v-physical','persona-5-royal','persona-5-royal-physical','hogwarts-legacy','hogwarts-legacy-physical','monster-hunter-world','monster-hunter-world-physical','hades','stardew-valley','celeste','cuphead','terraria')
AND NOT EXISTS (SELECT 1 FROM game_media gm WHERE gm.product_id=products.id AND gm.media_type='trailer');

INSERT INTO game_requirements(product_id,minimum_requirements,recommended_requirements)
SELECT id,JSON_OBJECT('os','Windows 10 64-bit','processor','Intel Core i5 tương đương','memory','8 GB RAM','graphics','Card đồ họa tương thích DirectX 11','storage','20 GB dung lượng trống'),
JSON_OBJECT('os','Windows 10/11 64-bit','processor','Intel Core i7 tương đương','memory','16 GB RAM','graphics','Card đồ họa rời tương đương GTX 1060','storage','50 GB dung lượng trống')
FROM products WHERE slug IN ('cyberpunk-2077','cyberpunk-2077-physical','the-witcher-3-wild-hunt','the-witcher-3-wild-hunt-physical','god-of-war','god-of-war-physical','resident-evil-4','resident-evil-4-physical','baldurs-gate-3','baldurs-gate-3-physical','grand-theft-auto-v','grand-theft-auto-v-physical','persona-5-royal','persona-5-royal-physical','hogwarts-legacy','hogwarts-legacy-physical','monster-hunter-world','monster-hunter-world-physical','hades','stardew-valley','celeste','cuphead','terraria')
ON DUPLICATE KEY UPDATE minimum_requirements=VALUES(minimum_requirements),recommended_requirements=VALUES(recommended_requirements);

INSERT INTO product_editions(product_id,edition_name,edition_description,price,original_price,product_type)
SELECT id,'Standard','Phiên bản tiêu chuẩn',price,original_price,product_type FROM products WHERE slug IN ('cyberpunk-2077','cyberpunk-2077-physical','the-witcher-3-wild-hunt','the-witcher-3-wild-hunt-physical','god-of-war','god-of-war-physical','resident-evil-4','resident-evil-4-physical','baldurs-gate-3','baldurs-gate-3-physical','grand-theft-auto-v','grand-theft-auto-v-physical','persona-5-royal','persona-5-royal-physical','hogwarts-legacy','hogwarts-legacy-physical','monster-hunter-world','monster-hunter-world-physical','hades','stardew-valley','celeste','cuphead','terraria')
ON DUPLICATE KEY UPDATE price=VALUES(price),original_price=VALUES(original_price);
