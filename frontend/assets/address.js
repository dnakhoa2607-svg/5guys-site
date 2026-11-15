/* 5GUYS - address.js
 * Ham dung chung cho dia chi giao hang (trang Ho so va trang Gio hang):
 *  - So dien thoai VN: dung 10 so, dau 03/05/07/08/09; tu dinh dang "0912 345 678" khi go.
 *  - Dia gioi hanh chinh moi (sau sap nhap 1/7/2025): 34 tinh/thanh -> phuong/xa.
 *    Nguon: provinces.open-api.vn/api/v2 (mien phi, khong can key).
 */
(function () {
  var A = window.G5Addr = {};

  /* ---------- So dien thoai ---------- */
  A.PHONE_MSG = 'Số điện thoại phải gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.';
  A.normPhone = function (v) {
    var d = String(v || '').trim(), compact = d.replace(/[\s.()-]/g, '');
    if (/^\+?84/.test(compact)) d = '0' + compact.replace(/^\+?84/, '');
    return d.replace(/\D/g, '').slice(0, 10);
  };
  A.validPhone = function (v) { return /^0[35789]\d{8}$/.test(A.normPhone(v)); };
  A.fmtPhone = function (v) {
    var d = A.normPhone(v);
    return [d.slice(0, 4), d.slice(4, 7), d.slice(7)].filter(Boolean).join(' ');
  };
  // Chi cho go so, toi da 10 so, tu chen dau cach; vien do khi roi o ma so sai
  A.bindPhone = function (el) {
    el.addEventListener('input', function () {
      var f = A.fmtPhone(el.value); if (el.value !== f) el.value = f;
      el.setCustomValidity(''); el.classList.remove('!border-red-400');
    });
    el.addEventListener('blur', function () {
      var v = el.value.trim(), bad = v !== '' && !A.validPhone(v);
      el.setCustomValidity(bad ? A.PHONE_MSG : ''); el.classList.toggle('!border-red-400', bad);
    });
  };

  /* ---------- Hien thi dia chi ---------- */
  // Nhan ca dong trong so dia chi (address_line...) lan ban chup trong don hang (addressLine...)
  A.format = function (a) {
    if (!a) return '';
    return [a.address_line || a.addressLine, a.ward, a.district, a.city].filter(Boolean).join(', ');
  };

  /* ---------- Danh muc tinh / phuong ---------- */
  var GEO = 'https://provinces.open-api.vn/api/v2', cache = {};
  function geo(path) {
    if (!cache[path]) cache[path] = fetch(GEO + path)
      .then(function (r) { if (!r.ok) throw new Error('geo'); return r.json(); })
      .catch(function (e) { delete cache[path]; throw e; });
    return cache[path];
  }
  A.GEO_FAIL = 'Không tải được danh sách tỉnh/thành, phường/xã. Kiểm tra kết nối mạng.';
  A.WARD_MSG = 'Vui lòng chọn phường / xã có trong danh sách.';
  var plain = function (s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
  };

  /* Gan dropdown Tinh (<select>) va o Phuong (<input list> + <datalist>).
   * opts: { city, ward, list, onError }. Tra ve cac ham dieu khien form. */
  A.form = function (opts) {
    var city = opts.city, ward = opts.ward, list = opts.list, wardNames = [];
    var onError = opts.onError || function () {};
    var api = {
      loadProvinces: function (name) {
        return geo('/p/').then(function (rows) {
          city.innerHTML = ''; city.add(new Option('Chọn tỉnh / thành phố', ''));
          rows.forEach(function (p) { var o = new Option(p.name, p.code); o.dataset.name = p.name; if (p.name === name) o.selected = true; city.add(o); });
        });
      },
      // Phuong/xa: o go de loc vi moi tinh co toi vai tram phuong/xa
      loadWards: function (name) {
        ward.value = ''; list.innerHTML = ''; wardNames = []; ward.disabled = true; ward.placeholder = 'Chọn tỉnh / thành phố trước';
        if (!city.value) return Promise.resolve();
        ward.placeholder = 'Đang tải...';
        return geo('/p/' + city.value + '?depth=2').then(function (p) {
          wardNames = p.wards.map(function (w) { return w.name; });
          wardNames.forEach(function (n) { list.appendChild(new Option(n)); });
          ward.disabled = false; ward.placeholder = 'Gõ để tìm, VD: Bến Thành';
          if (name && wardNames.indexOf(name) >= 0) ward.value = name;
        });
      },
      // Chon san tinh -> phuong theo ten (dia chi cu theo dia gioi truoc sap nhap se phai chon lai)
      load: function (cityName, wardName) {
        return api.loadProvinces(cityName).then(function () { return api.loadWards(wardName); });
      },
      // Chap nhan go khong dau / khac hoa thuong neu khop dung 1 phuong
      matchWard: function (v) {
        if (wardNames.indexOf(v) >= 0) return v;
        var p = plain(v); if (!p) return '';
        var hit = wardNames.filter(function (n) { return plain(n) === p || plain(n).replace(/^(phuong|xa|dac khu) /, '') === p; });
        return hit.length === 1 ? hit[0] : '';
      },
      cityName: function () { var o = city.selectedOptions[0]; return (o && o.dataset.name) || ''; }
    };
    city.addEventListener('change', function () { api.loadWards().catch(function () { onError(A.GEO_FAIL); }); });
    ward.addEventListener('change', function () { var m = api.matchWard(ward.value); if (m) ward.value = m; });
    return api;
  };
})();
