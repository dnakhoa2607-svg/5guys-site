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

## Tài khoản admin mặc định
`seed.sql` tạo sẵn tài khoản quản trị (chỉ tạo nếu email chưa có):
- Email: `admin@5guys.vn`
- Mật khẩu: `Admin@12345`

Đăng nhập xong vào trang `admin.html`. Nên đổi mật khẩu trong trang Hồ sơ nếu dùng ngoài demo.

## Chức năng chính
- Cửa hàng game số và game đĩa, tìm kiếm, chi tiết game, giỏ hàng, thanh toán mô phỏng
- Đơn hàng, hoàn tiền, kho game, điểm thưởng, đánh giá, ticket hỗ trợ
- Trang quản trị (`admin.html`): doanh thu, đơn hàng, hoàn tiền, sản phẩm, tồn kho, người dùng, ticket
- **Hồ sơ cá nhân** (`profile.html`): xem và sửa tên, số điện thoại (10 số, tự định dạng `0912 345 678`), đổi mật khẩu, sổ địa chỉ giao hàng chọn Tỉnh/Phường theo địa giới mới sau sáp nhập (API [provinces.open-api.vn](https://provinces.open-api.vn) v2, cần Internet)
- **Quên mật khẩu** (link trên `login.html`): nhận mã 6 số, hiệu lực 15 phút, sai 5 lần thì hủy mã

## Ghi chú
- Thanh toán là mô phỏng, không thu tiền thật
- Quên mật khẩu chạy **chế độ demo**: không gửi email, mã hiện trên màn hình và in ra console backend. Mã lưu trong bộ nhớ server nên khởi động lại backend là mã cũ mất hiệu lực
- Menu và footer dùng chung nằm ở `frontend/assets/layout.js` (master layout): sửa menu/footer chỉ cần sửa file này
- Không đưa file `.env` lên GitHub
