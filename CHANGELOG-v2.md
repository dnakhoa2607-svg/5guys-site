# Thay đổi bản v2

## Nâng cấp & Sửa lỗi Bảng Quản Trị (`frontend/admin.html`, `backend/src/api/admin.routes.js`, `database/*.sql`)
- **Tab "Hoàn tiền" (Sửa lỗi tràn và đè chữ):**
  - Áp dụng `max-width: 280px`, `white-space: normal`, `word-break: break-word` kết hợp giới hạn 2 dòng (`line-clamp-2`) và tooltip đầy đủ khi hover cho cột `Lý do`; tăng `padding` và cố định `whitespace-nowrap` cho các cột `Trạng thái`, `Ngày gửi`, `Thao tác` để tách biệt hoàn toàn.
- **Tab "Đơn hàng" (Điều phối giao vận, Xem Key & Sửa lệch badge):**
  - Gom các huy hiệu trạng thái đơn và trạng thái hoàn tiền vào khối dọc (`flex-col gap-1`) nằm gọn trong cột `Trạng thái`, không đè vào dòng địa chỉ giao hàng.
  - Đơn hàng `(đĩa)` (Vật lý): Bổ sung dropdown cập nhật trạng thái giao vận (`📦 Chờ lấy hàng` -> `🚚 Đang giao` -> `✅ Đã giao`) và nút `Chi tiết / In đơn` (mở phiếu điều phối hỗ trợ `window.print()`).
  - Đơn hàng `(số)` (Kỹ thuật số): Bổ sung nút `Xem chi tiết` để kiểm tra và sao chép mã Key bản quyền (`5GUYS DRM Safe`) đã cấp cho khách.
- **Tab "Tổng quan" (Biểu đồ 14 ngày & Tách doanh thu Hybrid):**
  - Biểu đồ "Doanh thu 14 ngày gần nhất" hiển thị đầy đủ trục 14 ngày liên tục (ngày không có đơn hiển thị cột mốc thấp kèm nhãn `0đ`), gắn nhãn số tiền trực tiếp trên đầu cột và tooltip chi tiết khi rê chuột.
  - Thẻ "Doanh thu (đơn đã thanh toán)" bổ sung dòng phụ chú tách bạch doanh thu từ mảng **Kỹ thuật số** và **Đĩa vật lý**.
- **Tab "Sản phẩm" (Tối ưu hóa nhập liệu Hybrid & Bộ lọc nhanh):**
  - Trong form thêm/sửa: Khi chọn `Kỹ thuật số`, tự động khóa ô `Tồn kho (đĩa)` (`∞`) và hiện ô `Cấu hình tối thiểu`; khi chọn `Vật lý (Đĩa)`, bắt buộc nhập `Tồn kho (đĩa)` và hiện ô `Trọng lượng / Phụ kiện đi kèm`.
  - Thêm bộ lọc nhanh `Tất cả` | `Bản Số` | `Bản Đĩa` kèm số lượng bên cạnh ô tìm kiếm.
- **Tab "Người dùng" (Bảo vệ tài khoản Admin & Thêm Role mới):**
  - Làm mờ và khóa (`disabled`) dropdown đổi `Vai trò` cùng nút `Khóa` ở dòng tài khoản đang đăng nhập (`Admin (bạn)`).
  - Bổ sung vai trò **`Nhà phát hành (Publisher)`** (`publisher`) vào danh sách phân quyền người dùng và schema database.
- **Tab "Hỗ trợ" (Dữ liệu Ticket mẫu & Giao diện phản hồi):**
  - Khởi tạo sẵn 2 Ticket hỗ trợ mẫu ở trạng thái `Đang mở` (1 ticket hỏi về lỗi kích hoạt Key game số, 1 ticket hỏi về đổi địa chỉ nhận đĩa PS5).
  - Cho phép bấm mở xem nội dung chi tiết, nhập câu trả lời và bấm `Phản hồi & Đóng ticket`, tự động đồng bộ số lượng với thẻ "Ticket hỗ trợ đang mở" ở tab Tổng quan.

## Cập nhật Giao diện & Trải nghiệm người dùng (UI/UX Hybrid)
- **Trang Chi tiết Sản phẩm (`frontend/assets/detail.js`, `backend/src/api/products.routes.js`):**
  - Bổ sung khối **Đặc tả bản vật lý** (Physical Specs Box: tình trạng Nguyên Seal 100%, hộp đĩa Blu-ray PS5 tiêu chuẩn kèm bìa lót & booklet, trọng lượng 180g, phương thức vận chuyển) hiển thị ngay dưới phần chọn phiên bản khi ở tab "Vật lý".
  - Thay nút điều hướng sang Steam bằng **Trình xem Trailer & Ảnh chụp màn hình (Modal Gallery)** trực tiếp trên 5GUYS (hỗ trợ phát video MP4/WebM/HLS, strip ảnh thu nhỏ, phím tắt `←`/`→`/`Esc`). Thêm API proxy `GET /api/products/:idOrSlug/gallery` có cache 6 giờ để lấy dữ liệu media mà không bị chặn CORS.
- **Trang Kho Game (`frontend/library.html`, `frontend/assets/hub.js`):**
  - **Khối ổ cứng lưu trữ:** Cho phép bấm mở dropdown chuyển đổi giữa `Ổ C: Kingston SSD (Trống 120 GB)` và `Ổ D: Samsung 990 Pro (Trống 358 GB)` (lưu vào `localStorage`), đồng thời hiển thị dung lượng cài đặt riêng của từng game đang chọn (VD: *Hollow Knight: Silksong - 12 GB*, *Black Myth: Wukong - 130 GB*).
  - **Biểu đồ Thời lượng chơi tuần này:** Gắn dữ liệu giờ chơi từ T2 đến CN và tổng số giờ riêng biệt cho từng tựa game; tự động cập nhật biểu đồ cột khi chuyển đổi giữa các game trong kho.
  - **Mã bản quyền 5GUYS DRM Safe:** Tự động sinh mã Key định dạng `5GUYS-XXXX-0000-XXXX` cố định theo tài khoản và từng game; mặc định làm mờ/che dấu sao (`*`), tích hợp nút con mắt ẩn/hiện và nút Copy vào clipboard.
- **Trang Giỏ hàng & Thanh toán (`frontend/cart.html`, `backend/src/api/store.routes.js`):**
  - Tự động kiểm tra sản phẩm mang nhãn `VẬT LÝ` để hiển thị tùy chọn **Giao tiêu chuẩn (30.000đ)** hoặc **Giao hỏa tốc (60.000đ)** trong khung Địa chỉ giao hàng.
  - Hiển thị dòng **Phí vận chuyển** trong bảng "Chi tiết chi phí" và cộng trực tiếp vào `TỔNG CỘNG` (đồng bộ công thức tính và lưu `shipping_total` phía backend). Nếu giỏ hàng chỉ có game `KỸ THUẬT SỐ`, phí vận chuyển = `0đ` và ẩn khung địa chỉ giao hàng.

## Chức năng mới
- Thanh toán mô phỏng: đơn chuyển trạng thái, game số vào Kho game, đĩa trừ tồn kho, tích điểm.
- Trang Quản trị `frontend/admin.html`: tổng quan doanh thu, quản lý đơn (giao hàng / hoàn tất / hủy), duyệt hoàn tiền, thêm/sửa/ẩn sản phẩm và tồn kho, phân quyền và khóa tài khoản, trả lời ticket hỗ trợ.
- Khách hàng: gửi yêu cầu hoàn tiền thật, viết đánh giá trên trang chi tiết game, gửi và theo dõi ticket hỗ trợ.
- Phân quyền theo vai trò (customer / staff / admin), kiểm tra trên server.

## Sửa lỗi
- Đăng ký lỗi khi bấm nút hiện mật khẩu.
- Giá trên trang Đơn hàng bị nhân 25.000 lần.
- Thêm bản đĩa vào giỏ lại thêm nhầm bản số.
- Đăng nhập xong bị mất thông tin vai trò.
- Tổng tiền giữa giỏ hàng và server không khớp (server tự tính VAT, phí, mã giảm giá).
- Game số chỉ mua 1 bản, không mua lại game đã sở hữu.
- Thông báo lỗi rõ ràng thay cho câu chung "Không kết nối được API".
- `seed.sql` bị cụt dòng cuối.
