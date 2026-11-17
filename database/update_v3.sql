USE `5guys_store`;

CREATE TABLE IF NOT EXISTS community_games (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(1200) NOT NULL DEFAULT '',
  source ENUM('bundled','uploaded') NOT NULL,
  storage_key CHAR(36) UNIQUE,
  entry_file VARCHAR(500) NOT NULL,
  uploader_user_id BIGINT UNSIGNED,
  status ENUM('pending','published','rejected','removed') NOT NULL DEFAULT 'pending',
  review_note VARCHAR(500),
  reviewed_by BIGINT UNSIGNED,
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(uploader_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX(status,created_at), INDEX(uploader_user_id,status),
  CHECK((source='bundled' AND storage_key IS NULL) OR (source='uploaded' AND storage_key IS NOT NULL))
) ENGINE=InnoDB;

INSERT IGNORE INTO community_games(slug,title,description,source,entry_file,status) VALUES
  ('rut-dao-dung-luc','Rút Dao Đúng Lúc','Game phản xạ 5–10 giây mỗi ván.','bundled','community-games/5guys-mini-games/games/duel.html','published'),
  ('bam-nut-do','Bấm Nút Đỏ','Game troll tương tác, hoàn thành trong khoảng 2–3 phút.','bundled','community-games/5guys-mini-games/games/dont-press.html','published'),
  ('cat-day-bom','Cắt Dây Bom','Game giải đố logic, khoảng 5 giây mỗi màn.','bundled','community-games/5guys-mini-games/games/snip.html','published'),
  ('do-xe-bao-tap','Đỗ Xe Bão Táp','Game căn thời gian một nút bấm, khoảng 3 giây mỗi màn.','bundled','community-games/5guys-mini-games/games/park.html','published'),
  ('nem-giay-vao-sot','Ném Giấy Vào Sọt','Game vật lý căn hướng gió, chơi dưới một phút.','bundled','community-games/5guys-mini-games/games/wind-toss.html','published');
