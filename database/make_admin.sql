-- Nang mot tai khoan da dang ky len quyen Admin.
-- Doi email ben duoi thanh email cua ban, chay trong MySQL Workbench, roi DANG XUAT va DANG NHAP LAI tren web.
UPDATE `5guys_store`.users SET role='admin' WHERE email='email-cua-ban@example.com';
SELECT id,email,role FROM `5guys_store`.users WHERE role='admin';
