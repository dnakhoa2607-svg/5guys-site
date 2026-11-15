import jwt from 'jsonwebtoken';
import env from '../config.js';

export function requireAuth(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'authentication_required' });
  try { req.user = jwt.verify(token, env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'invalid_or_expired_token' }); }
}
