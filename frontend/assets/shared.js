/* 5GUYS - shared.js
 * Dùng chung cho mọi trang: trạng thái đăng nhập, giỏ hàng, đơn hàng.
 * Hiện lưu bằng localStorage (demo). Khi có back-end, chỉ cần thay phần
 * đọc/ghi trong các hàm bên dưới bằng lời gọi API (fetch) là các trang giữ nguyên.
 */
(function () {
  var K = { user: '5guys_user', cartPrefix: '5guys_cart_', ordersPrefix: '5guys_orders_', walletPrefix: '5guys_wallet_', redeemedPrefix: '5guys_redeemed_codes_', pointsPrefix: '5guys_points_', pointHistoryPrefix: '5guys_point_history_' };
  var RATE = 25000; // 1 USD (đơn vị giá nội bộ) = 25.000đ, khớp với trang giỏ hàng
  var API_BASE = window.G5_API_BASE || 'http://localhost:3000/api';
  var apiToken = localStorage.getItem('5guys_api_token');
  var apiMode = !!apiToken;
  function api(path, options) {
    options = options || {};
    options.headers = Object.assign({}, options.headers || {}, apiToken ? { Authorization: 'Bearer ' + apiToken } : {});
    if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(options.body); }
    return fetch(API_BASE + path, options).then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { if (!r.ok) throw new Error(data.error || 'api_error'); return data; }); });
  }

  /* ---- Easter egg âm thanh (tự tổng hợp bằng Web Audio, không cần file) ---- */
  var sfxCtx = null;
  function sfx() {
    try {
      if (!sfxCtx) sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (sfxCtx.state === 'suspended') sfxCtx.resume();
    } catch (e) { sfxCtx = null; }
    return sfxCtx;
  }
  // Mở khóa audio ngay ở thao tác đầu tiên, để tiếng phát được cả sau khi gọi API xong
  ['pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, sfx, { capture: true, once: true }); });
  // Tiếng "ăn xu" kiểu 8-bit: 2 nốt sóng vuông B5 -> E6
  function playCoin() {
    var ctx = sfx(); if (!ctx) return;
    var t = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.setValueAtTime(1318.51, t + 0.085);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.005);
    g.gain.setValueAtTime(0.12, t + 0.085);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.6);
  }
  // Tiếng mở giỏ: "cộc" nhẹ của nắp rương + chuỗi chuông lấp lánh đi lên (tìm thấy kho báu)
  function chime(ctx, freq, at, vol, len) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g); g.connect(ctx.destination);
    o.start(at); o.stop(at + len + 0.05);
  }
  function playChest() {
    var ctx = sfx(); if (!ctx) return 0;
    var t = ctx.currentTime;
    var lid = ctx.createOscillator(), lg = ctx.createGain();
    lid.type = 'sine';
    lid.frequency.setValueAtTime(160, t); lid.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    lg.gain.setValueAtTime(0.3, t); lg.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    lid.connect(lg); lg.connect(ctx.destination); lid.start(t); lid.stop(t + 0.2);
    // G5 - B5 - D6 - G6, kèm tiếng vọng nhỏ cho cảm giác lấp lánh
    [783.99, 987.77, 1174.66, 1567.98].forEach(function (f, i) {
      var at = t + 0.08 + i * 0.07;
      chime(ctx, f, at, 0.11, 0.5);
      chime(ctx, f * 2, at + 0.12, 0.025, 0.35);
    });
    return 550;
  }
  // Âm báo nhẹ cho các easter egg khác
  function playSecret() {
    var ctx = sfx(); if (!ctx) return;
    var t = ctx.currentTime;
    [659.25, 830.61, 987.77, 1318.51].forEach(function (f, i) { chime(ctx, f, t + i * 0.09, 0.08, 0.45); });
  }

  function rd(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function accountKey() {
    var u = rd(K.user, null);
    var raw = u && (u.email || u.id || u.name) || 'default';
    return String(raw).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var G5 = window.G5 = {
    RATE: RATE,
    /* ---- Tài khoản ---- */
    requireLogin: function (msg) {
      if (G5.user()) return true;
      G5.promptLogin(msg);
      return false;
    },
    /* Popup yêu cầu đăng nhập / đăng ký (dùng cho khách chưa đăng nhập) */
    promptLogin: function (msg) {
      var page = location.pathname.split('/').pop() || 'index.html';
      var next = encodeURIComponent(page);
      var el = document.getElementById('g5-login-modal');
      if (!el) {
        var st = document.createElement('style');
        st.textContent =
          '#g5-login-modal{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(10,5,18,.78);backdrop-filter:blur(6px)}' +
          '#g5-login-modal.open{display:flex}' +
          '#g5-login-modal .g5-box{position:relative;width:100%;max-width:400px;text-align:center;background:#1a1028;border:1px solid rgba(157,78,221,.5);border-radius:24px;padding:32px 24px 24px;box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 40px rgba(157,78,221,.25);color:#fff;font-family:Inter,sans-serif}' +
          '#g5-login-modal .g5-ic{width:56px;height:56px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:rgba(157,78,221,.2);color:#c77dff;border:1px solid rgba(199,125,255,.4)}' +
          '#g5-login-modal h3{font-size:18px;font-weight:800;margin:0 0 8px}' +
          '#g5-login-modal p{font-size:13px;line-height:1.6;color:#b9aac4;margin:0 0 20px}' +
          '#g5-login-modal .g5-row{display:flex;gap:10px}' +
          '#g5-login-modal .g5-row a{flex:1;padding:11px 12px;border-radius:12px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s}' +
          '#g5-login-modal .g5-primary{background:#9d4edd;color:#fff;box-shadow:0 0 15px rgba(157,78,221,.4)}' +
          '#g5-login-modal .g5-primary:hover{background:#c77dff}' +
          '#g5-login-modal .g5-second{border:1px solid rgba(199,125,255,.5);color:#e0b6ff}' +
          '#g5-login-modal .g5-second:hover{background:rgba(157,78,221,.15)}' +
          '#g5-login-modal .g5-x{position:absolute;top:10px;right:14px;background:none;border:0;color:#9a8aa8;font-size:22px;cursor:pointer;line-height:1}' +
          '#g5-login-modal .g5-x:hover{color:#fff}';
        document.head.appendChild(st);
        el = document.createElement('div');
        el.id = 'g5-login-modal';
        el.innerHTML = '<div class="g5-box" role="dialog" aria-modal="true"><button class="g5-x" type="button" aria-label="Đóng">&times;</button>' +
          '<div class="g5-ic"><i class="fa-solid fa-lock"></i></div><h3>Bạn cần đăng nhập</h3><p data-g5-msg></p>' +
          '<div class="g5-row"><a class="g5-second" data-g5-reg href="register.html">Đăng ký</a><a class="g5-primary" data-g5-login href="login.html">Đăng nhập</a></div></div>';
        document.body.appendChild(el);
        el.addEventListener('click', function (e) { if (e.target === el || e.target.closest('.g5-x')) el.classList.remove('open'); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') el.classList.remove('open'); });
      }
      el.querySelector('[data-g5-msg]').textContent = msg || 'Vui lòng đăng nhập hoặc đăng ký tài khoản để sử dụng tính năng này.';
      el.querySelector('[data-g5-login]').href = 'login.html?next=' + next;
      el.querySelector('[data-g5-reg]').href = 'register.html?next=' + next;
      el.classList.add('open');
    },
    user: function () { return rd(K.user, null); },
    api: api,
    apiBase: API_BASE,
    isApiMode: function () { return apiMode; },
    setApiSession: function (token, user) { apiToken = token; apiMode = true; localStorage.setItem('5guys_api_token', token); wr(K.user, { id: user.id, email: user.email, name: user.displayName || user.name, role: user.role || 'customer' }); document.documentElement.classList.add('is-auth'); },
    login: function (u) { wr(K.user, u); },
    logout: function () { try { localStorage.removeItem(K.user); localStorage.removeItem('5guys_api_token'); apiToken = null; apiMode = false; } catch (e) {} },
    /* ---- Giỏ hàng: mảng [tên, 'digital'|'physical', giá (USD), số lượng] ---- */
    getCart: function () {
      if (!G5.user()) return [];
      if (apiMode) return rd('5guys_api_cart_cache', []);
      var cart = rd(K.cartPrefix + accountKey(), []);
      return Array.isArray(cart) ? cart : [];
    },
    setCart: function (c) {
      if (!G5.user()) return;
      if (apiMode) {
        var old = G5.getCart(), next = Array.isArray(c) ? c : [];
        Promise.all(old.filter(function (x) { return !next.some(function (y) { return y[4] === x[4]; }); }).map(function (x) { return api('/cart/items/' + x[4], { method: 'DELETE' }); }))
        .then(function () { return Promise.all(next.filter(function (x) { var before = old.find(function (y) { return y[4] === x[4]; }); return x[4] && (!before || before[3] !== x[3]); }).map(function (x) { return api('/cart/items', { method: 'PUT', body: { productId: x[4], quantity: x[3] } }); })); })
          .then(function () { wr('5guys_api_cart_cache', next); G5.refresh(); })
          .catch(function () { G5.notify('Không thể cập nhật giỏ hàng qua API.'); });
        return;
      }
      wr(K.cartPrefix + accountKey(), Array.isArray(c) ? c : []);
      G5.refresh();
    },
    add: function (name, kind, usd, qty, productId) {
      if (apiMode) {
        kind = kind || 'digital';
        // Uu tien id san pham (chinh xac ban so / ban dia); neu khong co thi tim theo ten roi chon dung dinh dang
        var findId = productId ? Promise.resolve(Number(productId)) :
          api('/products?q=' + encodeURIComponent(name) + '&type=' + encodeURIComponent(kind)).then(function (data) {
            var product = (data.products || []).find(function (p) { return p.title === name; });
            if (!product) throw new Error('product_not_found');
            return api('/products/' + encodeURIComponent(product.slug)).then(function (d) {
              var f = (d.product.formats || []).find(function (x) { return x.product_type === kind; });
              return f ? f.id : product.id;
            });
          });
        return findId.then(function (id) {
          return api('/cart/items', { method: 'PUT', body: { productId: id, quantity: (qty || 1) } });
        }).then(function () { playCoin(); G5.syncCart(); G5.notify('Đã thêm "' + name + '" (' + (kind === 'digital' ? 'bản số' : 'bản đĩa') + ') vào giỏ hàng.'); })
          .catch(function (err) { G5.notify(G5.errorText(err)); });
      }
      var c = G5.getCart(), i;
      for (i = 0; i < c.length; i++) if (c[i][0] === name) break;
      if (i < c.length) c[i][3] += (qty || 1); else c.push([name, kind || 'digital', usd || 0, qty || 1]);
      G5.setCart(c);
      playCoin();
      return Promise.resolve(c);
    },
    sfx: { coin: playCoin, chest: playChest },
    vnd: function (s) { return parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0; },
    /* ---- Đơn hàng: [mã, ngày, tên, loại, giá, trạng thái(0-3)] ---- */
    getOrders: function () {
      if (!G5.user()) return [];
      if (apiMode) return rd('5guys_api_orders_cache', []);
      var orders = rd(K.ordersPrefix + accountKey(), []);
      return Array.isArray(orders) ? orders : [];
    },
    /* ---- Ví demo: mỗi tài khoản bắt đầu từ 0đ, không dùng số dư mẫu ---- */
    getWallet: function () {
      if (!G5.user()) return 0;
      return Math.max(0, Math.round(Number(rd(K.walletPrefix + accountKey(), 0)) || 0));
    },
    formatVnd: function (amount) { return Math.max(0, Math.round(Number(amount) || 0)).toLocaleString('vi-VN') + ' đ'; },
    getPoints: function () { return G5.user() ? Math.max(0, Number(rd(K.pointsPrefix + accountKey(), 0)) || 0) : 0; },
    getPointHistory: function () { var h = G5.user() ? rd(K.pointHistoryPrefix + accountKey(), []) : []; return Array.isArray(h) ? h : []; },
    addPoints: function (amount, note) {
      if (!G5.user()) return 0;
      amount = Math.max(0, Math.floor(Number(amount) || 0));
      if (!amount) return G5.getPoints();
      var points = G5.getPoints() + amount, key = K.pointHistoryPrefix + accountKey(), history = G5.getPointHistory();
      wr(K.pointsPrefix + accountKey(), points);
      history.unshift([amount, note || 'Điểm từ đơn hàng', new Date().toLocaleDateString('vi-VN')]); wr(key, history);
      return points;
    },
    spendPoints: function (amount, note) {
      amount = Math.max(0, Math.floor(Number(amount) || 0));
      if (!G5.user() || !amount || G5.getPoints() < amount) return false;
      var points = G5.getPoints() - amount, key = K.pointHistoryPrefix + accountKey(), history = G5.getPointHistory();
      wr(K.pointsPrefix + accountKey(), points); history.unshift([-amount, note || 'Đổi ưu đãi', new Date().toLocaleDateString('vi-VN')]); wr(key, history);
      return true;
    },
    setWallet: function (amount) {
      if (!G5.user()) return 0;
      var balance = Math.max(0, Math.round(Number(amount) || 0));
      wr(K.walletPrefix + accountKey(), balance);
      G5.refresh();
      return balance;
    },
    redeemGiftCode: function (code) {
      if (!G5.user()) return { ok: false, reason: 'login' };
      var normalized = String(code || '').trim().toUpperCase();
      var accepted = ['5GUYS-WELCOME', 'CYBER2026', 'MODPASS'];
      if (accepted.indexOf(normalized) === -1) return { ok: false, reason: 'invalid' };
      var key = K.redeemedPrefix + accountKey();
      var redeemed = rd(key, []);
      if (redeemed.indexOf(normalized) !== -1) return { ok: false, reason: 'used' };
      redeemed.push(normalized);
      wr(key, redeemed);
      var balance = G5.setWallet(G5.getWallet() + 50000);
      return { ok: true, balance: balance };
    },
    placeOrder: function (items, options) {
      if (apiMode) return api('/orders', { method: 'POST', body: options || {} });
      if (!G5.user()) return null;
      var o = G5.getOrders(), d = new Date();
      var date = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
      var id = 'SG-' + (20000 + o.length + 1);
      items.forEach(function (x) { o.unshift([id, date, x[0], x[1], x[2] * x[3], 0]); });
      wr(K.ordersPrefix + accountKey(), o);
      G5.setCart([]);
      return id;
    },
    syncCart: function () {
      if (!apiMode) return Promise.resolve(G5.getCart());
      return api('/cart').then(function (data) { var items = (data.items || []).map(function (x) { return [x.title, x.product_type, Number(x.price) / RATE, x.quantity, x.product_id]; }); wr('5guys_api_cart_cache', items); G5.refresh(); return items; });
    },
    syncOrders: function () {
      if (!apiMode) return Promise.resolve(G5.getOrders());
      return api('/orders').then(function (data) { return Promise.all((data.orders || []).map(function (o) { return api('/orders/' + o.id).then(function (detail) { var stage = ({ pending_payment: 0, paid: 1, processing: 1, shipped: 2, fulfilled: 3, cancelled: 0, refunded: 0, partially_refunded: 0 })[o.status] || 0; var label = o.status === 'refunded' ? 'Đã hoàn tiền' : o.status === 'cancelled' ? 'Đã hủy' : o.status === 'pending_payment' ? 'Chờ thanh toán' : o.refund_status === 'requested' ? 'Đã gửi yêu cầu hoàn tiền' : o.refund_status === 'rejected' ? 'Hoàn tiền bị từ chối' : ''; var od = detail.order || {}, sa = od.shipping_address || null, ship = sa ? (od.recipient_name + ' · ' + od.recipient_phone + ' — ' + [sa.addressLine, sa.ward, sa.district, sa.city].filter(Boolean).join(', ')) : '';
          return (detail.items || []).map(function (item) { return [o.order_number, new Date(o.placed_at).toLocaleDateString('vi-VN'), item.product_title, item.product_type, Number(item.line_total) / RATE, stage, label, o.id, item.product_type === 'physical' ? ship : '']; }); }); })); }).then(function (groups) { var rows = groups.flat(); wr('5guys_api_orders_cache', rows); return rows; });
    },
    getLibrary: function () { return apiMode ? api('/library').then(function (data) { return data.games || []; }) : Promise.resolve(null); },
    errorText: function (err) {
      var code = err && err.message;
      return ({
        invalid_credentials: 'Email hoặc mật khẩu không đúng.',
        invalid_request: 'Thông tin chưa hợp lệ. Kiểm tra email đúng định dạng, mật khẩu tối thiểu 10 ký tự.',
        already_exists: 'Email này đã được đăng ký.',
        cart_empty: 'Giỏ hàng đang trống. Hãy thêm game trước khi thanh toán.',
        insufficient_stock: 'Một sản phẩm hiện không đủ tồn kho.',
        already_owned: 'Bạn đã sở hữu game kỹ thuật số này (xem trong Kho game).',
        authentication_required: 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại.',
        invalid_or_expired_token: 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại.',
        forbidden: 'Bạn không có quyền thực hiện thao tác này.',
        refund_already_requested: 'Đơn này đã có yêu cầu hoàn tiền.',
        order_not_refundable: 'Đơn này chưa thanh toán nên không thể hoàn tiền.',
        product_not_found: 'Không tìm thấy sản phẩm.',
        wrong_password: 'Mật khẩu hiện tại không đúng.',
        address_not_found: 'Không tìm thấy địa chỉ.',
        too_many_addresses: 'Tối đa 10 địa chỉ giao hàng.',
        address_required: 'Đơn có game đĩa cần địa chỉ giao hàng. Hãy chọn hoặc thêm địa chỉ.',
        reset_cooldown: 'Vui lòng đợi 1 phút trước khi yêu cầu mã mới.',
        invalid_or_expired_code: 'Mã xác nhận không đúng hoặc đã hết hạn.',
        too_many_attempts: 'Nhập sai mã quá 5 lần. Vui lòng yêu cầu mã mới.',
        invalid_phone: 'Số điện thoại phải gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.',
        'Failed to fetch': 'Không kết nối được API. Hãy kiểm tra backend đang chạy (npm run dev).'
      })[code] || ('Có lỗi xảy ra: ' + (code || 'không rõ'));
    },
    isAdmin: function () { var u = G5.user(); return !!(u && (u.role === 'admin' || u.role === 'staff')); },
    notify: function (message) {
      if (typeof window.showToast === 'function') { window.showToast('Thông báo', message, false); return; }
      // Thong bao nho goc phai duoi, tu an sau 3.5 giay (khong chan trang nhu alert)
      var box = document.getElementById('g5-toast');
      if (!box) {
        box = document.createElement('div'); box.id = 'g5-toast';
        box.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483001;max-width:340px;padding:12px 16px;border-radius:14px;background:#2a1645;border:1px solid #9d4edd;color:#f3e8ff;font:600 14px Inter,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);transition:opacity .3s;opacity:0';
        document.body.appendChild(box);
      }
      box.textContent = message; box.style.opacity = '1';
      clearTimeout(box._t); box._t = setTimeout(function () { box.style.opacity = '0'; }, 3500);
    },
    /* ---- Giao diện ---- */
    refresh: function () {
      var n = G5.user() ? G5.getCart().length : 0;
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.textContent = n;
        el.style.display = n ? '' : 'none';
      });
      var balance = G5.formatVnd(G5.getWallet());
      document.querySelectorAll('[data-wallet-balance]').forEach(function (el) { el.textContent = balance; });
    }
  };

  // Áp trạng thái đăng nhập ngay từ <head> để không bị "nháy" giao diện.
  var u = G5.user();
  document.documentElement.classList.toggle('is-auth', !!u);
  if (window.G5_REQUIRE_AUTH && !u) {
    location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var user = G5.user();
    if (user) {
      var nm = user.name || 'User';
      document.querySelectorAll('[data-user-name]').forEach(function (el) { el.textContent = nm; });
      document.querySelectorAll('[data-user-initial]').forEach(function (el) { el.textContent = nm.charAt(0).toUpperCase(); });
      document.querySelectorAll('[data-access-label]').forEach(function (el) { el.textContent = nm + ' • 5GUYS Vault'; });
    }
    document.querySelectorAll('[data-logout]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); G5.logout(); location.href = 'index.html'; });
    });
    // Đánh dấu mục menu của trang hiện tại
    var cur = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('a[data-nav]').forEach(function (a) {
      if (a.getAttribute('href').split('#')[0] === cur) a.classList.add('is-current');
    });
    if (G5.isAdmin()) {
      var lastNav = document.querySelector('a[data-nav][href="mods.html"]');
      if (lastNav && !document.querySelector('a[data-nav][href="admin.html"]')) {
        var adm = lastNav.cloneNode(false);
        adm.setAttribute('href', 'admin.html');
        adm.innerHTML = '<i class="fa-solid fa-user-shield"></i> Quản trị';
        lastNav.insertAdjacentElement('afterend', adm);
      }
    }
    G5.refresh();
    if (apiMode) { G5.syncCart().catch(function () { G5.notify('Không thể tải giỏ hàng từ API.'); }); G5.syncOrders().catch(function () { G5.notify('Không thể tải đơn hàng từ API.'); }); }
  });

  // Easter egg: mã Konami (↑ ↑ ↓ ↓ ← → ← → B A) -> bật/tắt con trỏ tay cầm chơi game
  (function () {
    var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0;
    var style = null;
    function setCursor(on) {
      if (on && !style) {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text x='2' y='24' font-size='22'>🎮</text></svg>";
        style = document.createElement('style');
        style.textContent = 'html,body,body *{cursor:url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '") 4 4,auto!important}';
        document.head.appendChild(style);
      } else if (!on && style) { style.remove(); style = null; }
      try { on ? sessionStorage.setItem('5guys_konami', '1') : sessionStorage.removeItem('5guys_konami'); } catch (e) {}
    }
    try { if (sessionStorage.getItem('5guys_konami')) setCursor(true); } catch (e) {}
    document.addEventListener('keydown', function (e) {
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = key === seq[pos] ? pos + 1 : (key === seq[0] ? 1 : 0);
      if (pos < seq.length) return;
      pos = 0;
      var on = !style;
      setCursor(on);
      playSecret();
      G5.notify(on ? '🎮 Cheat code được chấp nhận! Con trỏ tay cầm đã mở khóa. (Nhập lại để tắt)' : 'Đã tắt con trỏ tay cầm. Hẹn gặp lại, game thủ!');
    });
  })();

  // Easter egg: rời tab thì tiêu đề tab "gọi" bạn quay lại, quay lại thì được chào mừng
  (function () {
    var original = null, timer = null;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearTimeout(timer);
        if (original === null) original = document.title;
        document.title = '💤 Player 1 đã AFK...';
      } else if (original !== null) {
        document.title = '🎮 Welcome back, player!';
        timer = setTimeout(function () { document.title = original; original = null; }, 2000);
      }
    });
  })();

  // Easter egg: bấm mở giỏ hàng -> tiếng mở rương, chờ tiếng phát xong rồi mới chuyển trang
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || !/(^|\/)cart\.html(\?|#|$)/.test(a.getAttribute('href'))) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    e.preventDefault();
    var wait = playChest();
    setTimeout(function () { location.href = a.href; }, Math.max(250, wait));
  });

  // Nút "thêm vào giỏ" ở mọi trang (bắt sự kiện ở pha capture, chạy cùng các handler cũ)
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-add],.add-to-cart-btn');
    if (!b) return;
    if (!G5.user()) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      G5.promptLogin('Vui lòng đăng nhập hoặc đăng ký tài khoản để thêm game vào giỏ hàng.');
      return;
    }
    var name, kind, usd;
    var productId = b.dataset.id || null;
    if (b.dataset.name) {
      name = b.dataset.name; kind = b.dataset.kind || 'digital'; usd = parseFloat(b.dataset.price) || 0;
    } else {
      var c = b;
      while (c && c !== document.body) {
        if (c.querySelector('h3') && /\d[\d.]*\s*đ/.test(c.textContent)) break;
        c = c.parentElement;
      }
      if (!c || c === document.body) return;
      name = c.querySelector('h3').textContent.replace(/\s+/g, ' ').trim();
      var ps = [];
      c.textContent.replace(/(\d[\d.]*)\s*đ/g, function (_, p) { ps.push(G5.vnd(p)); });
      usd = ps.length ? Math.min.apply(null, ps) / RATE : 0;
      kind = document.body.dataset.kind || 'digital';
    }
    G5.add(name, kind, usd, 1, productId);
  }, true);
})();
