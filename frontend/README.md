# 5GUYS – Website bán game (bản gộp)

Mở `index.html` trực tiếp bằng trình duyệt (cần Internet để tải Tailwind, font, icon).

## Cấu trúc
| File | Trang | Ghi chú |
|---|---|---|
| index.html | Trang chủ | gộp storefront logged-in/out |
| digital.html / physical.html | Game số / Game đĩa | gộp bản logged-in/out |
| search.html | Tìm kiếm & lọc | hỗ trợ `?q=từ-khóa` |
| cart.html | Giỏ hàng & thanh toán | đọc giỏ hàng theo tài khoản |
| orders.html | Đơn hàng | cần đăng nhập |
| loyalty.html | Khách hàng thân thiết | cần đăng nhập |
| reviews.html, support.html | Đánh giá, Chăm sóc khách hàng | |
| library.html | Kho game của tôi | **chỉ người đã đăng nhập**; khách bị chuyển sang login, link ẩn khỏi menu |
| rental.html | Thuê cấu hình Cloud | xem tự do; thuê / gia hạn / nạp ví cần đăng nhập |
| mods.html | Cộng đồng Mod theo từng game | `?game=cyberpunk|wukong|eldenring|gtav`; tải mod cần đăng nhập |
| community-games.html | Game HTML5 cộng đồng | Chơi game đã duyệt; người dùng đăng game bằng ZIP |
| login.html, register.html | Đăng nhập (2FA), Đăng ký | trang đăng nhập có popup **Quên mật khẩu** (chế độ demo, mã hiện trên màn hình) |
| profile.html | Hồ sơ cá nhân | thông tin, đổi mật khẩu, sổ địa chỉ (Tỉnh/Phường từ provinces.open-api.vn v2); cần đăng nhập |
| admin.html | Trang quản trị | chỉ admin/staff; tài khoản mặc định `admin@5guys.vn` / `Admin@12345` |
| assets/layout.js | Menu (nav) + footer dùng chung | **master layout**: sửa menu/footer ở đây cho mọi trang |
| assets/shared.js | Đăng nhập, giỏ hàng, đơn hàng dùng chung | **nơi nối back-end** |
| assets/shared.css | CSS dùng chung | |
| assets/tailwind-config.js | Cấu hình Tailwind của các trang cũ | gộp từ các trang gốc |
| assets/tailwind-config-hub.js | Cấu hình Tailwind của 3 trang mới | riêng vì trùng tên màu (outline, primary...) nhưng khác giá trị |
| assets/hub.js | Logic của 3 trang mới | chọn game, key, mod theo game, kiểm tra đăng nhập |
| assets/float-widgets.js | Nút nổi Hỗ trợ + AI cấu hình | dùng cho library/rental/mods (digital/physical có sẵn trong trang) |
| assets/community-games.js | Danh sách, iframe chơi game và form đăng ZIP | kết nối API `/community-games` |

## Cách hoạt động (demo)
- Đăng nhập (mật khẩu bất kỳ, OTP bất kỳ/nút điền sẵn) -> lưu `5guys_user` trong localStorage; navbar tự đổi giữa "Đăng nhập/Đăng ký" và menu tài khoản.
- Thêm game vào giỏ ở bất kỳ trang nào -> `5guys_cart`; huy hiệu giỏ hàng cập nhật ở mọi trang.
- Thanh toán (cần đăng nhập) -> tạo đơn trong `5guys_orders`, hiện ở trang Đơn hàng.
- Giá nội bộ tính bằng USD, hiển thị VND theo tỉ giá 25.000 (`G5.RATE`).
- Ví thuê cấu hình bắt đầu từ `0đ` trên mỗi tài khoản demo; mã quà tặng hợp lệ cộng 50.000đ và mỗi mã chỉ dùng một lần trên mỗi tài khoản.

## Backend Node.js và MySQL
Xem ../backend/README.md để chạy API và ../database/README.md để tạo schema MySQL.

## Nối với back-end sau này
Chỉ cần thay thân các hàm trong `assets/shared.js` (`login`, `getCart/setCart/add`, `getOrders/placeOrder`) bằng `fetch()` tới API. Navbar/footer đã được tách thành master layout `assets/layout.js`.

## Master layout (menu + footer)
Mỗi trang không chép lại menu và footer nữa, chỉ đặt:
```html
<script src="assets/layout.js" data-part="nav"></script>      <!-- chỗ đặt menu -->
...
<script src="assets/layout.js" data-part="footer"></script>   <!-- chỗ đặt footer -->
```
Script chèn HTML ngay tại vị trí đó khi trang đang tải, nên `shared.js` và script của từng trang (tô sáng mục menu đang xem, tên người dùng, đăng xuất, easter egg logo) vẫn chạy như trước. Thêm một mục menu: sửa `assets/layout.js` một lần là mọi trang đều có. Không áp dụng cho `login.html`, `register.html`, `admin.html` vì có giao diện riêng.

## Kho game
Game đã mua ở cửa hàng (loại digital, trong `5guys_orders`) tự xuất hiện trong Kho game. Kho game không nạp sẵn game mẫu. Danh mục bán game trên trang chủ/các trang cửa hàng vẫn có sản phẩm minh họa. Key thật chưa được cấp ở bản demo; chỉ backend mới được phép cấp key từ kho license.

## Còn là dữ liệu mẫu
Danh sách game ở các trang, trang search, đơn hàng mẫu, đánh giá, điểm thưởng đều đang viết cứng trong HTML/JS -> sẽ được thay bằng dữ liệu từ database.


## Bản sửa giao diện v1.7

- Gói thuê cấu hình không chọn sẵn gói nào; bấm chọn chỉ đánh dấu lựa chọn, không kích hoạt hay tính phí.
- Ví Cloud mặc định 0đ; ví, giỏ hàng và lịch sử đơn hàng được lưu riêng theo tài khoản trên trình duyệt.
- Kho game bắt đầu trống và chỉ hiển thị game kỹ thuật số từ đơn hàng của tài khoản hiện tại.
- Lịch sử đơn hàng/điểm thưởng không còn hiển thị dữ liệu khách hàng mẫu như thể là giao dịch thật.
- Thanh điều hướng dùng liên kết chữ “Tìm kiếm”; kích thước nút CSKH/chatbot được đồng nhất.

**Lưu ý:** Đây vẫn là bản demo tĩnh dùng `localStorage`, chưa phải backend thương mại thực tế. Tài khoản, đơn hàng, thanh toán, mã game, hoàn tiền và điểm thưởng chưa được xác minh bởi máy chủ/thanh toán thật.


## Bản tối ưu responsive v1.8

- Tất cả 14 trang HTML sử dụng chung `assets/shared.css` với bộ quy tắc responsive dùng chung.
- Navbar, danh mục cuộn ngang, biểu mẫu đăng nhập/đăng ký, bảng dữ liệu, các card, cửa sổ chatbot/hỗ trợ và modal được điều chỉnh cho màn hình hẹp.
- Hạn chế tràn ngang, cho phép nội dung dài xuống dòng và cho phép bảng rộng cuộn trong vùng riêng.
- Hỗ trợ giảm chuyển động theo tùy chọn của hệ điều hành.
- Kiểm tra tĩnh: đủ viewport meta và shared CSS trên 14 trang; không phát hiện ID HTML trùng hoặc đường dẫn tài nguyên nội bộ bị thiếu; cú pháp CSS/JavaScript đã được kiểm tra.

**Lưu ý kiểm thử responsive:** môi trường tạo bản ZIP chặn điều hướng Chromium nên chưa thực hiện được chụp màn hình tự động trên từng độ phân giải. Sau khi giải nén, nên mở thử trang ở các độ rộng 320, 360, 390, 768, 1024, 1280, 1440 và 1920 px. Các trang dùng Tailwind CDN, font và icon từ Internet nên cần kết nối mạng khi mở trực tiếp.


## Lưu ý bản demo
- Thanh toán chỉ ghi đơn thử nghiệm trong trình duyệt; không kết nối ngân hàng, không thu tiền và không phát hành key thật.
- Điểm thưởng được lưu theo tài khoản demo trong localStorage; không dùng làm sổ điểm production.
- Key bản quyền cần được cấp từ backend; giao diện kho game sẽ không tạo key giả.


## Chạy frontend với API
- Khởi động MySQL và chạy database/schema.sql, sau đó chạy seed nếu muốn catalog mẫu.
- Khởi động backend theo Backend/README.md ở cổng 3000.
- Mở frontend qua máy chủ tĩnh tại http://localhost:5500 (ví dụ VS Code Live Server). Không mở HTML bằng File:// vì trình duyệt sẽ chặn CORS.
- API mặc định là http://localhost:3000/api; có thể đặt window.G5_API_BASE trước Assets/shared.js để đổi địa chỉ.
- Đăng nhập/đăng ký API dùng backend; giỏ, đơn, thư viện và đọc điểm lấy từ API. Checkout chỉ tạo đơn chờ thanh toán. Các trang danh mục hiện vẫn còn dữ liệu mẫu trong HTML; cần API catalog để render động hoàn toàn.

## Community Games
- Mục Community Games trên menu và trang chủ mở trang `community-games.html`; 5 game trong `community-games/5guys-mini-games/` được nạp sẵn từ bộ ZIP ban đầu.
- Tải game yêu cầu phiên đăng nhập API; game tải lên chờ admin/staff duyệt rồi mới xuất hiện và chơi được. Với database đã tồn tại, chạy `database/update_v3.sql`; migration tự tạo bảng và nạp 5 game HTML5.
- ZIP cần có đúng một `index.html` và tuân theo giới hạn/loại file được ghi trong `backend/README.md`. Game được chạy trong iframe sandbox, tách khỏi quyền truy cập DOM và localStorage của trang chính.


## Catalog động và trang chi tiết
- Trang chủ, kỹ thuật số, vật lý và tìm kiếm lấy card từ GET /api/products; không còn dùng danh sách game card HTML mẫu.
- Dùng chung Frontend/detail.html?slug=<slug> cho trang thông tin từng game; API trả metadata, media link, cấu hình, phiên bản và review đã duyệt.
- Catalog mẫu gồm 10 game được khai báo ở database/seed.sql. Ảnh bìa được trỏ tới Steam CDN; trailer/ảnh bổ sung mở trang sản phẩm Steam chính thức. Giá và cấu hình máy trong seed được ghi để minh họa demo, cần xác nhận lại trước bán thật.
