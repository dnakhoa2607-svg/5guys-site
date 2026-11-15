# 5GUYS – Website bán game (Nhóm 5Guys, 26C01)

## Cần cài
Node.js 20+, MySQL 8, VS Code + Live Server, Git

## Chạy dự án
1. Trong MySQL Workbench: chạy `database/schema.sql`, rồi `database/seed.sql`
2. Tạo user cho API:
   CREATE USER '5guys_api'@'localhost' IDENTIFIED BY '<mat-khau>';
   GRANT SELECT,INSERT,UPDATE,DELETE ON `5guys_store`.* TO '5guys_api'@'localhost';
3. Copy `backend/.env.example` thành `backend/.env`, điền DB_PASSWORD và JWT_SECRET
4. `cd backend`, `npm install`, `npm run dev` (thấy "listening on port 3000")
5. Mở `frontend/index.html` bằng Live Server (địa chỉ 127.0.0.1:5500)

## Ghi chú
- Thanh toán là mô phỏng, không thu tiền thật
- Không đưa file `.env` lên GitHub
