/* Cấu hình Tailwind hợp nhất duy nhất cho toàn bộ 20 trang 5GUYS (gộp cả 3 trang Hub).
 * Đọc trực tiếp từ hệ biến CSS 4 tầng trong assets/shared.css qua cú pháp rgb(var(...) / <alpha-value>)
 * để hỗ trợ đầy đủ opacity modifier (/20, /40, /95...) và chuyển đổi theme đồng bộ. */
(function () {
  var c = function (varName) {
    return 'rgb(var(' + varName + ') / <alpha-value>)';
  };

  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          display: ['Inter', 'sans-serif']
        },
        colors: {
          /* Nhóm tên chuẩn mới (4 tầng) */
          canvas: c('--g5-bg-canvas-rgb'),
          shell: c('--g5-bg-shell-rgb'),
          surface: c('--g5-bg-surface-rgb'),
          elevated: c('--g5-bg-elevated-rgb'),

          /* Nhóm tên thương hiệu & tương thích ngược toàn site */
          brand: {
            200: c('--g5-brand-200-rgb'),
            300: c('--g5-brand-300-rgb'),
            400: c('--g5-brand-400-rgb'),
            500: c('--g5-brand-500-rgb'),
            600: c('--g5-brand-600-rgb'),
            light: c('--g5-brand-300-rgb'),
            DEFAULT: c('--g5-brand-500-rgb'),
            dark: c('--g5-brand-600-rgb')
          },
          dark: {
            bg: c('--g5-bg-canvas-rgb'),
            surface: c('--g5-bg-surface-rgb'),
            border: c('--g5-border-subtle-rgb'),
            text: c('--g5-text-primary-rgb')
          },
          vault: {
            bg: c('--g5-bg-canvas-rgb'),
            surface: c('--g5-bg-surface-rgb'),
            container: c('--g5-bg-container-rgb'),
            containerHigh: c('--g5-bg-elevated-rgb'),
            border: c('--g5-border-subtle-rgb'),
            borderSubtle: 'rgb(var(--g5-brand-500-rgb) / 0.25)',
            primary: c('--g5-brand-300-rgb'),
            primaryDark: c('--g5-brand-500-rgb'),
            primaryDeep: c('--g5-brand-600-rgb'),
            secondary: c('--g5-brand-200-rgb'),
            text: c('--g5-text-primary-rgb'),
            textMuted: c('--g5-text-muted-rgb'),
            amber: c('--g5-warning-rgb'),
            emerald: c('--g5-success-rgb'),
            crimson: c('--g5-danger-rgb')
          },

          /* Token hợp nhất từ 3 trang Hub (library, rental, mods) */
          background: c('--g5-bg-canvas-rgb'),
          'surface-dim': c('--g5-bg-canvas-rgb'),
          'surface-container-lowest': c('--g5-bg-lowest-rgb'),
          'surface-container-low': c('--g5-bg-shell-rgb'),
          'surface-container': c('--g5-bg-container-rgb'),
          'surface-container-high': c('--g5-bg-surface-rgb'),
          'surface-container-highest': c('--g5-bg-elevated-rgb'),
          'surface-bright': c('--g5-bg-elevated-rgb'),
          'on-surface': c('--g5-text-primary-rgb'),
          'on-surface-variant': c('--g5-text-body-rgb'),
          outline: c('--g5-text-muted-rgb'),
          'outline-variant': c('--g5-border-subtle-rgb'),
          primary: c('--g5-brand-300-rgb'),
          'primary-container': c('--g5-brand-300-rgb'),
          secondary: c('--g5-brand-200-rgb'),
          'secondary-container': c('--g5-brand-600-rgb'),
          tertiary: c('--g5-brand-200-rgb'),
          error: c('--g5-danger-rgb'),
          'brand-purple': c('--g5-brand-500-rgb'),
          'brand-neon': c('--g5-brand-300-rgb')
        },
        boxShadow: {
          /* Giảm độ chói neon, chỉ giữ điểm nhấn tinh tế cho CTA chính */
          'purple-glow': '0 8px 22px -6px rgb(var(--g5-brand-500-rgb) / 0.35)',
          'neon-glow': '0 10px 26px -6px rgb(var(--g5-brand-300-rgb) / 0.42)',
          'ambient-glow': '0 10px 24px -8px rgba(0, 0, 0, 0.5)'
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'spin-slow': 'spin 3s linear infinite'
        }
      }
    }
  };
})();
