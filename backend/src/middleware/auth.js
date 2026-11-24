import jwt from 'jsonwebtoken';
import env from '../config.js';
import db from '../db.js';

export async function requireAuth(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'authentication_required' });
  let payload;
  try { payload = jwt.verify(token, env.JWT_SECRET); }
  catch { return res.status(401).json({ error: 'invalid_or_expired_token' }); }
  try {
    const [rows] = await db.execute('SELECT role, status FROM users WHERE id=? LIMIT 1', [payload.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'invalid_or_expired_token' });
    if (rows[0].status !== 'active') return res.status(403).json({ error: 'account_locked' });
    req.user = { ...payload, role: rows[0].role };
    req._authChecked = true;
    next();
  } catch (e) { next(e); }
}

// Kiem tra vai tro tu database (khong tin role trong token,
// vi admin co the da doi vai tro cua nguoi dung sau khi ho dang nhap).
export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (req._authChecked && req.user?.role) {
        if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
        return next();
      }
      const [rows] = await db.execute("SELECT role FROM users WHERE id=? AND status='active'", [req.user.sub]);
      if (!rows[0] || !roles.includes(rows[0].role)) return res.status(403).json({ error: 'forbidden' });
      req.user.role = rows[0].role;
      next();
    } catch (e) { next(e); }
  };
}
