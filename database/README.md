# MySQL database

Database MySQL 8.0+ cho 5GUYS. Chạy theo thứ tự:

```sh
mysql -u root -p < database/schema.sql
mysql -u root -p 5guys_store < database/seed.sql
```

`schema.sql` tạo database `5guys_store`, bảng người dùng, sản phẩm, tồn kho vật lý, license kỹ thuật số, giỏ hàng, đơn hàng, thư viện, giao dịch thanh toán, hoàn tiền, điểm/ví, đánh giá và yêu cầu hỗ trợ. `seed.sql` chỉ chứa dữ liệu catalog minh họa; không có tài khoản hay key bản quyền thật.

Các giá trị tiền lưu bằng `DECIMAL`, thời gian lưu UTC, mật khẩu chỉ lưu dưới dạng bcrypt hash. Không cấp quyền ghi database cho tài khoản công khai; backend nên dùng tài khoản MySQL riêng với quyền tối thiểu.
