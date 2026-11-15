import jwt from 'jsonwebtoken';
import env from '../config.js';
import db from '../db.js';

export function requireAuth(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'authentication_required' });
  try { req.user = jwt.verify(token, env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'invalid_or_expired_token' }); }
}

// Kiem tra vai tro tu database (khong tin role trong token,
// vi admin co the da doi vai tro cua nguoi dung sau khi ho dang nhap).
export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const [rows] = await db.execute("SELECT role FROM users WHERE id=? AND status='active'", [req.user.sub]);
      if (!rows[0] || !roles.includes(rows[0].role)) return res.status(403).json({ error: 'forbidden' });
      req.user.role = rows[0].role;
      next();
    } catch (e) { next(e); }
  };
}
