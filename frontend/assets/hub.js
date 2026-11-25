/* 5GUYS - hub.js: logic dùng chung cho library.html, rental.html, mods.html */

    // Quick Toast Dispatcher (dong bo Light & Dark Mode chuan tuong phan WCAG AA)
    window.showToast = function (title, message, isSuccess = true) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `g5-toast-item ${isSuccess ? 'is-success' : 'is-error'} p-4 rounded-2xl flex items-center gap-3 transition-all transform duration-300 translate-y-2 pointer-events-auto min-w-[280px] max-w-sm`;
      const ic = document.createElement('span');
      ic.className = `material-symbols-outlined ${isSuccess ? 'text-emerald-400' : 'text-red-400'} text-2xl shrink-0`;
      ic.textContent = isSuccess ? 'check_circle' : 'error';
      const box = document.createElement('div');
      box.className = 'flex flex-col gap-0.5 min-w-0';
      const tEl = document.createElement('span');
      tEl.className = 'g5-toast-title text-xs font-bold leading-snug';
      tEl.textContent = String(title || '');
      const mEl = document.createElement('span');
      mEl.className = 'g5-toast-body text-[11px] leading-snug';
      mEl.textContent = String(message || '');
      box.append(tEl, mEl);
      toast.append(ic, box);
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
    var d = currentDrive(), bonus = current.patchSizeGb || 0;
    var used = Math.round(Math.min(d.total, (d.total - d.free) + bonus) * 10) / 10;
    var free = Math.round(Math.max(0, d.free - bonus) * 10) / 10;
    var size = Math.round((current.size || 0) * 10) / 10;
    var $ = function (id) { return document.getElementById(id); };
    if (!$('drive-name')) return;
    $('drive-name').textContent = d.name;
    $('drive-usage').textContent = used + ' GB / ' + d.total + ' GB';
    $('drive-free').textContent = 'Trống ' + free + ' GB';
    $('drive-speed').textContent = 'Tốc độ đọc ngẫu nhiên: ' + d.speed;
    var gamePct = Math.min(size, used) / d.total * 100;
    $('drive-bar-used').style.width = Math.max(0, (used / d.total * 100) - gamePct) + '%';
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
    'neon-viper': 'games/neon-viper.html',
    'black-myth-wukong': 'games/black-myth.html',
    'black-myth': 'games/black-myth.html',
    'hollow-knight': 'games/hollow-knight.html',
    'hollow-knight-silksong': 'games/hollow-knight.html'
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

  var current = {
    productId: null, title: '', slug: '', cover: '', key: '',
    baseSize: 0, patchSizeGb: 0, size: 0, week: null,
    installedVersion: '1.0.0', dlcInstalled: false, patches: [], cardEl: null
  };
  var realKey = '', keyVisible = false, isPatching = false;

  function normVer(v) {
    return String(v || '1.0.0').trim().replace(/^[vV]/, '').replace(/-.*$/, '') || '1.0.0';
  }
  function fmtVer(v) {
    return 'v' + normVer(v);
  }
  function cmpVer(a, b) {
    var pa = normVer(a).split('.').map(function (n) { return parseInt(n, 10) || 0; });
    var pb = normVer(b).split('.').map(function (n) { return parseInt(n, 10) || 0; });
    var len = Math.max(pa.length, pb.length, 3), i;
    for (i = 0; i < len; i++) {
      var av = pa[i] || 0, bv = pb[i] || 0;
      if (av < bv) return -1;
      if (av > bv) return 1;
    }
    return 0;
  }
  function defaultDemoPatches(title) {
    return [
      {
        version: 'v1.2.0',
        title: 'Bản vá v1.2.0: Tối ưu Hiệu năng & DirectStorage',
        patch_notes: '• Tăng 15% độ ổn định FPS ở độ phân giải 2K/4K\n• Cải thiện tốc độ tải NVMe DirectStorage và đồng bộ Cloud Saves.',
        size_mb: 420,
        is_dlc: false
      },
      {
        version: 'v1.2.0',
        title: 'Gói Mở Rộng DLC: ' + (title || 'Game') + ' - Special Edition',
        patch_notes: '• Mở khóa chế độ thử thách Boss Rush & trang bị đặc biệt 5GUYS Edition.',
        size_mb: 1850,
        is_dlc: true
      }
    ];
  }
  function readDemoPatchState(slug) {
    try {
      var map = JSON.parse(localStorage.getItem('5guys_patch_state_' + accountSeed()) || '{}');
      return map[slug] || { installed_version: '1.0.0', dlc_installed: false };
    } catch (e) { return { installed_version: '1.0.0', dlc_installed: false }; }
  }
  function writeDemoPatchState(slug, installedVersion, dlcInstalled) {
    try {
      var key = '5guys_patch_state_' + accountSeed();
      var map = JSON.parse(localStorage.getItem(key) || '{}');
      map[slug] = { installed_version: installedVersion, dlc_installed: !!dlcInstalled };
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {}
  }
  function patchMetaForCurrent() {
    var patches = Array.isArray(current.patches) && current.patches.length
      ? current.patches
      : defaultDemoPatches(current.title);
    var latestRaw = '1.0.0';
    var hasDlc = false;
    var patchMb = 0;
    var dlcMb = 0;
    patches.forEach(function (pt) {
      if (cmpVer(latestRaw, pt.version) < 0) latestRaw = normVer(pt.version);
      if (pt.is_dlc) { hasDlc = true; dlcMb += Number(pt.size_mb || 0); }
      else { patchMb += Number(pt.size_mb || 0); }
    });
    if (cmpVer(latestRaw, '1.0.0') <= 0) latestRaw = '1.2.0';
    var installedMb = (cmpVer(current.installedVersion, latestRaw) >= 0 ? patchMb : 0) + (current.dlcInstalled ? dlcMb : 0);
    var bonusGb = installedMb > 0 ? Math.max(0.5, Math.round((installedMb / 1024) * 10) / 10) : 0;
    return { patches: patches, latestRaw: latestRaw, hasDlc: hasDlc, patchMb: patchMb, dlcMb: dlcMb, bonusGb: bonusGb };
  }
  function syncCurrentSizeAndBadge() {
    var meta = patchMetaForCurrent();
    current.patchSizeGb = meta.bonusGb;
    current.size = Math.round((current.baseSize + meta.bonusGb) * 10) / 10;
    if (current.cardEl) {
      var badge = current.cardEl.querySelector('[data-size-badge]');
      if (badge) badge.textContent = 'Đã thêm vào kho · ' + current.size + ' GB';
    }
  }
  function renderAutoPatcher() {
    var box = document.getElementById('auto-patcher-box');
    if (!box) return;
    var meta = patchMetaForCurrent();
    var instEl = document.getElementById('game-installed-ver');
    var latEl = document.getElementById('game-latest-ver');
    var dlcBadge = document.getElementById('game-dlc-badge');
    var notesEl = document.getElementById('patch-notes-summary');
    var btn = document.getElementById('btn-update-patch');

    if (instEl) instEl.textContent = fmtVer(current.installedVersion);
    if (latEl) latEl.textContent = fmtVer(meta.latestRaw);

    if (dlcBadge) {
      if (meta.hasDlc && current.dlcInstalled) {
        dlcBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        dlcBadge.textContent = '✔ Đã cài đặt DLC';
      } else if (meta.hasDlc) {
        dlcBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-purple/20 text-brand-neon border border-brand-purple/40';
        dlcBadge.textContent = 'DLC khả dụng';
      } else {
        dlcBadge.className = 'hidden';
      }
    }

    if (notesEl) {
      notesEl.replaceChildren();
      meta.patches.slice(0, 3).forEach(function (pt, idx) {
        var row = document.createElement('div');
        row.className = idx > 0 ? 'pt-1.5 border-t border-outline-variant/15' : '';
        var head = document.createElement('div');
        head.className = 'flex flex-wrap items-center justify-between gap-2';
        var left = document.createElement('span');
        left.className = 'font-bold text-white flex items-center gap-1.5';
        var tag = document.createElement('span');
        tag.className = 'px-1.5 py-0.5 rounded text-[10px] font-bold ' + (pt.is_dlc ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-brand-purple/20 text-brand-neon border border-brand-purple/30');
        tag.textContent = pt.is_dlc ? 'DLC' : 'PATCH';
        left.append(tag, document.createTextNode(' ' + pt.title));
        var sz = document.createElement('span');
        sz.className = 'text-[11px] font-mono text-outline';
        sz.textContent = fmtVer(pt.version) + ' · ' + (pt.size_mb || 150) + ' MB';
        head.append(left, sz);
        var notes = document.createElement('p');
        notes.className = 'text-[11px] text-on-surface-variant whitespace-pre-line mt-1 leading-relaxed';
        notes.textContent = pt.patch_notes;
        row.append(head, notes);
        notesEl.appendChild(row);
      });
    }

    var needsUpdate = cmpVer(current.installedVersion, meta.latestRaw) < 0 || (meta.hasDlc && !current.dlcInstalled);
    if (btn) {
      if (needsUpdate) {
        btn.disabled = false;
        btn.className = 'px-4 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-neon hover:opacity-95 text-white text-xs font-bold shadow-[0_0_16px_rgba(157,78,221,0.5)] transition-all flex items-center gap-1.5 cursor-pointer';
        btn.innerHTML = '<span class="material-symbols-outlined text-base">download</span><span>' + (meta.hasDlc ? 'Cập nhật Bản vá & DLC' : 'Cập nhật Bản vá') + '</span>';
      } else {
        btn.disabled = true;
        btn.className = 'px-4 py-2 rounded-xl bg-surface-container text-emerald-300 text-xs font-bold border border-emerald-500/35 flex items-center gap-1.5 cursor-default';
        btn.textContent = '✓ Đã ở phiên bản mới nhất';
      }
    }
  }

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

    var checkPatchBtn = document.getElementById('btn-check-patch');
    if (checkPatchBtn) {
      checkPatchBtn.addEventListener('click', async function () {
        if (isPatching) return;
        if (G5.isApiMode()) {
          checkPatchBtn.disabled = true;
          try {
            var games = await G5.getLibrary();
            var map = Object.create(null);
            games.forEach(function (g) {
              map[String(g.product_id)] = g;
              if (g.slug) map[g.slug] = g;
            });
            window.__g5ApiLibraryMap = map;
            var hit = map[String(current.productId)] || map[current.slug];
            if (hit) {
              current.installedVersion = hit.installed_version || '1.0.0';
              current.dlcInstalled = !!hit.dlc_installed;
              current.patches = Array.isArray(hit.patches) ? hit.patches : [];
              syncCurrentSizeAndBadge();
              renderDrive();
            }
            renderAutoPatcher();
            showToast('Đã Kiểm Tra Máy Chủ 5GUYS', 'Dữ liệu bản vá và DLC cho ' + current.title + ' đã được đồng bộ.');
          } catch (err) {
            showToast('Không thể kiểm tra bản vá', G5.errorText(err), false);
          } finally {
            checkPatchBtn.disabled = false;
          }
        } else {
          renderAutoPatcher();
          showToast('Đã Kiểm Tra Bản Vá', 'Phiên bản mới nhất cho ' + current.title + ' là ' + fmtVer(patchMetaForCurrent().latestRaw) + '.');
        }
      });
    }

    var updatePatchBtn = document.getElementById('btn-update-patch');
    if (updatePatchBtn) {
      updatePatchBtn.addEventListener('click', function () {
        if (isPatching || !current.title) return;
        var meta = patchMetaForCurrent();
        var needsUpdate = cmpVer(current.installedVersion, meta.latestRaw) < 0 || (meta.hasDlc && !current.dlcInstalled);
        if (!needsUpdate) return;

        isPatching = true;
        updatePatchBtn.disabled = true;
        var pBar = document.getElementById('patch-progress-bar');
        var pFill = document.getElementById('patch-progress-fill');
        var pPct = document.getElementById('patch-progress-pct');
        var pLbl = document.getElementById('patch-progress-label');
        var drive = currentDrive();
        if (pBar) pBar.classList.remove('hidden');
        if (pFill) pFill.style.width = '0%';
        if (pPct) pPct.textContent = '0%';
        if (pLbl) pLbl.textContent = 'Đang tải & ghi vào ' + drive.name + ' (' + drive.speed + ')...';

        var duration = 1800, startAt = Date.now();
        var timer = setInterval(async function () {
          var elapsed = Date.now() - startAt;
          var pct = Math.min(100, Math.round((elapsed / duration) * 100));
          if (pFill) pFill.style.width = pct + '%';
          if (pPct) pPct.textContent = pct + '%';
          if (pct < 100) return;

          clearInterval(timer);
          try {
            if (G5.isApiMode() && current.productId) {
              var res = await G5.api('/library/' + current.productId + '/update', {
                method: 'POST',
                body: {
                  targetVersion: meta.latestRaw,
                  installDlc: meta.hasDlc ? true : undefined
                }
              });
              current.installedVersion = res.installed_version || meta.latestRaw;
              current.dlcInstalled = res.dlc_installed !== undefined ? !!res.dlc_installed : meta.hasDlc;
              var libMap = window.__g5ApiLibraryMap || {};
              var entry = libMap[String(current.productId)] || libMap[current.slug];
              if (entry) {
                entry.installed_version = current.installedVersion;
                entry.dlc_installed = current.dlcInstalled;
              }
            } else {
              current.installedVersion = meta.latestRaw;
              current.dlcInstalled = meta.hasDlc;
              writeDemoPatchState(current.slug, current.installedVersion, current.dlcInstalled);
            }
            syncCurrentSizeAndBadge();
            renderDrive();
            renderAutoPatcher();
            if (pBar) setTimeout(function () { if (!isPatching) pBar.classList.add('hidden'); }, 350);
            showToast(
              'Cập Nhật Hoàn Tất ✨',
              'Đã cài đặt bản vá ' + fmtVer(meta.latestRaw) + (meta.hasDlc ? ' và kích hoạt DLC' : '') + ' thành công!'
            );
          } catch (err) {
            if (pBar) pBar.classList.add('hidden');
            renderAutoPatcher();
            showToast('Cập Nhật Thất Bại', G5.errorText(err), false);
          } finally {
            isPatching = false;
          }
        }, 45);
      });
    }

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
    var productId = card.dataset.productId ? Number(card.dataset.productId) : null;
    var profile = gameProfile(slug, title);
    var libMap = window.__g5ApiLibraryMap || {};
    var apiInfo = (productId && libMap[String(productId)]) || libMap[slug] || null;
    var demoState = !apiInfo ? readDemoPatchState(slug) : null;

    current = {
      productId: productId || (apiInfo && apiInfo.product_id) || null,
      title: title,
      slug: slug,
      cover: card.dataset.cover || '',
      key: card.dataset.key || makeKey(title, slug),
      baseSize: profile.size,
      patchSizeGb: 0,
      size: profile.size,
      week: profile.week,
      installedVersion: apiInfo ? (apiInfo.installed_version || '1.0.0') : (demoState.installed_version || '1.0.0'),
      dlcInstalled: apiInfo ? !!apiInfo.dlc_installed : !!demoState.dlc_installed,
      patches: apiInfo && Array.isArray(apiInfo.patches) ? apiInfo.patches : [],
      cardEl: card
    };
    syncCurrentSizeAndBadge();
    var pBar = document.getElementById('patch-progress-bar');
    if (pBar && !isPatching) pBar.classList.add('hidden');

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
    renderAutoPatcher();
  }

  function initLibrary() {
    var list = document.getElementById('owned-games-list');
    if (!list) return;
    if (G5.isApiMode() && !window.__g5ApiLibraryLoaded) {
      window.__g5ApiLibraryLoaded = true;
      G5.getLibrary().then(function (games) {
        var map = Object.create(null);
        games.forEach(function (g) {
          map[String(g.product_id)] = g;
          if (g.slug) map[g.slug] = g;
        });
        window.__g5ApiLibraryMap = map;
        window.__g5ApiOwnedOrders = games.map(function (g) {
          return [g.id, new Date(g.acquired_at).toLocaleDateString('vi-VN'), g.title, 'digital', 0, 3, g.slug, g.cover_url, g.product_id];
        });
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

    var libMap = window.__g5ApiLibraryMap || {};
    owned.forEach(function (order) {
      var title = String(order[2]).trim();
      var slug = order[6] || slugifyTitle(title);
      var pid = order[8] || null;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'game-select-card w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 cursor-pointer transition-all flex items-center gap-3 text-left';
      card.dataset.game = 'order-' + String(order[0] || title);
      card.dataset.slug = slug;
      card.dataset.cover = order[7] || '';
      card.dataset.key = '';
      if (pid) card.dataset.productId = String(pid);

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
      var apiInfo = (pid && libMap[String(pid)]) || libMap[slug] || null;
      var baseGb = gameProfile(slug, title).size;
      var ready = document.createElement('span');
      ready.setAttribute('data-size-badge', '');
      ready.className = 'mt-1.5 inline-flex rounded bg-brand-purple/20 px-2 py-0.5 text-[10px] font-semibold text-secondary';
      ready.textContent = 'Đã thêm vào kho · ' + baseGb + ' GB';
      info.appendChild(head);
      info.appendChild(orderDetail);
      info.appendChild(ready);
      card.appendChild(cover);
      card.appendChild(info);
      list.appendChild(card);

      if (apiInfo && (apiInfo.dlc_installed || cmpVer(apiInfo.installed_version || '1.0.0', '1.2.0') >= 0)) {
        var extraMb = (apiInfo.patches || []).reduce(function (s, pt) {
          if (pt.is_dlc && !apiInfo.dlc_installed) return s;
          if (!pt.is_dlc && cmpVer(apiInfo.installed_version || '1.0.0', pt.version) < 0) return s;
          return s + Number(pt.size_mb || 0);
        }, 0);
        if (extraMb > 0) {
          var bonusGb = Math.max(0.5, Math.round((extraMb / 1024) * 10) / 10);
          ready.textContent = 'Đã thêm vào kho · ' + (Math.round((baseGb + bonusGb) * 10) / 10) + ' GB';
        }
      }
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

  function fallbackModsFor(slug) {
    return (MODS[slug] || []).map(function (m) {
      return {
        id: null,
        product_slug: slug,
        title: m[0],
        author_name: m[1],
        description: m[2],
        size_label: m[3],
        rating: m[4],
        downloads_count: m[5],
        category: m[6],
        version: 'v1.0',
      };
    });
  }

  function triggerModManifestDownload(mod, fallbackSlug) {
    var slug = String(mod.product_slug || fallbackSlug || 'game').replace(/[^a-zA-Z0-9_-]/g, '-');
    var ver = String(mod.version || 'v1.0').replace(/[^a-zA-Z0-9._-]/g, '_');
    var filename = '5GUYS_Mod_' + slug + '_' + ver + '.json';
    var manifest = {
      platform: '5GUYS Game Store',
      modId: mod.id || null,
      productSlug: mod.product_slug || fallbackSlug || slug,
      productTitle: mod.product_title || '',
      title: mod.title,
      category: mod.category,
      version: mod.version || 'v1.0',
      author: mod.author_name || 'Cộng đồng 5GUYS',
      size: mod.size_label || '15 MB',
      downloadsCount: Number(mod.downloads_count || 0),
      description: mod.description || '',
      downloadedAt: new Date().toISOString()
    };
    try {
      var blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {}
    return filename;
  }

  var modModalBound = false;
  function initMods() {
    var bar = document.getElementById('mod-game-bar'), grid = document.getElementById('mod-grid');
    if (!bar || !grid || !window.G5) return;
    var spot = document.getElementById('section-mod');
    if (spot) spot.classList.add('hidden'); // Ẩn workshop Cyberpunk mẫu cũ.
    grid.replaceChildren(Object.assign(document.createElement('p'), { className: 'col-span-full text-sm text-on-surface-variant', textContent: 'Đang tải game kỹ thuật số…' }));

    var games = [];
    var selected = '';

    function renderGameTabs() {
      bar.replaceChildren();
      games.forEach(function (game) {
        var a = document.createElement('a');
        a.href = 'mods.html?game=' + encodeURIComponent(game.slug);
        a.className = 'flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ' + (game.slug === selected ? 'active-nav-tab' : 'inactive-nav-tab');
        a.textContent = game.title;
        bar.appendChild(a);
      });
    }

    function renderModCards(mods, game) {
      document.getElementById('mod-grid-title').textContent = 'Mod dành cho ' + game.title + ' · Bản kỹ thuật số';
      grid.replaceChildren();
      if (!mods.length) {
        var empty = document.createElement('p');
        empty.className = 'col-span-full rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 text-sm text-on-surface-variant';
        empty.textContent = 'Chưa có bản Mod nào cho game này. Hãy nhấn "+ Đăng tải Bản Mod" để chia sẻ bản Mod đầu tiên!';
        grid.appendChild(empty);
        return;
      }
      mods.forEach(function (m) {
        var card = document.createElement('article');
        card.className = 'bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20 hover:border-brand-purple/50 transition-all flex flex-col gap-3';

        var heading = document.createElement('div');
        heading.className = 'flex items-start justify-between gap-2';
        var title = document.createElement('h3');
        title.className = 'text-sm font-bold text-white leading-snug';
        title.textContent = m.title;
        var tag = document.createElement('span');
        tag.className = 'text-[10px] font-bold px-2 py-1 rounded-full bg-brand-purple/20 text-brand-neon whitespace-nowrap';
        tag.textContent = m.category || 'LỐI CHỌI';
        heading.append(title, tag);

        var desc = document.createElement('p');
        desc.className = 'text-xs text-on-surface-variant leading-relaxed flex-1 whitespace-pre-line';
        desc.textContent = m.description;

        var author = document.createElement('p');
        author.className = 'text-[11px] text-outline';
        author.textContent = 'Tác giả: ' + (m.author_name || 'Cộng đồng') + ' · ' + (m.version || 'v1.0') + ' · ' + (m.size_label || '15 MB');

        var foot = document.createElement('div');
        foot.className = 'flex items-center justify-between gap-2 pt-1';

        var rating = document.createElement('span');
        rating.className = 'text-xs text-on-surface-variant';
        var dlCount = document.createElement('span');
        dlCount.textContent = Number(m.downloads_count || 0).toLocaleString('vi-VN');
        rating.append(
          document.createTextNode('★ ' + Number(m.rating || 4.8).toFixed(1) + ' · '),
          dlCount,
          document.createTextNode(' lượt tải')
        );

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'px-4 py-2 rounded-full bg-brand-purple hover:bg-brand-dark text-white text-xs font-bold cursor-pointer transition-all shadow-[0_0_12px_rgba(124,58,237,0.4)]';
        button.textContent = 'Tải Mod';

        button.addEventListener('click', async function () {
          if (!G5.requireLogin('Vui lòng đăng nhập để tải bản Mod này.')) return;
          if (G5.isApiMode() && m.id) {
            button.disabled = true;
            try {
              var res = await G5.api('/mods/' + m.id + '/download', { method: 'POST' });
              var info = (res && res.mod) ? res.mod : m;
              m.downloads_count = Number(info.downloads_count || (Number(m.downloads_count || 0) + 1));
              dlCount.textContent = m.downloads_count.toLocaleString('vi-VN');
              var file = triggerModManifestDownload(info, game.slug);
              showToast('Đang Tải Bản Mod 🚀', 'Đang tải ' + info.title + ' (' + (info.version || 'v1.0') + ' · ' + (info.size_label || '15 MB') + ') — ' + file);
            } catch (err) {
              showToast('Không thể tải bản Mod', G5.errorText(err), false);
            } finally {
              button.disabled = false;
            }
          } else {
            m.downloads_count = Number(m.downloads_count || 0) + 1;
            dlCount.textContent = m.downloads_count.toLocaleString('vi-VN');
            var offlineFile = triggerModManifestDownload(m, game.slug);
            showToast('Đang Tải Bản Mod 🚀', 'Đang tải ' + m.title + ' (' + (m.version || 'v1.0') + ') — ' + offlineFile);
          }
        });

        foot.append(rating, button);
        card.append(heading, desc, author, foot);
        grid.appendChild(card);
      });
    }

    function loadModsForGame(slug) {
      var game = games.find(function (g) { return g.slug === slug; }) || games[0];
      if (!game) return;
      selected = game.slug;
      renderGameTabs();
      grid.replaceChildren(Object.assign(document.createElement('p'), { className: 'col-span-full text-sm text-on-surface-variant', textContent: 'Đang tải danh sách bản Mod…' }));
      G5.api('/mods?slug=' + encodeURIComponent(selected)).then(function (res) {
        renderModCards(res.mods || [], game);
      }).catch(function () {
        renderModCards(fallbackModsFor(selected), game);
      });
    }

    function bindUploadModal() {
      if (modModalBound) return;
      modModalBound = true;
      var openBtn = document.getElementById('btn-open-upload-mod');
      var modal = document.getElementById('modal-upload-mod');
      var form = document.getElementById('form-upload-mod');
      var closeBtn = document.getElementById('mod-up-close');
      var cancelBtn = document.getElementById('mod-up-cancel');
      var gameSelect = document.getElementById('mod-up-game');
      var errEl = document.getElementById('mod-up-error');
      var submitBtn = document.getElementById('mod-up-submit');
      if (!openBtn || !modal || !form) return;

      function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      function openModal() {
        if (!G5.requireLogin('Vui lòng đăng nhập để đăng tải bản Mod mới.')) return;
        if (!G5.isApiMode()) {
          showToast('Cần kết nối API', 'Vui lòng đăng nhập qua backend API để đăng tải bản Mod.', false);
          return;
        }
        if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }
        if (gameSelect && selected) gameSelect.value = selected;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        var titleInp = document.getElementById('mod-up-title');
        if (titleInp) titleInp.focus();
      }

      openBtn.addEventListener('click', openModal);
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }
        var productSlug = gameSelect ? gameSelect.value : selected;
        var title = document.getElementById('mod-up-title').value.trim();
        var category = document.getElementById('mod-up-category').value;
        var version = document.getElementById('mod-up-version').value.trim();
        var sizeLabel = document.getElementById('mod-up-size').value.trim();
        var description = document.getElementById('mod-up-desc').value.trim();

        if (title.length < 3 || description.length < 10) {
          if (errEl) {
            errEl.textContent = 'Tên bản Mod tối thiểu 3 ký tự và mô tả chi tiết tối thiểu 10 ký tự.';
            errEl.classList.remove('hidden');
          }
          return;
        }
        if (submitBtn) submitBtn.disabled = true;
        try {
          await G5.api('/mods', {
            method: 'POST',
            body: { productSlug: productSlug, title: title, category: category, version: version, sizeLabel: sizeLabel, description: description }
          });
          form.reset();
          document.getElementById('mod-up-version').value = 'v1.0';
          document.getElementById('mod-up-size').value = '25 MB';
          closeModal();
          showToast('Đăng Tải Thành Công 🎉', 'Bản Mod "' + title + '" đã được đăng lên Cộng đồng Mod!');
          if (productSlug && productSlug !== selected) {
            selected = productSlug;
            try {
              var u = new URL(location.href);
              u.searchParams.set('game', selected);
              history.replaceState({}, '', u);
            } catch (err2) {}
          }
          loadModsForGame(selected);
        } catch (err) {
          if (errEl) {
            errEl.textContent = G5.errorText(err);
            errEl.classList.remove('hidden');
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    G5.api('/products?type=digital&limit=100').then(function (data) {
      games = (data.products || []).filter(function (game) {
        return game.product_type === 'digital' || String(game.available_formats || '').indexOf('digital') !== -1;
      });
      if (!games.length) {
        bar.replaceChildren();
        grid.innerHTML = '<p class="col-span-full rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 text-sm text-on-surface-variant">Chưa có game kỹ thuật số trong catalog. Game vật lý không được hỗ trợ mod.</p>';
        return;
      }
      var gameSelect = document.getElementById('mod-up-game');
      if (gameSelect) {
        gameSelect.replaceChildren();
        games.forEach(function (g) {
          var opt = document.createElement('option');
          opt.value = g.slug;
          opt.textContent = g.title;
          gameSelect.appendChild(opt);
        });
      }
      var requested = new URLSearchParams(location.search).get('game');
      selected = games.some(function (g) { return g.slug === requested; }) ? requested : games[0].slug;
      bindUploadModal();
      loadModsForGame(selected);
    }).catch(function () {
      bar.replaceChildren();
      grid.innerHTML = '<p class="col-span-full rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-100">Không tải được danh sách game. Hãy kiểm tra API rồi tải lại trang.</p>';
    });
  }

  window.initHub = function () { initLibrary(); initMods(); };
})();
