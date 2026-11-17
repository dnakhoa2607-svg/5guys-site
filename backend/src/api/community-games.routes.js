import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import env from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { extractGameArchive, removeGameArchive, safeArchivePath } from '../communityGames/archive.js';

const router = Router();
const backendRoot = fileURLToPath(new URL('../..', import.meta.url));
const storageRoot = path.resolve(backendRoot, env.COMMUNITY_GAMES_STORAGE);
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 2, fieldSize: 8192 }
});
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const metadataSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1200).optional().default('')
});
const slugSchema = z.string().regex(/^[a-z0-9-]{1,180}$/);

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function sendError(res, next, error) {
  if (Number.isInteger(error?.status) && typeof error?.code === 'string') {
    return res.status(error.status).json({ error: error.code });
  }
  next(error);
}

function encodedPath(file) {
  return file.split('/').map(encodeURIComponent).join('/');
}

function publicGame(row) {
  const isBundled = row.source === 'bundled';
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    source: row.source,
    uploader: row.uploader_name || '5GUYS',
    status: row.status,
    reviewNote: row.review_note || null,
    createdAt: row.created_at,
    playUrl: row.status === 'published'
      ? isBundled
        ? row.entry_file
        : `community-games/${encodeURIComponent(row.slug)}/play/${encodedPath(row.entry_file)}`
      : null
  };
}

function receiveArchive(req, res, next) {
  uploader.single('game')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'archive_too_large' : 'invalid_upload' });
    }
    if (error) return next(error);
    next();
  });
}

async function requireActiveAccount(req, res, next) {
  try {
    const [[user]] = await db.execute("SELECT id FROM users WHERE id=? AND status='active'", [req.user.sub]);
    if (!user) return res.status(403).json({ error: 'forbidden' });
    next();
  } catch (e) { next(e); }
}

router.get('/', async (req, res, next) => {
  try {
    const query = z.object({ q: z.string().trim().max(100).optional() }).parse(req.query);
    const search = query.q ? `%${query.q}%` : null;
    const [rows] = await db.execute(
      `SELECT g.slug,g.title,g.description,g.source,g.entry_file,g.status,g.created_at,
              u.display_name AS uploader_name
       FROM community_games g LEFT JOIN users u ON u.id=g.uploader_user_id
       WHERE g.status='published' AND (? IS NULL OR g.title LIKE ? OR g.description LIKE ?)
       ORDER BY g.created_at DESC,g.id DESC LIMIT 100`,
      [search, search, search]
    );
    res.json({ games: rows.map(publicGame) });
  } catch (e) { next(e); }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT g.slug,g.title,g.description,g.source,g.entry_file,g.status,g.review_note,g.created_at,
              u.display_name AS uploader_name
       FROM community_games g LEFT JOIN users u ON u.id=g.uploader_user_id
       WHERE g.uploader_user_id=? ORDER BY g.created_at DESC LIMIT 100`,
      [req.user.sub]
    );
    res.json({ games: rows.map(publicGame) });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireActiveAccount, uploadLimiter, receiveArchive, async (req, res, next) => {
  let extracted;
  try {
    const data = metadataSchema.parse(req.body);
    const archive = req.file;
    if (!archive || archive.buffer.length < 4 || archive.buffer[0] !== 0x50 || archive.buffer[1] !== 0x4b) {
      throw new HttpError(400, 'invalid_zip');
    }
    extracted = await extractGameArchive(archive.buffer, storageRoot);
    const baseSlug = data.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 130) || 'community-game';
    const slug = `${baseSlug}-${extracted.storageKey.slice(0, 8)}`;
    const [result] = await db.execute(
      `INSERT INTO community_games
       (slug,title,description,source,storage_key,entry_file,uploader_user_id,status)
       VALUES(?,?,?,'uploaded',?,?,?,'pending')`,
      [slug, data.title, data.description, extracted.storageKey, extracted.entryFile, req.user.sub]
    );
    res.status(201).json({
      game: {
        slug, title: data.title, description: data.description, status: 'pending',
        createdAt: new Date().toISOString(), id: result.insertId
      }
    });
  } catch (e) {
    if (extracted) await removeGameArchive(storageRoot, extracted.storageKey);
    sendError(res, next, e);
  }
});

router.get('/:slug/play/*', async (req, res, next) => {
  try {
    const parsedSlug = slugSchema.safeParse(req.params.slug);
    if (!parsedSlug.success) return res.status(404).json({ error: 'game_not_found' });
    const [rows] = await db.execute(
      "SELECT storage_key FROM community_games WHERE slug=? AND source='uploaded' AND status='published' LIMIT 1",
      [parsedSlug.data]
    );
    if (!rows[0]) return res.status(404).json({ error: 'game_not_found' });

    const relativePath = safeArchivePath(req.params[0]);
    const gameRoot = path.resolve(storageRoot, rows[0].storage_key);
    const filePath = path.resolve(gameRoot, relativePath);
    const relative = path.relative(gameRoot, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return res.status(404).json({ error: 'game_file_not_found' });
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return res.status(404).json({ error: 'game_file_not_found' });

    res.removeHeader('X-Frame-Options');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    const frameAncestors = env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()).join(' ');
    res.setHeader('Content-Security-Policy',
      `default-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; ` +
      `style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; ` +
      `font-src 'self' data: https:; connect-src 'self' data: blob: https: wss:; worker-src 'self' blob:; ` +
      `object-src 'none'; base-uri 'self'; frame-ancestors ${frameAncestors}; ` +
      'sandbox allow-scripts allow-pointer-lock allow-presentation');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filePath, { dotfiles: 'deny' }, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'game_file_not_found' });
    sendError(res, next, e);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const parsedSlug = slugSchema.safeParse(req.params.slug);
    if (!parsedSlug.success) return res.status(404).json({ error: 'game_not_found' });
    const [[row]] = await db.execute(
      `SELECT g.slug,g.title,g.description,g.source,g.entry_file,g.status,g.created_at,
              u.display_name AS uploader_name
       FROM community_games g LEFT JOIN users u ON u.id=g.uploader_user_id
       WHERE g.slug=? AND g.status='published' LIMIT 1`,
      [parsedSlug.data]
    );
    if (!row) return res.status(404).json({ error: 'game_not_found' });
    res.json({ game: publicGame(row) });
  } catch (e) { next(e); }
});

export default router;
