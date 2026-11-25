/* 5GUYS - layout.js
 * "Master layout": menu (nav) va footer dung chung cho moi trang, chi can sua o day.
 * Cach dung trong trang:
 *   <script src="assets/layout.js" data-part="nav"></script>     -> chen menu tai cho nay
 *   <script src="assets/layout.js" data-part="footer"></script>  -> chen footer tai cho nay
 * HTML duoc chen ngay luc trang dang tai (truoc DOMContentLoaded), nen shared.js va script
 * cua tung trang (easter egg logo, dang xuat, to sang muc menu dang xem...) van chay nhu cu.
 */
(function () {
  var L = window.G5_LAYOUT = window.G5_LAYOUT || {};

  /* ===== MENU (nav) ===== */
  L.nav = L.nav || `
<nav class="bg-dark-bg/95 backdrop-blur-xl sticky top-0 z-40 border-b border-dark-border shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
<div class="g5-nav-inner max-w-[1600px] mx-auto px-3 sm:px-5 xl:px-6 2xl:px-10"><div class="flex items-center justify-between h-[72px] gap-3 xl:gap-4">
<div class="flex items-center min-w-0 flex-1">
<a href="index.html" id="logo-container" class="flex-shrink-0 cursor-pointer select-none group mr-3 xl:mr-5 2xl:mr-7" title="Click 5 lần để nhận bất ngờ!"><span class="text-2xl 2xl:text-3xl font-black tracking-widest flex items-center gap-2 logo-font"><i class="fa-solid fa-gamepad text-brand group-hover:text-brand-light transition-colors drop-shadow-[0_0_10px_rgba(157,78,221,0.5)]"></i><span class="text-white">5</span><span class="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light group-hover:from-brand-light group-hover:to-white transition-all">GUYS</span></span></a>
<div class="hidden xl:flex items-center min-w-0 flex-1 gap-1.5" data-desktop-nav-wrap><div data-desktop-nav class="flex items-center gap-0.5 2xl:gap-1 min-w-0 overflow-x-auto scrollbar-none">
<a data-nav href="index.html" class="flex-shrink-0 px-2.5 2xl:px-3 py-2 rounded-lg text-[13px] 2xl:text-sm font-semibold tracking-wide transition-colors text-gray-300 hover:text-brand-light hover:bg-dark-surface whitespace-nowrap">Trang chủ</a><a data-user data-nav href="library.html" class="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 rounded-lg text-[13px] 2xl:text-sm font-semibold tracking-wide transition-colors text-gray-300 hover:text-brand-light hover:bg-dark-surface whitespace-nowrap !text-brand-light"><i class="fa-solid fa-layer-group text-xs"></i>Kho game</a>
<a data-nav href="digital.html" class="flex-shrink-0 px-2.5 2xl:px-3 py-2 rounded-lg text-[13px] 2xl:text-sm font-semibold tracking-wide transition-colors text-gray-300 hover:text-brand-light hover:bg-dark-surface whitespace-nowrap">Kỹ thuật số</a>
<a data-nav href="physical.html" class="flex-shrink-0 px-2.5 2xl:px-3 py-2 rounded-lg text-[13px] 2xl:text-sm font-semibold tracking-wide transition-colors text-gray-300 hover:text-brand-light hover:bg-dark-surface whitespace-nowrap">Vật lý &amp; Băng đĩa</a>
<a data-nav href="rental.html" class="flex-shrink-0 px-2.5 2xl:px-3 py-2 rounded-lg text-[13px] 2xl:text-sm font-semibold tracking-wide transition-colors text-gray-300 hover:text-brand-light hover:bg-dark-surface whitespace-nowrap">Thuê cấu hình</a>
<a data-nav href="mods.html" class="flex-shrink-0 px-2.5 2xl:px-3 py-2 rounded-lg text-[13px] 2xl:text-sm font-semibold tracking-wide transition-colors text-gray-300 hover:text-brand-light hover:bg-dark-surface whitespace-nowrap">Cộng đồng Mod</a>
</div><div data-desktop-role-slot class="hidden items-center gap-1.5 flex-shrink-0"></div></div></div>
<div class="flex items-center gap-1.5 sm:gap-2.5 2xl:gap-3.5 flex-shrink-0">
<a data-nav href="search.html" title="Tìm kiếm" aria-label="Tìm kiếm" class="inline-flex items-center gap-1.5 text-gray-300 hover:text-brand-light hover:bg-dark-surface px-2.5 py-2 rounded-lg text-[13px] 2xl:text-sm font-semibold tracking-wide whitespace-nowrap transition-colors"><i class="fa-solid fa-magnifying-glass text-sm"></i><span class="nav-search-label">Tìm kiếm</span></a>
<a data-user href="cart.html" title="Giỏ hàng" aria-label="Giỏ hàng" class="relative inline-flex items-center justify-center text-gray-300 hover:text-brand-light hover:bg-dark-surface p-2 rounded-lg transition-colors"><i class="fa-solid fa-cart-shopping text-lg"></i><span id="cart-badge" data-cart-count class="absolute -top-0.5 -right-0.5 bg-brand text-white text-[10px] font-bold rounded-full w-4 h-4 grid place-items-center">0</span></a>
<div data-user class="flex items-center">
<div class="relative group cursor-pointer flex items-center gap-2 sm:gap-2.5 bg-dark-surface border border-dark-border px-2.5 sm:px-3 py-1.5 rounded-full hover:border-brand-light transition-all duration-300 shadow-md whitespace-nowrap"><div data-user-initial class="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-sm font-bold text-white shadow-inner flex-shrink-0">U</div><span data-user-name class="hidden sm:inline-block max-w-[110px] 2xl:max-w-[150px] truncate text-gray-200 text-sm font-medium pr-0.5 tracking-wide">User</span><i class="fa-solid fa-chevron-down text-xs text-brand-light group-hover:rotate-180 transition-transform duration-300 flex-shrink-0"></i>
<div class="absolute right-0 top-full pt-3 w-64 hidden group-hover:block z-50 cursor-default"><div class="bg-dark-surface border border-brand/40 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.7)] p-2"><div data-role-menu class="hidden mb-1.5 pb-1.5 border-b border-dark-border/80"></div><a href="profile.html" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-brand-light hover:bg-dark-bg transition-colors"><i class="fa-solid fa-user w-4 text-brand-light"></i>Hồ sơ cá nhân</a><a href="library.html" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-brand-light hover:bg-dark-bg transition-colors"><i class="fa-solid fa-layer-group w-4 text-brand-light"></i>Kho game của tôi</a><a href="cart.html" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-brand-light hover:bg-dark-bg transition-colors"><i class="fa-solid fa-cart-shopping w-4 text-brand-light"></i>Giỏ hàng &amp; Thanh toán</a><a href="orders.html" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-brand-light hover:bg-dark-bg transition-colors"><i class="fa-solid fa-box w-4 text-brand-light"></i>Đơn hàng của tôi</a><a href="reviews.html" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-brand-light hover:bg-dark-bg transition-colors"><i class="fa-solid fa-comments w-4 text-brand-light"></i>Đánh giá &amp; Cộng đồng</a><a href="loyalty.html" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-brand-light hover:bg-dark-bg transition-colors"><i class="fa-solid fa-crown w-4 text-brand-light"></i>Khách hàng thân thiết</a><a href="support.html" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-brand-light hover:bg-dark-bg transition-colors"><i class="fa-solid fa-headset w-4 text-brand-light"></i>Chăm sóc khách hàng</a></div></div></div>
<a href="#" data-logout title="Đăng xuất" aria-label="Đăng xuất" class="ml-1.5 text-gray-400 hover:text-red-400 p-2 rounded-lg text-base font-medium transition-colors border border-transparent hover:bg-dark-surface hover:border-red-500/30"><i class="fa-solid fa-power-off"></i></a>
</div>
<div data-guest class="flex items-center gap-2"><a href="register.html" class="text-gray-200 hover:text-brand-light px-2.5 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 border border-transparent hover:border-brand/50 whitespace-nowrap">Đăng ký</a><a href="login.html" class="bg-brand hover:bg-brand-dark text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-300 shadow-[0_0_15px_rgba(145,71,214,0.35)] border border-brand-light/30 whitespace-nowrap">Đăng nhập</a></div>
</div></div>
<div data-mobile-nav class="xl:hidden flex items-center gap-2 overflow-x-auto pb-3 pt-1 border-t border-dark-border/40 scrollbar-none"><a data-nav href="index.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Trang chủ</a><a data-user data-nav href="library.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap !text-brand-light">Kho game</a>
<a data-nav href="digital.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Kỹ thuật số</a><a data-nav href="physical.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Vật lý &amp; Băng đĩa</a><a data-nav href="rental.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Thuê cấu hình</a><a data-nav href="mods.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Cộng đồng Mod</a><a data-user href="cart.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Giỏ hàng</a>
<a data-user href="orders.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Đơn hàng</a><a data-user href="loyalty.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Tích điểm</a><a data-user href="support.html" class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-300 hover:text-brand-light bg-dark-surface/60 border border-dark-border whitespace-nowrap">Hỗ trợ</a>
</div></div></nav>
`;

  /* ===== FOOTER ===== */
  L.footer = L.footer || `
<footer class="bg-dark-surface border-t border-brand/40 pt-16 pb-8 mt-auto relative z-10 overflow-hidden">
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand/10 blur-[100px] pointer-events-none"></div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
                <div class="col-span-1 md:col-span-5 pr-4">
                    <span class="text-3xl font-black tracking-widest mb-6 flex items-center gap-2 logo-font">
                        <i class="fa-solid fa-gamepad text-brand"></i>
                        <span class="text-white">5</span><span class="text-brand-light">GUYS</span>
                    </span>
                    <p class="text-gray-400 text-sm leading-loose max-w-md font-medium">
                        Nền tảng phân phối game bản quyền kỹ thuật số và thẻ game vật lý hàng đầu. Cam kết uy tín tuyệt đối, giao dịch bảo mật mã hóa AES-256 và đem lại trải nghiệm dịch vụ khách hàng tuyệt vời nhất cho cộng đồng game thủ Việt Nam.
                    </p>
                    <div class="mt-8 flex gap-4">
                        <div class="bg-dark-bg p-3 rounded-xl border border-dark-border flex items-center gap-3 shadow-inner">
                            <i class="fa-solid fa-shield-check text-brand-light text-xl"></i>
                            <div>
                                <div class="text-xs text-outline font-bold uppercase">Bảo Mật</div>
                                <div class="text-sm text-white font-medium">100% An Toàn</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1 md:col-span-3 md:col-start-7">
                    <h3 class="text-white font-black mb-6 uppercase text-sm tracking-widest text-brand-light border-l-2 border-brand pl-3 font-display">Danh Mục</h3>
                    <ul class="space-y-4 text-sm text-gray-400 font-medium">
                        <li class=""><a href="digital.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Game Kỹ Thuật Số</a></li>
                        <li class=""><a href="physical.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Thẻ Game Vật Lý</a></li>
                        <li class=""><a href="search.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Tìm kiếm</a></li>
                        <li class=""><a href="rental.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Thuê Cấu Hình Cloud</a></li>
                        <li class=""><a href="mods.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Cộng Đồng Mod</a></li>
                        <li class=""><a href="digital.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Phát Hành Sắp Tới</a></li>
                    </ul>
                </div>
                <div class="col-span-1 md:col-span-3">
                    <h3 class="text-white font-black mb-6 uppercase text-sm tracking-widest text-brand-light border-l-2 border-brand pl-3 font-display">Thông Tin &amp; Hỗ Trợ</h3>
                    <ul class="space-y-4 text-sm text-gray-400 font-medium">
                        <li class=""><a href="support.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Về 5GUYS Store</a></li>
                        <li class=""><a href="terms.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Điều khoản dịch vụ</a></li>
                        <li class=""><a href="privacy.html" class="hover:text-brand-light hover:translate-x-2 transition-all inline-block"><i class="fa-solid fa-angle-right text-xs mr-2 text-dark-border"></i> Chính sách bảo mật</a></li>
                        <li class="pt-2"><a href="index.html#gift-section" class="text-brand-light hover:text-white transition-all font-bold flex items-center gap-2 bg-brand/10 w-fit px-4 py-2 rounded-lg border border-brand/30 hover:bg-brand/20 hover:shadow-[0_0_10px_rgba(157,78,221,0.3)]"><i class="fa-solid fa-gift animate-bounce"></i> Nhận Quà Tặng</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-dark-border pt-8 flex flex-col md:flex-row justify-between items-center text-outline text-sm">
                <div class="flex items-center gap-2">
                    <p class="">© 2026 5GUYS Game Store.</p>
                    <span class="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <p class="">Designed by Nhóm 5Guys 26C01.</p>
                </div>
                <div class="flex space-x-6 mt-6 md:mt-0 text-gray-400 items-center">
                    <a href="#" class="hover:text-brand-light hover:-translate-y-1 transition-all"><i class="fa-brands fa-facebook text-xl"></i></a>
                    <a href="#" class="hover:text-brand-light hover:-translate-y-1 transition-all"><i class="fa-brands fa-discord text-xl"></i></a>
                    <a href="#" class="hover:text-brand-light hover:-translate-y-1 transition-all"><i class="fa-brands fa-youtube text-xl"></i></a>
                    <!-- Nút ẩn đập phá website -->
                    <span id="smash-toggle-btn" class="ml-4 opacity-5 font-black text-xl hover:opacity-100 transition-opacity text-brand-light" title="Click to Smash!">🔨</span>
                </div>
            </div>
            <div class="flex justify-center mt-6"><span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-surface/70 border border-brand/40 text-xs sm:text-sm font-semibold text-brand-light text-center"><i class="fa-solid fa-user-graduate"></i>Sinh viên thực hiện: Nhóm 5Guys - 26C01</span></div>
        </div>
    </footer>
`;

  var me = document.currentScript, part = me && me.getAttribute('data-part');
  if (me && L[part]) me.insertAdjacentHTML('beforebegin', L[part]);
})();
