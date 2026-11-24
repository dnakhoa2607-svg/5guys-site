# Public web 5GUYS (Render + TiDB Cloud)

Web chạy **một link duy nhất**: backend vừa phục vụ API (`/api`) vừa phục vụ giao diện (`frontend`).

## 1. Database (TiDB Cloud, miễn phí)
1. Tạo tài khoản tại tidbcloud.com, tạo cluster **Starter/Free**.
2. Bấm **Connect**, lấy Host, Port (4000), User, Password.
3. Chạy lần lượt trong MySQL Workbench (kết nối bằng thông tin trên, bật SSL):
   `database/schema.sql` -> `database/seed.sql`
4. Tạo user chỉ có quyền thao tác dữ liệu nếu muốn; không bắt buộc cho demo.

## 2. Web (Render)
1. Đưa thư mục này lên GitHub (pull trước khi push).
2. render.com -> New -> **Web Service** -> chọn repo.
3. Root Directory: `backend` | Build: `npm install` | Start: `npm start`
4. Environment: `NODE_ENV=production`, `DB_SSL=true`, `DB_HOST`, `DB_PORT=4000`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (chuỗi >=32 ký tự).
5. Deploy xong có link `https://<ten>.onrender.com`. Gói free "ngủ" khi lâu không ai vào, hãy mở trước buổi báo cáo.

## Phương án dự phòng nhanh (chạy từ máy một bạn trong nhóm)
Chạy backend trên máy (`cd backend && npm run dev`), rồi ở cửa sổ khác: `cloudflared tunnel --url http://localhost:3000` -> nhận link `https://....trycloudflare.com` để mở cho mọi người. Máy phải bật suốt lúc báo cáo.
