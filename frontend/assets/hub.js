/* 5GUYS - hub.js: logic dùng chung cho library.html, rental.html, mods.html */

    // Quick Toast Dispatcher
    window.showToast = function (title, message, isSuccess = true) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `p-4 rounded-2xl bg-[#241832] shadow-2xl flex items-center gap-3 text-white transition-all transform duration-300 translate-y-2 pointer-events-auto border-l-4 ${isSuccess ? 'border-[#9d4edd]' : 'border-red-500'} border border-outline-variant/30 min-w-[280px] max-w-sm`;
      toast.innerHTML = `
        <span class="material-symbols-outlined ${isSuccess ? 'text-brand-neon' : 'text-red-400'} text-2xl">${isSuccess ? 'check_circle' : 'error'}</span>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-white">${title}</span>
          <span class="text-[11px] text-on-surface-variant leading-tight">${message}</span>
        </div>
      `;
      container.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2');
      });
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    };

    // DOM Ready Setup for interactive actions
    document.addEventListener('DOMContentLoaded', function () {
      
      // License Key Toggle & Copy: xử lý trong phần KHO GAME bên dưới (key riêng cho từng game).

      // Promo Gift Code Redemption
      const btnRedeem = document.getElementById('btn-redeem-code');
      const inputRedeem = document.getElementById('gift-code-input');
      if (btnRedeem && inputRedeem) {
        btnRedeem.addEventListener('click', () => {
          if (!G5.requireLogin()) return;
          const val = inputRedeem.value.trim().toUpperCase();
          if (!val) {
            showToast('Lỗi Mã Code', 'Vui lòng nhập gift code trước khi kích hoạt.', false);
            return;
          }
          const result = G5.redeemGiftCode(val);
          if (result.ok) {
            showToast('Nhận Quà Thành Công! 🎉', `Mã ${val} hợp lệ! Đã cộng 50.000đ vào ví. Số dư mới: ${G5.formatVnd(result.balance)}.`);
            inputRedeem.value = '';
          } else if (result.reason === 'used') {
            showToast('Mã Đã Sử Dụng', 'Mỗi mã quà tặng chỉ được kích hoạt một lần cho mỗi tài khoản.', false);
          } else {
            showToast('Mã Không Hợp Lệ', 'Mã code không tồn tại hoặc đã hết lượt kích hoạt.', false);
          }
        });
      }

      // Pre-flight Network Retest
      const btnRetest = document.getElementById('btn-retest-network');
      if (btnRetest) {
        btnRetest.addEventListener('click', () => {
          btnRetest.disabled = true;
          btnRetest.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span><span>Đang đo...</span>';
          setTimeout(() => {
            btnRetest.disabled = false;
            btnRetest.innerHTML = '<span class="material-symbols-outlined text-sm">refresh</span><span>Kiểm tra lại</span>';
            showToast('Pre-Flight Đã Đo Xong', 'Ping: 11.8ms | Jitter: 0.9ms | Mất gói: 0.00%. Sẵn sàng 4K144.');
          }, 1000);
        });
      }

      // Before / After Slider Interaction
      const comparisonBox = document.getElementById('comparison-container');
      const beforeWrapper = document.getElementById('img-before-wrapper');
      const sliderHandle = document.getElementById('slider-handle');
      let isDragging = false;

      if (comparisonBox && beforeWrapper && sliderHandle) {
        function setSliderPosition(xCoord) {
          const rect = comparisonBox.getBoundingClientRect();
          let posX = xCoord - rect.left;
          if (posX < 0) posX = 0;
          if (posX > rect.width) posX = rect.width;
          const percentage = (posX / rect.width) * 100;
          beforeWrapper.style.width = percentage + '%';
          sliderHandle.style.left = percentage + '%';
        }

        comparisonBox.addEventListener('mousedown', (e) => {
          isDragging = true;
          setSliderPosition(e.clientX);
        });

        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          setSliderPosition(e.clientX);
        });

        window.addEventListener('mouseup', () => {
          isDragging = false;
        });

        // Touch support
        comparisonBox.addEventListener('touchstart', (e) => {
          if (e.touches.length > 0) {
            isDragging = true;
            setSliderPosition(e.touches[0].clientX);
          }
        });
        window.addEventListener('touchmove', (e) => {
          if (!isDragging || e.touches.length === 0) return;
          setSliderPosition(e.touches[0].clientX);
        });
        window.addEventListener('touchend', () => {
          isDragging = false;
        });
      }

      // Creator Tip Jar Buttons
      const tipButtons = document.querySelectorAll('.btn-tip');
      tipButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          if (!G5.requireLogin()) return;
          const amount = btn.getAttribute('data-amount');
          showToast('Ủng Hộ Tác Giả 💖', `Cảm ơn bạn đã donate ${amount}đ cho modder KiroshiDev_VN!`);
        });
      });

      // Mod Download Button
      const btnDownloadMod = document.getElementById('btn-download-mod');
      if (btnDownloadMod) {
        btnDownloadMod.addEventListener('click', () => {
          if (!G5.requireLogin()) return;
          showToast('Bắt Đầu Tải 🚀', 'Đang tải bản mod Ray-Tracing Overhaul v3.2 (1.45 GB)... Tốc độ 65 MB/s.');
        });
      }

      
      if (window.initHub) window.initHub();
    });

/* ================= Phần bổ sung cho 3 trang: Kho game / Thuê cấu hình / Cộng đồng Mod ================= */
(function () {
  /* ---- Tiện ích sinh dữ liệu ổn định theo (tài khoản + game) ---- */
  function hash32(s) {
    var h = 2166136261, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function rng(seed) {
    var x = seed || 1;
    return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }
  function accountSeed() { var u = (window.G5 && G5.user()) || {}; return String(u.id || u.email || 'guest'); }
  function baseSlug(slug) { return String(slug || '').replace(/-(digital|physical)$/, ''); }

  // Key bản quyền dạng 5GUYS-SILK-8829-X9A1: tag lấy từ tên game, phần số/chữ sinh từ tài khoản + game
  // nên mỗi người dùng có key riêng và key không đổi giữa các lần tải trang.
  function makeKey(title, slug) {
    var clean = String(title || 'GAME').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    var part = clean.indexOf(':') !== -1 ? clean.split(':').slice(1).join(' ') : clean;
    var words = part.replace(/[^A-Z0-9 ]/g, ' ').trim().split(/\s+/).filter(function (w) { return w.length > 2 && !/^[IVX]+$/.test(w); });
    var tag = (words[0] || 'GAME').slice(0, 4); while (tag.length < 4) tag += 'X';
    var r = rng(hash32(accountSeed() + '|' + baseSlug(slug || title))), digits = '', tail = '', i;
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (i = 0; i < 4; i++) digits += Math.floor(r() * 10);
    for (i = 0; i < 4; i++) tail += A[Math.floor(r() * A.length)];
    return '5GUYS-' + tag + '-' + digits + '-' + tail;
  }

  /* ---- Dung lượng cài đặt + thời lượng chơi (T2 → CN) riêng cho từng game ---- */
  var GAME_PROFILES = {
    'hollow-knight':                          { size: 9,   week: [1.0, 0.5, 2.0, 0, 1.5, 3.5, 2.5] },
    'hollow-knight-silksong':                 { size: 12,  week: [1.5, 2.5, 4.0, 2.0, 5.5, 3.0, 0.5] },
    'black-myth-wukong':                      { size: 130, week: [0.5, 1.0, 0, 2.5, 1.5, 6.0, 4.5] },
    'elden-ring':                             { size: 60,  week: [2.0, 1.5, 3.0, 2.5, 0.5, 4.5, 5.0] },
    'sekiro-shadows-die-twice':               { size: 25,  week: [0, 1.5, 1.0, 2.0, 3.5, 2.0, 1.0] },
    'dark-souls-remastered':                  { size: 8,   week: [1.0, 0, 1.5, 0.5, 2.0, 1.0, 3.0] },
    'dark-souls-ii-scholar-of-the-first-sin': { size: 32,  week: [0.5, 2.0, 0, 1.0, 1.5, 3.0, 2.0] },
    'dark-souls-iii':                         { size: 25,  week: [2.5, 1.0, 2.0, 0, 3.0, 4.0, 1.5] },
    'red-dead-redemption':                    { size: 12,  week: [1.0, 1.5, 0.5, 2.0, 1.0, 2.5, 3.5] },
    'red-dead-redemption-ii':                 { size: 150, week: [3.0, 2.0, 1.5, 4.0, 2.5, 5.0, 6.5] }
  };
  function gameProfile(slug, title) {
    var p = GAME_PROFILES[baseSlug(slug)];
    if (p) return p;
    var r = rng(hash32(accountSeed() + '|play|' + baseSlug(slug || title))), week = [], i;
    for (i = 0; i < 7; i++) week.push(Math.round(r() * 10) / 2); // 0 → 5h, bước 0.5h
    return { size: 8 + Math.floor(r() * 70), week: week };
  }

  /* ---- Ổ đĩa lưu trữ giả lập ---- */
  var DRIVES = [
    { id: 'C', name: 'Ổ C: Kingston SSD', total: 500, free: 120, speed: '3,500 MB/s' },
    { id: 'D', name: 'Ổ D: Samsung 990 Pro', total: 1000, free: 358, speed: '7,450 MB/s' }
  ];
  var DRIVE_KEY = '5guys_library_drive';
  function currentDrive() {
    var id = localStorage.getItem(DRIVE_KEY);
    return DRIVES.filter(function (d) { return d.id === id; })[0] || DRIVES[1];
  }

  function renderDrive() {
    var d = currentDrive(), used = d.total - d.free, size = current.size || 0;
    var $ = function (id) { return document.getElementById(id); };
    if (!$('drive-name')) return;
    $('drive-name').textContent = d.name;
    $('drive-usage').textContent = used + ' GB / ' + d.total + ' GB';
    $('drive-free').textContent = 'Trống ' + d.free + ' GB';
    $('drive-speed').textContent = 'Tốc độ đọc ngẫu nhiên: ' + d.speed;
    var gamePct = Math.min(size, used) / d.total * 100;
    $('drive-bar-used').style.width = ((used / d.total * 100) - gamePct) + '%';
    $('drive-bar-game').style.width = gamePct + '%';
    $('drive-game-size').textContent = current.title ? current.title + ' - ' + size + ' GB' : 'Chọn game để xem dung lượng';
    $('drive-game-size').title = $('drive-game-size').textContent;
    var menu = $('drive-menu');
    if (menu) {
      menu.replaceChildren();
      DRIVES.forEach(function (drive) {
        var on = drive.id === d.id;
        var opt = document.createElement('button');
        opt.type = 'button';
        opt.setAttribute('role', 'option');
        opt.setAttribute('aria-selected', on ? 'true' : 'false');
        opt.dataset.drive = drive.id;
        opt.className = 'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ' + (on ? 'bg-brand-purple/25 text-white' : 'text-on-surface hover:bg-surface-container-high');
        var icon = document.createElement('span');
        icon.className = 'material-symbols-outlined text-base ' + (on ? 'text-brand-neon' : 'text-outline');
        icon.textContent = on ? 'check_circle' : 'hard_drive';
        var txt = document.createElement('span');
        txt.className = 'min-w-0 flex-1';
        var nm = document.createElement('span'); nm.className = 'block font-semibold truncate'; nm.textContent = drive.name;
        var meta = document.createElement('span'); meta.className = 'block text-[11px] text-on-surface-variant'; meta.textContent = 'Trống ' + drive.free + ' GB / ' + drive.total + ' GB · ' + drive.speed;
        txt.append(nm, meta);
        opt.append(icon, txt);
        menu.appendChild(opt);
      });
    }
  }

  function renderPlaytime() {
    var bars = document.getElementById('playtime-bars'), total = document.getElementById('playtime-total');
    if (!bars) return;
    var days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], week = current.week || [0, 0, 0, 0, 0, 0, 0];
    var max = Math.max.apply(null, week), sum = week.reduce(function (a, h) { return a + h; }, 0);
    if (total) total.textContent = (Math.round(sum * 10) / 10).toFixed(1) + ' Giờ';
    bars.setAttribute('aria-label', 'Thời lượng chơi ' + current.title + ' tuần này: ' + week.map(function (h, i) { return days[i] + ' ' + h.toFixed(1) + ' giờ'; }).join(', '));
    bars.replaceChildren();
    week.forEach(function (h, i) {
      var ratio = max > 0 ? h / max : 0;
      var b = document.createElement('div');
      b.className = 'flex-1 rounded-t transition-[height] duration-500 ease-out ' + (h > 0 && h === max ? 'bg-brand-purple shadow-[0_0_8px_rgba(157,78,221,0.6)]' : ratio >= 0.6 ? 'bg-brand-neon' : ratio >= 0.35 ? 'bg-brand-purple/40' : 'bg-surface-container-high');
      b.style.height = '0%';
      b.title = days[i] + ': ' + h.toFixed(1) + 'h';
      bars.appendChild(b);
      setTimeout(function () { b.style.height = Math.max(6, ratio * 100) + '%'; }, 30);
    });
  }

  /* ---------------- KHO GAME ---------------- */
  var GAME_LAUNCHERS = {
    'neon-viper': 'games/neon-viper.html'
  };

  function slugifyTitle(title) {
    return String(title || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function resolveGameUrl(game) {
    var slug = game.slug || slugifyTitle(game.title);
    if (GAME_LAUNCHERS[slug]) return GAME_LAUNCHERS[slug];
    return 'games/' + encodeURIComponent(slug) + '.html';
  }

  var current = { title: '', slug: '', cover: '', key: '', size: 0, week: null };
  var realKey = '', keyVisible = false;

  function renderKey() {
    var t = document.getElementById('license-key-text'), tg = document.getElementById('btn-toggle-key');
    if (!t) return;
    t.textContent = keyVisible ? realKey : realKey.replace(/[A-Z0-9]/g, '*');
    t.classList.toggle('blur-[3px]', !keyVisible);
    t.classList.toggle('select-none', !keyVisible);
    t.classList.toggle('select-all', keyVisible);
    if (tg) {
      tg.innerHTML = '<span class="material-symbols-outlined text-base">' + (keyVisible ? 'visibility_off' : 'visibility') + '</span>';
      tg.title = keyVisible ? 'Ẩn mã' : 'Hiện mã';
      tg.setAttribute('aria-label', keyVisible ? 'Ẩn mã bản quyền' : 'Hiện mã bản quyền');
      tg.setAttribute('aria-pressed', keyVisible ? 'true' : 'false');
    }
  }
  function setKey(k) { realKey = k; keyVisible = false; renderKey(); }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy_failed')); } catch (e) { reject(e); }
      ta.remove();
    });
  }

  var controlsBound = false;
  function bindLibraryControls() {
    if (controlsBound) return;
    controlsBound = true;
    var toggle = document.getElementById('btn-toggle-key'), copy = document.getElementById('btn-copy-key');
    if (toggle) toggle.addEventListener('click', function () { if (!realKey) return; keyVisible = !keyVisible; renderKey(); });
    if (copy) copy.addEventListener('click', function () {
      if (!realKey) return;
      copyText(realKey).then(function () {
        showToast('Đã Sao Chép Key 📋', 'Mã bản quyền ' + current.title + ' đã được lưu vào clipboard.');
      }).catch(function () { showToast('Không thể sao chép', 'Trình duyệt chặn clipboard. Hãy bấm biểu tượng con mắt để hiện mã và chép thủ công.', false); });
    });

    var driveBtn = document.getElementById('drive-toggle'), menu = document.getElementById('drive-menu'), caret = document.getElementById('drive-caret');
    if (!driveBtn || !menu) return;
    var setOpen = function (open) {
      menu.classList.toggle('hidden', !open);
      driveBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (caret) caret.style.transform = open ? 'rotate(180deg)' : '';
    };
    driveBtn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(menu.classList.contains('hidden')); });
    menu.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-drive]');
      if (!opt) return;
      e.stopPropagation();
      var changed = opt.dataset.drive !== currentDrive().id;
      localStorage.setItem(DRIVE_KEY, opt.dataset.drive);
      setOpen(false);
      renderDrive();
      if (changed) showToast('Đã Đổi Ổ Lưu Trữ 💾', 'Thư mục cài đặt game chuyển sang ' + currentDrive().name + ' (trống ' + currentDrive().free + ' GB).');
    });
    document.addEventListener('click', function (e) { if (!menu.classList.contains('hidden') && !e.target.closest('#library-storage-stats')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.classList.contains('hidden')) { setOpen(false); driveBtn.focus(); } });
  }

  window.playSelected = async function () {
    if (!current.title) return;
    var url = resolveGameUrl(current) + '?game=' + encodeURIComponent(current.title);
    try {
      var probe = await fetch(url, { method: 'HEAD' });
      if (!probe.ok) {
        showToast('Chưa Có Bản Chơi Web', 'Game "' + current.title + '" chưa có bản chơi trực tiếp trên trình duyệt.', false);
        return;
      }
    } catch (e) {}

    var tab = window.open(url, '_blank', 'noopener,noreferrer');
    if (tab) {
      showToast('Khởi Động Game 🎮', 'Đang mở ' + current.title + ' trong tab mới...');
    } else {
      showToast('Trình Duyệt Chặn Pop-up', 'Vui lòng cho phép mở tab mới để chơi ' + current.title + '.', false);
    }
  };

  function selectCard(card, cards) {
    cards.forEach(function (c) {
      c.classList.remove('bg-surface-container', 'border-brand-purple/50', 'shadow-[0_0_15px_rgba(157,78,221,0.2)]');
      c.classList.add('bg-surface-container-low', 'border-outline-variant/10');
    });
    card.classList.remove('bg-surface-container-low', 'border-outline-variant/10');
    card.classList.add('bg-surface-container', 'border-brand-purple/50', 'shadow-[0_0_15px_rgba(157,78,221,0.2)]');
    var title = card.querySelector('h3').textContent.trim();
    var slug = card.dataset.slug || slugifyTitle(title);
    var profile = gameProfile(slug, title);
    current = {
      title: title,
      slug: slug,
      cover: card.dataset.cover || '',
      key: card.dataset.key || makeKey(title, slug),
      size: profile.size,
      week: profile.week
    };
    var h = document.getElementById('banner-title'); if (h) h.textContent = current.title;
    var p = document.getElementById('banner-desc');
    if (p) p.textContent = 'Game đã được kích hoạt trong kho của bạn. Bấm CHƠI NGAY để mở trực tiếp "' + current.title + '" trong tab mới.';
    var img = card.querySelector('img'), bi = document.getElementById('banner-img');
    if (bi) {
      if (current.cover) { bi.src = current.cover; bi.style.visibility = 'visible'; }
      else if (img) { bi.src = img.src; bi.style.visibility = 'visible'; }
      else { bi.style.visibility = 'hidden'; }
    }
    setKey(current.key);
    renderPlaytime();
    renderDrive();
  }

  function initLibrary() {
    var list = document.getElementById('owned-games-list');
    if (!list) return;
    if (G5.isApiMode() && !window.__g5ApiLibraryLoaded) {
      window.__g5ApiLibraryLoaded = true;
      G5.getLibrary().then(function (games) {
        window.__g5ApiOwnedOrders = games.map(function (g) { return [g.id, new Date(g.acquired_at).toLocaleDateString('vi-VN'), g.title, 'digital', 0, 3, g.slug, g.cover_url]; });
        initLibrary();
      }).catch(function () { window.__g5ApiLibraryLoaded = false; showToast('Không tải được thư viện', 'Hãy kiểm tra kết nối API.', false); });
      return;
    }

    var emptyList = document.getElementById('owned-games-empty');
    var detailPanel = document.getElementById('library-game-details');
    var emptyPanel = document.getElementById('library-empty-state');
    var storageStats = document.getElementById('library-storage-stats');
    var count = document.getElementById('owned-count');

    // Always rebuild from actual digital-game orders; never preload demo-owned games.
    list.querySelectorAll('.game-select-card').forEach(function (card) { card.remove(); });
    var storedOrders = window.__g5ApiOwnedOrders || (window.G5 && typeof G5.getOrders === 'function' ? G5.getOrders() : []);
    var orders = Array.isArray(storedOrders) ? storedOrders : [];
    var unique = Object.create(null);
    var owned = orders.filter(function (order) {
      if (!Array.isArray(order) || order[3] !== 'digital' || !order[2]) return false;
      var title = String(order[2]).trim();
      if (!title || unique[title]) return false;
      unique[title] = true;
      return true;
    });

    if (count) count.textContent = String(owned.length);
    if (emptyList) emptyList.classList.toggle('hidden', owned.length > 0);

    if (!owned.length) {
      if (detailPanel) detailPanel.classList.add('hidden');
      if (emptyPanel) emptyPanel.classList.remove('hidden');
      if (storageStats) storageStats.classList.add('hidden');
      var banner = document.getElementById('banner-img');
      if (banner) banner.style.visibility = 'hidden';
      return;
    }

    owned.forEach(function (order) {
      var title = String(order[2]).trim();
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'game-select-card w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 cursor-pointer transition-all flex items-center gap-3 text-left';
      card.dataset.game = 'order-' + String(order[0] || title);
      card.dataset.slug = order[6] || slugifyTitle(title);
      card.dataset.cover = order[7] || '';
      card.dataset.key = '';

      var cover = document.createElement('span');
      cover.className = 'grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-brand-purple/20 bg-gradient-to-br from-brand-purple to-secondary-container text-white';
      cover.setAttribute('aria-hidden', 'true');
      cover.innerHTML = '<span class="material-symbols-outlined text-2xl">sports_esports</span>';

      var info = document.createElement('span');
      info.className = 'min-w-0 flex-1';
      var head = document.createElement('span');
      head.className = 'flex items-center justify-between gap-2';
      var name = document.createElement('h3');
      name.className = 'block truncate text-xs font-bold text-on-surface';
      name.textContent = title;
      var statusDot = document.createElement('span');
      statusDot.className = 'h-2 w-2 shrink-0 rounded-full bg-brand-neon';
      statusDot.setAttribute('aria-label', 'Đã sở hữu');
      head.appendChild(name);
      head.appendChild(statusDot);
      var orderDetail = document.createElement('span');
      orderDetail.className = 'mt-1 block truncate text-[11px] text-on-surface-variant';
      orderDetail.textContent = 'Bản quyền kỹ thuật số' + (order[1] ? ' • Mua ngày ' + String(order[1]) : '');
      var ready = document.createElement('span');
      ready.className = 'mt-1.5 inline-flex rounded bg-brand-purple/20 px-2 py-0.5 text-[10px] font-semibold text-secondary';
      ready.textContent = 'Đã thêm vào kho · ' + gameProfile(card.dataset.slug, title).size + ' GB';
      info.appendChild(head);
      info.appendChild(orderDetail);
      info.appendChild(ready);
      card.appendChild(cover);
      card.appendChild(info);
      list.appendChild(card);
    });

    if (detailPanel) detailPanel.classList.remove('hidden');
    if (emptyPanel) emptyPanel.classList.add('hidden');
    if (storageStats) storageStats.classList.remove('hidden');

    var cards = Array.prototype.slice.call(list.querySelectorAll('.game-select-card'));
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        selectCard(card, cards);
        showToast('Game Đã Chọn', 'Đang xem thông tin: ' + current.title);
      });
    });

    // Open the first actually-owned game, not a hard-coded demo title.
    bindLibraryControls();
    selectCard(cards[0], cards);
  }

  /* ---------------- CỘNG ĐỒNG MOD THEO TỪNG GAME ---------------- */
  var MODS = {
    'hollow-knight': [['Hallownest Visual Refresh','CinderMoth','Gợi ý tinh chỉnh màu sắc và hiệu ứng hình ảnh.','18 MB',4.8,1240,'ĐỒ HỌA'],['Knight Challenge Routes','PaleArchivist','Tổng hợp thử thách và lộ trình chơi lại.','6 MB',4.6,420,'LỐI CHƠI']],
    'hollow-knight-silksong': [['Pharloom UI Concepts','SilkThread','Bộ ý tưởng giao diện và biểu tượng cộng đồng.','12 MB',4.7,680,'GIAO DIỆN'],['Hornet Practice Notes','NeedleWorks','Gợi ý luyện tập và thiết lập điều khiển.','4 MB',4.5,310,'LỐI CHƠI']],
    'elden-ring': [['Lands Between Visual Preset','GraceLight','Thiết lập hình ảnh cộng đồng cho bản PC.','180 MB',4.6,1490,'ĐỒ HỌA'],['Tarnished Challenge Pack','RoundtableLab','Ý tưởng thử thách cho lượt chơi mới.','12 MB',4.4,1105,'LỐI CHƠI']],
    'sekiro-shadows-die-twice': [['Ashina Visual Preset','SculptorsRest','Thiết lập màu sắc và độ tương phản cho bản PC.','95 MB',4.6,730,'ĐỒ HỌA'],['Shinobi Training Notes','KuroFiles','Tổng hợp thử thách luyện đỡ đòn và phản công.','3 MB',4.7,510,'LỐI CHƠI']],
    'black-myth-wukong': [['Cinematic Photo Mode Ideas','MonkeyKingPH','Gợi ý khung hình và thiết lập chụp ảnh.','32 MB',4.7,1760,'ĐỒ HỌA'],['Journey Challenge Pack','StaffMaster','Ý tưởng thử thách cộng đồng cho hành trình Tây Du.','8 MB',4.5,810,'LỐI CHƠI']]
  };

  function initMods() {
    var bar = document.getElementById('mod-game-bar'), grid = document.getElementById('mod-grid');
    if (!bar || !grid || !window.G5) return;
    var spot = document.getElementById('section-mod');
    if (spot) spot.classList.add('hidden'); // Ẩn workshop Cyberpunk mẫu cũ.
    grid.replaceChildren(Object.assign(document.createElement('p'), {className:'col-span-full text-sm text-on-surface-variant',textContent:'Đang tải game kỹ thuật số…'}));
    G5.api('/products?type=digital&limit=100').then(function (data) {
      var games = (data.products || []).filter(function (game) { return game.product_type === 'digital'; });
      if (!games.length) { bar.replaceChildren(); grid.innerHTML='<p class="col-span-full rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 text-sm text-on-surface-variant">Chưa có game kỹ thuật số trong catalog. Game vật lý không được hỗ trợ mod.</p>'; return; }
      var requested = new URLSearchParams(location.search).get('game');
      var selected = games.some(function (g) { return g.slug === requested; }) ? requested : games[0].slug;
      bar.replaceChildren();
      games.forEach(function (game) {
        var a=document.createElement('a');a.href='mods.html?game='+encodeURIComponent(game.slug);a.className='flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all '+(game.slug===selected?'active-nav-tab':'inactive-nav-tab');a.textContent=game.title;bar.appendChild(a);
      });
      var game=games.find(function (g) { return g.slug===selected; }), mods=MODS[selected]||[];
      document.getElementById('mod-grid-title').textContent='Mod dành cho '+game.title+' · Bản kỹ thuật số';
      grid.replaceChildren();
      if (!mods.length) { grid.innerHTML='<p class="col-span-full rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 text-sm text-on-surface-variant">Mod cho game này đang được cập nhật.</p>'; return; }
      mods.forEach(function (m,i) {
        var card=document.createElement('article');card.className='bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20 hover:border-brand-purple/50 transition-all flex flex-col gap-3';
        var heading=document.createElement('div');heading.className='flex items-start justify-between gap-2';var title=document.createElement('h3');title.className='text-sm font-bold text-white leading-snug';title.textContent=m[0];var tag=document.createElement('span');tag.className='text-[10px] font-bold px-2 py-1 rounded-full bg-brand-purple/20 text-brand-neon whitespace-nowrap';tag.textContent=m[6];heading.append(title,tag);
        var desc=document.createElement('p');desc.className='text-xs text-on-surface-variant leading-relaxed flex-1';desc.textContent=m[2];var author=document.createElement('p');author.className='text-[11px] text-outline';author.textContent='Tác giả minh họa: '+m[1]+' · '+m[3];
        var foot=document.createElement('div');foot.className='flex items-center justify-between gap-2';var rating=document.createElement('span');rating.className='text-xs text-on-surface-variant';rating.textContent='★ '+m[4]+' · '+m[5].toLocaleString('vi-VN')+' lượt tải mẫu';var button=document.createElement('button');button.type='button';button.disabled=true;button.title='Chức năng tải mod chưa được kết nối';button.className='px-4 py-2 rounded-full bg-surface-container text-outline text-xs font-bold cursor-not-allowed';button.textContent='Sắp có';foot.append(rating,button);card.append(heading,desc,author,foot);grid.appendChild(card);
      });
    }).catch(function(){bar.replaceChildren();grid.innerHTML='<p class="col-span-full rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-100">Không tải được danh sách game. Hãy kiểm tra API rồi tải lại trang.</p>';});
  }

  window.initHub = function () { initLibrary(); initMods(); };
})();
