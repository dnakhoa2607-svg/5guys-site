import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { findEntryPoint, safeArchivePath } from '../src/communityGames/archive.js';

test('accepts nested relative game assets', () => {
  assert.equal(safeArchivePath('assets/images/title.png'), path.join('assets', 'images', 'title.png'));
});

test('rejects absolute, traversal, and Windows-specific paths', () => {
  for (const name of ['../index.html', '/index.html', 'C:/index.html', 'assets\\game.js', 'folder/file.html:stream', 'CON.txt']) {
    assert.throws(() => safeArchivePath(name), { code: 'unsafe_archive_path' });
  }
});

test('requires exactly one index.html entry point', () => {
  assert.equal(findEntryPoint([
    { name: 'game/index.html', isDirectory: false },
    { name: 'game/main.js', isDirectory: false }
  ]), 'game/index.html');
  assert.throws(() => findEntryPoint([{ name: 'game/main.html', isDirectory: false }]), { code: 'invalid_game_entry_point' });
  assert.throws(() => findEntryPoint([
    { name: 'index.html', isDirectory: false },
    { name: 'other/index.html', isDirectory: false }
  ]), { code: 'invalid_game_entry_point' });
});
