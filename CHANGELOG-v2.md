# Thay đổi bản v2

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
