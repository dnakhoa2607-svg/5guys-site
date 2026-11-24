USE `5guys_store`;

-- Tai khoan admin mac dinh: admin@5guys.com (va admin@5guys.vn) / Admin@12345
INSERT IGNORE INTO users(email,password_hash,display_name,role) VALUES
 ('admin@5guys.com','$2a$12$pUuj40AP3ieK5j.HeHi6sOKN7Q4VDkEiQDcov7E5mUJ2TS8jETnNy','Admin','admin'),
 ('admin@5guys.vn','$2a$12$pUuj40AP3ieK5j.HeHi6sOKN7Q4VDkEiQDcov7E5mUJ2TS8jETnNy','Admin','admin');

INSERT INTO categories(name,slug) VALUES
('Hành động','hanh-dong'),('Phiêu lưu','phieu-luu'),('Metroidvania','metroidvania'),
('Souls-like','soulslike'),('RPG','rpg'),('Thế giới mở','the-gioi-mo'),
('Indie','indie'),('Kinh dị','kinh-di'),('Mô phỏng','mo-phong'),('Platformer','platformer')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Retire the old fictional storefront examples from earlier demo versions.
UPDATE products SET status='inactive' WHERE slug IN
('vuong-quoc-phep-thuat','biet-doi-hu-khong','neon-drift','nong-trai-pixel','hanh-trinh-vo-tan','thuoc-dia-sao','dua-xe-huyen-thoai','hang-toi');

INSERT INTO products(slug,title,description,publisher,developer,release_date,platform,genre,cover_url,product_type,price,original_price,discount_percent,currency,status,rating) VALUES
('hollow-knight','Hollow Knight','Platformer','Platformer','Platformer','2017-02-24','PC','Platformer',NULL,'digital',100000,100000,0,'VND','active',4.90),
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
('red-dead-redemption-ii-digital','Red Dead Redemption 2','Phiên bản kỹ thuật số PC của câu chuyện Arthur Morgan và băng Van der Linde.','Rockstar Games','Rockstar Studios','2019-12-05','PC','Hành động, Thế giới mở','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg','digital',1500000,1500000,0,'VND','active',4.80),
('neon-viper','Neon VIper','Game neon viper','Neon Viper','Neon Viper','2024-10-29','PC','Snake',NULL,'digital',100000,100000,0,'VND','active',4.40),
('black-myth','Platformer','Game platformer','Platformer','Platformer','2024-10-29','PC','Platformer',NULL,'digital',100000,100000,0,'VND','active',4.40),
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
SELECT id,CONCAT('G5-',UPPER(SUBSTRING(MD5(slug),1,12))),25 FROM products
WHERE product_type='physical' AND status='active'
ON DUPLICATE KEY UPDATE sku=VALUES(sku);

INSERT INTO product_categories(product_id,category_id)
SELECT p.id,c.id FROM products p JOIN categories c ON FIND_IN_SET(c.name,REPLACE(p.genre,', ',',') )>0
ON DUPLICATE KEY UPDATE category_id=VALUES(category_id);

INSERT INTO product_images(product_id,image_url,alt_text,sort_order)
SELECT id,cover_url,CONCAT(title,' cover art'),0 FROM products
WHERE status='active' AND cover_url IS NOT NULL
ON DUPLICATE KEY UPDATE image_url=VALUES(image_url);

INSERT INTO game_media(product_id,media_type,media_url,caption,sort_order)
SELECT id,'trailer',CONCAT('https://store.steampowered.com/app/',CASE title
 WHEN 'Hollow Knight' THEN '367520'
 WHEN 'Hollow Knight: Silksong' THEN '1030300'
 WHEN 'Elden Ring' THEN '1245620'
 WHEN 'Sekiro: Shadows Die Twice' THEN '814380'
 WHEN 'Dark Souls Remastered' THEN '570940'
 WHEN 'Dark Souls II: Scholar of the First Sin' THEN '335300'
 WHEN 'Dark Souls III' THEN '374320'
 WHEN 'Black Myth: Wukong' THEN '2358720'
 WHEN 'Red Dead Redemption' THEN '2668510'
 WHEN 'Red Dead Redemption 2' THEN '1174180'
 WHEN 'Cyberpunk 2077' THEN '1091500'
 WHEN 'The Witcher 3: Wild Hunt' THEN '292030'
 WHEN 'God of War' THEN '1593500'
 WHEN 'Resident Evil 4' THEN '2050650'
 WHEN 'Baldur''s Gate 3' THEN '1086940'
 WHEN 'Grand Theft Auto V' THEN '271590'
 WHEN 'Persona 5 Royal' THEN '1687950'
 WHEN 'Hogwarts Legacy' THEN '990080'
 WHEN 'Monster Hunter: World' THEN '582010'
 WHEN 'Hades' THEN '1145360'
 WHEN 'Stardew Valley' THEN '413150'
 WHEN 'Celeste' THEN '504230'
 WHEN 'Cuphead' THEN '268910'
 WHEN 'Terraria' THEN '105600'
 END,'/'),
'Xem trailer và ảnh chụp chính thức trên Steam',0 FROM products
WHERE status='active' AND title IN (
 'Hollow Knight','Hollow Knight: Silksong','Elden Ring','Sekiro: Shadows Die Twice',
 'Dark Souls Remastered','Dark Souls II: Scholar of the First Sin','Dark Souls III',
 'Black Myth: Wukong','Red Dead Redemption','Red Dead Redemption 2',
 'Cyberpunk 2077','The Witcher 3: Wild Hunt','God of War','Resident Evil 4',
 'Baldur''s Gate 3','Grand Theft Auto V','Persona 5 Royal','Hogwarts Legacy',
 'Monster Hunter: World','Hades','Stardew Valley','Celeste','Cuphead','Terraria'
)
AND NOT EXISTS (SELECT 1 FROM game_media gm WHERE gm.product_id=products.id AND gm.media_type='trailer');

INSERT INTO game_requirements(product_id,minimum_requirements,recommended_requirements)
SELECT id,JSON_OBJECT('os','Windows 10 64-bit','processor','Intel Core i5 tương đương','memory','8 GB RAM','graphics','Card đồ họa tương thích DirectX 11','storage','20 GB dung lượng trống'),
JSON_OBJECT('os','Windows 10/11 64-bit','processor','Intel Core i7 tương đương','memory','16 GB RAM','graphics','Card đồ họa rời tương đương GTX 1060','storage','50 GB dung lượng trống')
FROM products WHERE status='active'
ON DUPLICATE KEY UPDATE minimum_requirements=VALUES(minimum_requirements),recommended_requirements=VALUES(recommended_requirements);

INSERT INTO product_editions(product_id,edition_name,edition_description,price,original_price,product_type)
SELECT id,'Standard','Phiên bản tiêu chuẩn',price,original_price,product_type
FROM products WHERE status='active'
ON DUPLICATE KEY UPDATE price=VALUES(price),original_price=VALUES(original_price);
