# MySQL database

Database MySQL 8.0+ cho 5GUYS. Chạy theo thứ tự:

```sh
mysql -u root -p < database/schema.sql
mysql -u root -p 5guys_store < database/seed.sql
```

`schema.sql` tạo database `5guys_store`, bảng người dùng, sản phẩm, tồn kho vật lý, license kỹ thuật số, giỏ hàng, đơn hàng, thư viện, giao dịch thanh toán, hoàn tiền, điểm/ví, đánh giá, yêu cầu hỗ trợ và game cộng đồng. `seed.sql` chứa dữ liệu catalog minh họa, tài khoản quản trị demo và 5 mini-game HTML5 ban đầu; không có key bản quyền thật.

Với database đã cài từ phiên bản trước, chạy `mysql -u root -p 5guys_store < database/update_v3.sql` để tạo bảng và nạp 5 game HTML5 ban đầu. Chỉ chạy lại `seed.sql` nếu muốn cập nhật toàn bộ dữ liệu catalog demo.

Các giá trị tiền lưu bằng `DECIMAL`, thời gian lưu UTC, mật khẩu chỉ lưu dưới dạng bcrypt hash. Không cấp quyền ghi database cho tài khoản công khai; backend nên dùng tài khoản MySQL riêng với quyền tối thiểu.
