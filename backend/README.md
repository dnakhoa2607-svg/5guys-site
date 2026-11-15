# 5GUYS Node.js API

Node.js 20+, Express, MySQL 8.0+. API source is isolated in `src/api`; business logic is in `src/services`.

## Start locally

1. Create the database: `mysql -u root -p < database/schema.sql`; optional demo catalog: `mysql -u root -p 5guys_store < database/seed.sql`.
   To load the latest demo catalog or format variants into an existing database, run the seed command again; existing physical stock counts are preserved.
2. Create a restricted MySQL user for the API and grant it access only to `5guys_store`.
3. Copy `.env.example` to `.env`, set database credentials and a random JWT secret of at least 32 characters.
4. Run `npm install`, then `npm run dev` from `backend`.
5. API health: `GET http://localhost:3000/api/health`.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/products/:idOrSlug` also returns sibling digital/physical formats for the same game when both are sold.
- `GET /api/products`, `GET /api/products/:idOrSlug` (includes detail sections: media, requirements, editions, approved reviews)
- Auth required: `GET /api/cart`, `PUT /api/cart/items`, `DELETE /api/cart/items/:productId`
- Auth required: `POST /api/orders` (creates pending order in an InnoDB transaction; no payment is taken), `GET /api/orders`, `GET /api/orders/:id`
- Auth required: `GET /api/library`, `GET /api/loyalty`

All customer queries are scoped to the authenticated user. Passwords use bcrypt; tokens are signed JWTs; SQL is parameterized; public routes have rate limits. Checkout intentionally creates a pending-payment order. A real payment provider, webhook signature verification, physical shipping workflow, mail verification, password reset, admin authorization, and encryption-key management for digital license delivery need separate production setup. Never put real licenses or production secrets in seed data or Git.

## Cập nhật v2 (Admin, thanh toán mô phỏng, hoàn tiền, đánh giá, hỗ trợ)

- `POST /api/orders` nhận `{ paymentMethod, couponCode }`; server tự tính giảm giá, VAT 10%, phí thanh toán và tổng tiền.
- `POST /api/orders/:id/pay` thanh toán mô phỏng (chỉ khi `NODE_ENV=development`): game số vào thư viện, đĩa trừ tồn kho, cộng điểm.
- `POST /api/orders/:id/refund` khách gửi yêu cầu hoàn tiền.
- `POST /api/products/:id/reviews` viết đánh giá (đánh dấu "đã mua" nếu có đơn đã thanh toán).
- `POST|GET /api/support/tickets` gửi và xem ticket hỗ trợ.
- `/api/admin/*` (vai trò admin/staff, kiểm tra trong database): `stats`, `orders`, `orders/:id/status`, `refunds`, `refunds/:id`, `products`, `users`, `tickets`.
- Database cũ cần chạy `database/update_v2.sql` một lần. Nâng quyền admin bằng `database/make_admin.sql`.
