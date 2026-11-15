import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db.js';
import env from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const registerSchema = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(100), displayName: z.string().trim().min(1).max(100) });
const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(100) });
function tokenFor(user) { return jwt.sign({ sub: String(user.id), role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }); }

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body), hash = await bcrypt.hash(data.password, 12);
    const [result] = await db.execute('INSERT INTO users(email,password_hash,display_name) VALUES(?,?,?)', [data.email.toLowerCase(), hash, data.displayName]);
    await db.execute('INSERT INTO loyalty_accounts(user_id) VALUES(?)', [result.insertId]);
    const user = { id: result.insertId, email: data.email.toLowerCase(), displayName: data.displayName, role: 'customer' };
    res.status(201).json({ user, token: tokenFor(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const [rows] = await db.execute("SELECT id,email,password_hash,display_name,role,status FROM users WHERE email=? LIMIT 1", [data.email.toLowerCase()]);
    const user = rows[0];
    if (!user || user.status !== 'active' || !await bcrypt.compare(data.password, user.password_hash)) return res.status(401).json({ error: 'invalid_credentials' });
    await db.execute('UPDATE users SET last_login_at=UTC_TIMESTAMP() WHERE id=?', [user.id]);
    res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role }, token: tokenFor(user) });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try { const [rows] = await db.execute("SELECT id,email,display_name,role,created_at FROM users WHERE id=? AND status='active'", [req.user.sub]); if (!rows[0]) return res.status(404).json({ error: 'user_not_found' }); res.json({ user: rows[0] }); }
  catch (e) { next(e); }
});
export default router;
