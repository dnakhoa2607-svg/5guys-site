/*
 * Trang tìm kiếm: tải danh mục game, tạo bộ lọc và đồng bộ kết quả theo lựa chọn.
 * Chỉ khởi chạy sau khi HTML đã sẵn sàng để các thành phần trên trang tồn tại.
 */
document.addEventListener('DOMContentLoaded', async function () {
  // Lấy các khu vực giao diện để bộ lọc và kết quả có thể cập nhật mà không tải lại trang.
  const box = document.getElementById('search-games-grid');
  if (!box) return;
  const resultsSection = document.getElementById('search-results-section') || box.closest('section');
  const resultsToolbar = document.getElementById('search-results-toolbar');
  const filterAside = document.getElementById('search-filter-aside') || document.querySelector('.search-filter');
  const genreBox = document.getElementById('fg');
  const platformBox = document.getElementById('fp');
  const priceRange = document.getElementById('pr');
  const priceValue = document.getElementById('pv');
  const sortSelect = document.getElementById('so');
  const sortTrigger = document.getElementById('sort-trigger');
  const sortMenu = document.getElementById('sort-menu');
  const pageSizeSelect = document.getElementById('page-size');
  const pageSizeTrigger = document.getElementById('page-size-trigger');
  const pageSizeMenu = document.getElementById('page-size-menu');
  const pagination = document.getElementById('results-pagination');
  const count = document.getElementById('cnt');
  const searchInput = document.getElementById('game-search-input');
  const resetButton = document.getElementById('rs');
  const selectedGenres = new Set();
  const selectedPlatforms = new Set();
  let format = 'all';
  let currentPage = 1;
  let query = new URLSearchParams(location.search).get('q') || '';
  let sessionPeakHeight = 0;
  searchInput.value = query;

  // Chuẩn hóa dữ liệu dùng làm bộ lọc và định dạng giá theo tiền Việt Nam.
  function splitValues(value) {
    return String(value || '').split(/[,/]/).map(function (item) { return item.trim(); }).filter(Boolean);
  }
  function vnd(value) { return new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ'; }

  function isDesktopLayout() {
    return window.matchMedia('(min-width: 1024px)').matches;
  }

  // Giữ chiều cao tối thiểu ổn định cho cột kết quả trên Desktop để ngăn sụp đổ layout đẩy Footer lên.
  function syncResultsMinHeight(preserveForScrollY) {
    if (!resultsSection) return;
    if (!isDesktopLayout()) {
      resultsSection.style.minHeight = '';
      return;
    }
    const vhFloor = Math.round(window.innerHeight * 0.75);
    const asideHeight = filterAside ? Math.ceil(filterAside.offsetHeight) : 0;
    let targetMin = Math.max(vhFloor, asideHeight, sessionPeakHeight);

    if (typeof preserveForScrollY === 'number' && preserveForScrollY > 0) {
      const sectionTop = resultsSection.getBoundingClientRect().top + window.scrollY;
      const neededForViewport = Math.ceil(preserveForScrollY + window.innerHeight - sectionTop);
      if (neededForViewport > targetMin) {
        targetMin = neededForViewport;
      }
      sessionPeakHeight = Math.max(sessionPeakHeight, targetMin);
    }

    resultsSection.style.minHeight = targetMin + 'px';
  }

  // Tắt tạm scroll-behavior: smooth để khôi phục vị trí cuộn tức thì không bị giật khung hình.
  function restoreInstantScroll(targetWinY, anchorEl, prevAnchorTop, prevAsideScroll) {
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';

    if (filterAside && typeof prevAsideScroll === 'number' && filterAside.scrollTop !== prevAsideScroll) {
      filterAside.scrollTop = prevAsideScroll;
    }

    if (anchorEl && typeof prevAnchorTop === 'number') {
      const currentTop = anchorEl.getBoundingClientRect().top;
      const delta = currentTop - prevAnchorTop;
      if (Math.abs(delta) > 0.5) {
        window.scrollTo(0, Math.max(0, window.scrollY + delta));
      }
    } else if (typeof targetWinY === 'number' && Math.abs(window.scrollY - targetWinY) > 0.5) {
      window.scrollTo(0, Math.max(0, targetWinY));
    }

    requestAnimationFrame(function () {
      if (filterAside && typeof prevAsideScroll === 'number' && filterAside.scrollTop !== prevAsideScroll) {
        filterAside.scrollTop = prevAsideScroll;
      }
      if (anchorEl && typeof prevAnchorTop === 'number') {
        const afterTop = anchorEl.getBoundingClientRect().top;
        const afterDelta = afterTop - prevAnchorTop;
        if (Math.abs(afterDelta) > 0.5) {
          window.scrollTo(0, Math.max(0, window.scrollY + afterDelta));
        }
      } else if (typeof targetWinY === 'number' && Math.abs(window.scrollY - targetWinY) > 0.5) {
        window.scrollTo(0, Math.max(0, targetWinY));
      }
      root.style.scrollBehavior = prevBehavior;
    });
  }

  // Thực thi thay đổi bộ lọc kèm khóa vị trí phần tử dưới con trỏ chuột.
  function runWithScrollLock(anchorEl, updateFn, games) {
    const prevWinY = window.scrollY;
    const prevAsideScroll = filterAside ? filterAside.scrollTop : 0;
    const prevAnchorTop = anchorEl ? anchorEl.getBoundingClientRect().top : null;

    syncResultsMinHeight(prevWinY);
    updateFn();
    render(games);
    syncResultsMinHeight(prevWinY);
    restoreInstantScroll(prevWinY, anchorEl, prevAnchorTop, prevAsideScroll);
  }

  // Tạo một lựa chọn thể loại dạng checkbox hoặc nền tảng dạng nút bật/tắt.
  function makeFacet(value, type) {
    if (type === 'genre') {
      const label = document.createElement('label');
      label.className = 'flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-gray-100 hover:text-brand-light';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value;
      input.className = 'cg h-4 w-4 rounded accent-purple-500';
      label.append(input, document.createTextNode(value));
      return label;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.v = value;
    button.className = 'cp w-full rounded-xl border border-brand/30 bg-dark-bg px-3 py-2.5 text-left text-sm font-semibold text-gray-200 transition-colors hover:border-brand-light';
    button.setAttribute('aria-pressed', 'false');
    button.textContent = value;
    return button;
  }

  // Cập nhật trạng thái định dạng đang chọn và giữ kích thước các nút ổn định.
  function setFormat(next) {
    format = next;
    document.querySelectorAll('.ft').forEach(function (button) {
      const active = button.dataset.f === format;
      button.setAttribute('aria-pressed', String(active));
      button.className = 'ft w-full rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-colors ' + (active ? 'border-brand bg-brand text-white' : 'border-brand/30 bg-dark-bg text-gray-200 hover:border-brand-light');
    });
  }

  // Đồng bộ menu tùy chỉnh với select ẩn để giữ giá trị dùng cho logic lọc/sắp xếp.
  function closePageSizeMenu() {
    pageSizeMenu.hidden = true;
    pageSizeTrigger.setAttribute('aria-expanded', 'false');
    pageSizeTrigger.querySelector('i').classList.remove('rotate-180');
  }
  function syncPageSizeMenu() {
    const selected = pageSizeSelect.value;
    pageSizeTrigger.querySelector('span').textContent = 'View: ' + selected;
    pageSizeMenu.querySelectorAll('[data-page-size]').forEach(function (option) {
      option.setAttribute('aria-selected', String(option.dataset.pageSize === selected));
    });
  }
  function closeSortMenu() {
    sortMenu.hidden = true;
    sortTrigger.setAttribute('aria-expanded', 'false');
    sortTrigger.querySelector('i').classList.remove('rotate-180');
  }
  function syncSortMenu() {
    const selected = sortSelect.value;
    const selectedOption = sortMenu.querySelector('[data-sort-value="' + selected + '"]');
    sortTrigger.querySelector('span').textContent = selectedOption.textContent;
    sortMenu.querySelectorAll('[data-sort-value]').forEach(function (option) {
      option.setAttribute('aria-selected', String(option.dataset.sortValue === selected));
    });
  }

  // Cuộn mượt lên đầu danh sách kết quả khi người dùng chuyển trang phân trang.
  function scrollToResultsTop() {
    const anchor = resultsToolbar || resultsSection || box;
    if (!anchor) return;
    const targetTop = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - 92);
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  // Lọc, sắp xếp, đếm và chia trang cho danh sách game hiện tại.
  function render(games) {
    const maxPrice = Number(priceRange.value);
    priceValue.textContent = vnd(maxPrice);
    const rows = games.filter(function (game) {
      const titleMatches = !query || game.title.toLowerCase().includes(query.toLowerCase());
      const gameGenres = splitValues(game.genre);
      const gamePlatforms = splitValues(game.platform);
      const genreMatches = !selectedGenres.size || gameGenres.some(function (genre) { return selectedGenres.has(genre); });
      const platformMatches = !selectedPlatforms.size || gamePlatforms.some(function (platform) { return selectedPlatforms.has(platform); });
      const priceMatches = Number(game.price) <= maxPrice;
      const gameFormats = splitValues(game.available_formats || game.product_type);
      const formatMatches = format === 'all' || gameFormats.includes(format);
      return titleMatches && genreMatches && platformMatches && priceMatches && formatMatches;
    });
    if (sortSelect.value === 'a') rows.sort(function (a, b) { return Number(a.price) - Number(b.price); });
    else if (sortSelect.value === 'd') rows.sort(function (a, b) { return Number(b.price) - Number(a.price); });
    else rows.sort(function (a, b) { return Number(b.rating) - Number(a.rating); });
    count.textContent = String(rows.length);
    if (!rows.length) {
      box.replaceChildren(Object.assign(document.createElement('p'), { className: 'col-span-full rounded-2xl border border-dark-border bg-dark-surface p-8 text-center text-sm text-outline', textContent: 'Không tìm thấy game phù hợp. Hãy thử bỏ bớt bộ lọc.' }));
      pagination.replaceChildren();
      return;
    }
    const pageSize = Number(pageSizeSelect.value) || 20;
    const pages = Math.ceil(rows.length / pageSize);
    currentPage = Math.min(currentPage, pages);
    const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(function (g) {
      if (format === 'all' || g.product_type === format) return g;
      return Object.assign({}, g, { product_type: format, id: '', available_stock: null });
    });
    G5Catalog.renderGrid(box, pageRows, false);
    pagination.replaceChildren();
    if (pages < 2) return;
    function pageButton(label, target, disabled, active) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.disabled = disabled;
      button.className = 'min-w-10 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ' + (active ? 'border-brand bg-brand text-white' : 'border-brand/30 bg-dark-surface text-gray-200 hover:border-brand-light');
      button.addEventListener('click', function () {
        currentPage = target;
        sessionPeakHeight = 0;
        syncResultsMinHeight(0);
        render(games);
        scrollToResultsTop();
      });
      pagination.appendChild(button);
    }
    pageButton('‹', currentPage - 1, currentPage === 1, false);
    for (let page = 1; page <= pages; page++) pageButton(String(page), page, false, page === currentPage);
    pageButton('›', currentPage + 1, currentPage === pages, false);
  }

  window.addEventListener('resize', function () {
    if (!isDesktopLayout()) {
      sessionPeakHeight = 0;
    }
    syncResultsMinHeight(0);
  });

  // Lấy dữ liệu từ API rồi tạo các lựa chọn dựa trên thể loại/nền tảng có trong catalog.
  try {
    const data = await G5.api('/products?limit=100');
    const games = data.products || [];
    const genres = Array.from(new Set(games.flatMap(function (game) { return splitValues(game.genre); }))).sort(function (a, b) { return a.localeCompare(b, 'vi'); });
    const platforms = Array.from(new Set(games.flatMap(function (game) { return splitValues(game.platform); }))).sort(function (a, b) { return a.localeCompare(b, 'vi'); });
    genreBox.replaceChildren();
    platformBox.replaceChildren();
    genres.forEach(function (genre) { genreBox.appendChild(makeFacet(genre, 'genre')); });
    platforms.forEach(function (platform) { platformBox.appendChild(makeFacet(platform, 'platform')); });
    const maxPrice = Math.max(2000000, Math.ceil(Math.max.apply(null, games.map(function (game) { return Number(game.price) || 0; })) / 100000) * 100000);
    priceRange.max = String(maxPrice);
    priceRange.value = String(maxPrice);

    // Áp dụng từ khóa hiện tại, làm mới từ trang đầu và giữ URL đồng bộ với ô tìm kiếm.
    function applySearchQuery() {
      runWithScrollLock(searchInput, function () {
        query = searchInput.value.trim();
        currentPage = 1;
        const url = new URL(location.href);
        if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
        history.replaceState({}, '', url);
      }, games);
    }

    // Hỗ trợ cả Enter/nút tìm kiếm lẫn cập nhật trực tiếp khi nhập hoặc xóa chữ.
    document.getElementById('game-search-form').addEventListener('submit', function (event) {
      event.preventDefault();
      applySearchQuery();
    });
    searchInput.addEventListener('input', applySearchQuery);

    // Các sự kiện bộ lọc đều khóa vị trí cuộn, đặt lại trang 1 và cập nhật danh sách ngay lập tức.
    genreBox.addEventListener('change', function (event) {
      if (!event.target.matches('.cg')) return;
      const labelEl = event.target.closest('label') || event.target;
      runWithScrollLock(labelEl, function () {
        if (event.target.checked) selectedGenres.add(event.target.value);
        else selectedGenres.delete(event.target.value);
        currentPage = 1;
      }, games);
    });

    platformBox.addEventListener('click', function (event) {
      const button = event.target.closest('.cp');
      if (!button) return;
      runWithScrollLock(button, function () {
        if (selectedPlatforms.has(button.dataset.v)) selectedPlatforms.delete(button.dataset.v);
        else selectedPlatforms.add(button.dataset.v);
        const active = selectedPlatforms.has(button.dataset.v);
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('bg-brand', active);
        button.classList.toggle('text-white', active);
        button.classList.toggle('bg-dark-bg', !active);
        button.classList.toggle('text-gray-200', !active);
        currentPage = 1;
      }, games);
    });

    document.querySelectorAll('.ft').forEach(function (button) {
      button.addEventListener('click', function () {
        runWithScrollLock(button, function () {
          setFormat(button.dataset.f);
          currentPage = 1;
        }, games);
      });
    });

    priceRange.addEventListener('input', function () {
      runWithScrollLock(priceRange, function () {
        currentPage = 1;
      }, games);
    });

    sortSelect.addEventListener('change', function () {
      runWithScrollLock(sortTrigger, function () {}, games);
    });

    pageSizeSelect.addEventListener('change', function () {
      sessionPeakHeight = 0;
      runWithScrollLock(pageSizeTrigger, function () {
        currentPage = 1;
      }, games);
    });

    // Mở/đóng menu số lượng hiển thị và đồng bộ lựa chọn với select nền.
    pageSizeTrigger.addEventListener('click', function () {
      pageSizeMenu.hidden = !pageSizeMenu.hidden;
      const expanded = !pageSizeMenu.hidden;
      pageSizeTrigger.setAttribute('aria-expanded', String(expanded));
      pageSizeTrigger.querySelector('i').classList.toggle('rotate-180', expanded);
    });
    pageSizeMenu.addEventListener('click', function (event) {
      const option = event.target.closest('[data-page-size]');
      if (!option) return;
      pageSizeSelect.value = option.dataset.pageSize;
      syncPageSizeMenu();
      closePageSizeMenu();
      pageSizeSelect.dispatchEvent(new Event('change'));
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('#page-size-picker')) closePageSizeMenu();
      if (!event.target.closest('#sort-picker')) closeSortMenu();
    });
    pageSizeTrigger.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closePageSizeMenu();
    });
    syncPageSizeMenu();

    // Menu sắp xếp dùng chung cách mở/đóng và trạng thái chọn như menu số lượng.
    sortTrigger.addEventListener('click', function () {
      sortMenu.hidden = !sortMenu.hidden;
      const expanded = !sortMenu.hidden;
      sortTrigger.setAttribute('aria-expanded', String(expanded));
      sortTrigger.querySelector('i').classList.toggle('rotate-180', expanded);
    });
    sortMenu.addEventListener('click', function (event) {
      const option = event.target.closest('[data-sort-value]');
      if (!option) return;
      sortSelect.value = option.dataset.sortValue;
      syncSortMenu();
      closeSortMenu();
      sortSelect.dispatchEvent(new Event('change'));
    });
    sortTrigger.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeSortMenu();
    });
    syncSortMenu();

    // Đưa toàn bộ bộ lọc, từ khóa, giá và sắp xếp về trạng thái ban đầu.
    resetButton.addEventListener('click', function () {
      sessionPeakHeight = 0;
      runWithScrollLock(resetButton, function () {
        selectedGenres.clear();
        selectedPlatforms.clear();
        genreBox.querySelectorAll('.cg').forEach(function (input) { input.checked = false; });
        platformBox.querySelectorAll('.cp').forEach(function (button) {
          button.setAttribute('aria-pressed', 'false');
          button.classList.remove('bg-brand', 'text-white');
          button.classList.add('bg-dark-bg', 'text-gray-200');
        });
        query = '';
        currentPage = 1;
        searchInput.value = '';
        history.replaceState({}, '', 'search.html');
        priceRange.value = priceRange.max;
        sortSelect.value = 'r';
        syncSortMenu();
        setFormat('all');
      }, games);
    });

    // Đồng bộ chiều cao nền khi mở/đóng các thẻ <details> trong sidebar bộ lọc.
    if (filterAside) {
      filterAside.addEventListener('toggle', function () {
        syncResultsMinHeight(window.scrollY);
      }, true);
    }

    render(games);
    syncResultsMinHeight(0);
  } catch {
    // Thông báo rõ nguyên nhân chung khi API hoặc cơ sở dữ liệu chưa sẵn sàng.
    box.replaceChildren(Object.assign(document.createElement('p'), { className: 'col-span-full py-12 text-center text-amber-200', textContent: 'Không tải được catalog. Hãy khởi động API và MySQL.' }));
    syncResultsMinHeight(0);
  }
});
