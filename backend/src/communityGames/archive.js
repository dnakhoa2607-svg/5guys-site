import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';

const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 500;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  '.avif', '.bin', '.csv', '.css', '.data', '.dds', '.eot', '.gif', '.glb', '.gltf',
  '.htm', '.html', '.ico', '.jpeg', '.jpg', '.js', '.json', '.ktx', '.ktx2', '.m4a',
  '.map', '.md', '.mjs', '.mtl', '.mp3', '.mp4', '.obj', '.ogg', '.otf', '.png',
  '.svg', '.text', '.ttf', '.txt', '.wasm', '.wav', '.webm', '.webmanifest', '.webp',
  '.woff', '.woff2', '.xml'
]);

function archiveError(status, code) {
  const error = new Error(code);
  error.status = status;
  error.code = code;
  return error;
}

export function safeArchivePath(name) {
  if (typeof name !== 'string' || !name || name.includes('\\') || /[\u0000-\u001f\u007f]/.test(name)) {
    throw archiveError(400, 'unsafe_archive_path');
  }
  const normalized = name.endsWith('/') ? name.slice(0, -1) : name;
  if (!normalized || normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    throw archiveError(400, 'unsafe_archive_path');
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes(':')
    || /[. ]$/.test(segment) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment))) {
    throw archiveError(400, 'unsafe_archive_path');
  }
  return segments.join(path.sep);
}

export function findEntryPoint(paths) {
  const entries = paths.filter((entry) => !entry.isDirectory && path.posix.basename(entry.name).toLowerCase() === 'index.html');
  if (entries.length !== 1) throw archiveError(400, 'invalid_game_entry_point');
  return entries[0].name;
}

function openArchive(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true, strictFileNames: true }, (error, zipFile) => {
      if (error) return reject(archiveError(400, 'invalid_zip'));
      const entries = [];
      zipFile.on('error', () => reject(archiveError(400, 'invalid_zip')));
      zipFile.on('entry', (entry) => {
        entries.push(entry);
        if (entries.length > MAX_FILES) {
          zipFile.close();
          reject(archiveError(413, 'too_many_archive_files'));
          return;
        }
        zipFile.readEntry();
      });
      zipFile.on('end', () => resolve({ zipFile, entries }));
      zipFile.readEntry();
    });
  });
}

function extractEntry(zipFile, entry, destination) {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, async (error, input) => {
      if (error) return reject(archiveError(400, 'invalid_zip'));
      let written = 0;
      const limit = new Transform({
        transform(chunk, encoding, callback) {
          written += chunk.length;
          if (written > MAX_FILE_BYTES) callback(archiveError(413, 'archive_file_too_large'));
          else callback(null, chunk);
        }
      });
      try {
        await pipeline(input, limit, createWriteStream(destination, { flags: 'wx', mode: 0o644 }));
        if (written !== entry.uncompressedSize) throw archiveError(400, 'invalid_zip');
        resolve(written);
      } catch (e) {
        reject(e.status ? e : archiveError(400, 'invalid_zip'));
      }
    });
  });
}

export async function extractGameArchive(buffer, storageRoot) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) throw archiveError(400, 'invalid_zip');
  if (buffer.length > MAX_ARCHIVE_BYTES) throw archiveError(413, 'archive_too_large');

  const { zipFile, entries } = await openArchive(buffer);
  const storageKey = randomUUID();
  const staging = path.join(storageRoot, `.staging-${storageKey}`);
  const destination = path.join(storageRoot, storageKey);
  let published = false;

  try {
    let totalBytes = 0;
    const seen = new Set();
    const files = [];
    for (const entry of entries) {
      const relativePath = safeArchivePath(entry.fileName);
      const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff;
      const fileType = unixMode & 0xf000;
      if (fileType === 0xa000) throw archiveError(400, 'unsupported_archive_symlink');
      const isDirectory = entry.fileName.endsWith('/') || fileType === 0x4000;
      if (isDirectory) continue;

      const key = relativePath.toLowerCase();
      if (seen.has(key)) throw archiveError(400, 'duplicate_archive_path');
      seen.add(key);
      if (entry.generalPurposeBitFlag & 1) throw archiveError(400, 'encrypted_archive_not_supported');
      if (!ALLOWED_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) {
        throw archiveError(400, 'unsupported_game_file_type');
      }
      if (entry.uncompressedSize > MAX_FILE_BYTES) throw archiveError(413, 'archive_file_too_large');
      totalBytes += entry.uncompressedSize;
      if (totalBytes > MAX_TOTAL_BYTES) throw archiveError(413, 'archive_unpacked_too_large');
      files.push({ entry, relativePath: relativePath.split(path.sep).join('/') });
    }

    const entryFile = findEntryPoint(files.map((file) => ({ name: file.relativePath, isDirectory: false })));
    await fs.mkdir(storageRoot, { recursive: true });
    await fs.mkdir(staging, { recursive: false });

    let extractedBytes = 0;
    for (const file of files) {
      const target = path.resolve(staging, file.relativePath);
      const relative = path.relative(staging, target);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw archiveError(400, 'unsafe_archive_path');
      await fs.mkdir(path.dirname(target), { recursive: true });
      extractedBytes += await extractEntry(zipFile, file.entry, target);
      if (extractedBytes > MAX_TOTAL_BYTES) throw archiveError(413, 'archive_unpacked_too_large');
    }

    await fs.rename(staging, destination);
    published = true;
    return { storageKey, entryFile };
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    if (published) await fs.rm(destination, { recursive: true, force: true });
    throw error;
  } finally {
    zipFile.close();
  }
}

export async function removeGameArchive(storageRoot, storageKey) {
  if (!/^[\da-f-]{36}$/i.test(storageKey)) throw new Error('invalid_storage_key');
  await fs.rm(path.join(storageRoot, storageKey), { recursive: true, force: true });
}
