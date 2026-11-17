(function () {
  const $ = (id) => document.getElementById(id);
  const gamesEl = $('game-list');
  const messageEl = $('catalog-message');
  const uploadMessage = $('upload-message');
  let games = [];

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function errorMessage(error) {
    const messages = {
      invalid_zip: 'File tải lên không phải ZIP hợp lệ.',
      archive_too_large: 'File ZIP vượt quá giới hạn 20 MB.',
      archive_file_too_large: 'Một file trong ZIP vượt quá giới hạn cho phép.',
      archive_unpacked_too_large: 'Tổng dung lượng sau giải nén vượt quá giới hạn 100 MB.',
      too_many_archive_files: 'ZIP có quá nhiều file (tối đa 500).',
      invalid_game_entry_point: 'ZIP phải có đúng một file index.html.',
      unsupported_game_file_type: 'ZIP chứa loại file chưa được hỗ trợ.',
      unsafe_archive_path: 'ZIP có đường dẫn file không an toàn.',
      duplicate_archive_path: 'ZIP có tên file trùng nhau.',
      encrypted_archive_not_supported: 'ZIP được mã hóa; vui lòng tải lên ZIP không đặt mật khẩu.',
      authentication_required: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      invalid_or_expired_token: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      forbidden: 'Tài khoản hiện không được phép đăng game.'
    };
    return messages[error.message] || G5.errorText(error);
  }

  function gameUrl(game) {
    if (game.source === 'bundled') return new URL(game.playUrl, document.baseURI).href;
    const base = G5.apiBase.replace(/\/+$/, '') + '/';
    return new URL(game.playUrl, base).href;
  }

  function showMessage(element, text, isError) {
    element.textContent = text;
    element.className = 'mt-3 rounded-lg px-3 py-2 text-sm ' + (isError ? 'bg-red-900/40 text-red-200' : 'bg-emerald-900/40 text-emerald-200');
  }

  function play(game) {
    if (!game.playUrl) return;
    $('player-title').textContent = game.title;
    const frame = $('game-frame');
    frame.src = gameUrl(game);
    frame.title = game.title;
    $('player-section').classList.remove('hidden');
    $('player-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderGames() {
    const query = $('game-search').value.trim().toLocaleLowerCase('vi');
    const visible = games.filter((game) => !query || (game.title + ' ' + game.description).toLocaleLowerCase('vi').includes(query));
    gamesEl.replaceChildren();
    if (!visible.length) {
      const empty = node('p', 'sm:col-span-2 rounded-xl border border-vault-border bg-vault-surface p-5 text-sm text-vault-textMuted',
        games.length ? 'Không tìm thấy game phù hợp.' : 'Chưa có game được duyệt. Hãy quay lại sau nhé.');
      gamesEl.append(empty);
      return;
    }

    for (const game of visible) {
      const card = node('article', 'arcade-card flex min-h-48 flex-col rounded-2xl p-5');
      const badge = node('span', 'inline-flex w-fit items-center gap-1.5 rounded-full border border-vault-border bg-vault-bg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-vault-primary', 'HTML5 • Miễn phí');
      const title = node('h3', 'mt-3 text-lg font-extrabold text-white', game.title);
      const description = node('p', 'mt-2 flex-grow whitespace-pre-line text-sm leading-relaxed text-vault-textMuted', game.description || 'Game HTML5 do cộng đồng 5GUYS chia sẻ.');
      const owner = node('p', 'mt-3 text-xs text-vault-textMuted', 'Đăng bởi ' + game.uploader);
      const button = node('button', 'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-vault-primaryDark px-4 py-2.5 text-sm font-bold text-white hover:bg-vault-primary');
      button.type = 'button';
      button.append(document.createElement('i'));
      button.firstChild.className = 'fa-solid fa-play';
      button.append(document.createTextNode('Chơi ngay'));
      button.addEventListener('click', () => play(game));
      card.append(badge, title, description, owner, button);
      gamesEl.append(card);
    }
  }

  function statusText(status) {
    return {
      pending: 'Đang chờ duyệt',
      published: 'Đã công khai',
      rejected: 'Chưa được duyệt',
      removed: 'Đã gỡ'
    }[status] || status;
  }

  async function loadMine() {
    const container = $('my-games-list');
    container.replaceChildren(node('p', 'text-xs text-vault-textMuted', 'Đang tải...'));
    try {
      const result = await G5.api('/community-games/mine');
      container.replaceChildren();
      if (!result.games.length) {
        container.append(node('p', 'text-xs text-vault-textMuted', 'Bạn chưa đăng game nào.'));
        return;
      }
      for (const game of result.games) {
        const row = node('div', 'rounded-lg border border-vault-border bg-vault-bg p-3');
        row.append(node('p', 'font-semibold text-white', game.title));
        row.append(node('p', 'mt-1 text-xs text-vault-textMuted', statusText(game.status)));
        if (game.reviewNote) row.append(node('p', 'mt-1 text-xs text-rose-200', 'Ghi chú: ' + game.reviewNote));
        container.append(row);
      }
    } catch (error) {
      container.replaceChildren(node('p', 'text-xs text-rose-200', errorMessage(error)));
    }
  }

  async function loadGames() {
    messageEl.textContent = 'Đang tải danh sách game...';
    messageEl.classList.remove('hidden');
    gamesEl.replaceChildren();
    try {
      const result = await G5.api('/community-games');
      games = result.games || [];
      messageEl.classList.add('hidden');
      renderGames();
    } catch (error) {
      messageEl.textContent = 'Không tải được danh sách game: ' + errorMessage(error);
      messageEl.classList.remove('hidden');
      messageEl.classList.add('text-rose-200');
    }
  }

  $('game-search').addEventListener('input', renderGames);
  $('close-player').addEventListener('click', () => {
    $('game-frame').src = 'about:blank';
    $('player-section').classList.add('hidden');
  });
  $('refresh-my-games').addEventListener('click', loadMine);

  const authenticated = G5.isApiMode();
  $('upload-login').classList.toggle('hidden', authenticated);
  $('upload-form').classList.toggle('hidden', !authenticated);
  $('my-games-card').classList.toggle('hidden', !authenticated);

  $('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = $('upload-submit');
    button.disabled = true;
    uploadMessage.classList.add('hidden');
    try {
      const result = await G5.api('/community-games', {
        method: 'POST',
        body: new FormData(form)
      });
      form.reset();
      showMessage(uploadMessage, `Đã gửi "${result.game.title}" để admin/staff duyệt.`, false);
      await loadMine();
    } catch (error) {
      showMessage(uploadMessage, errorMessage(error), true);
    } finally {
      button.disabled = false;
    }
  });

  loadGames();
  if (authenticated) loadMine();
})();
