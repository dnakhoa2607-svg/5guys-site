/* Cấu hình Tailwind cho 3 trang Kho game / Thuê cấu hình / Cộng đồng Mod.
   Giữ riêng vì một số tên màu (outline, primary...) trùng tên nhưng khác giá trị so với các trang còn lại. */
tailwind.config = {
  "theme": {
    "extend": {
      "fontFamily": {
        "sans": [
          "Inter",
          "sans-serif"
        ],
        "display": [
          "Inter",
          "sans-serif"
        ]
      },
      "colors": {
        "vault": {
          "bg": "#12091c",
          "surface": "#2a1645",
          "container": "#1f1032",
          "containerHigh": "#291542",
          "border": "#3c096c",
          "borderSubtle": "rgba(157, 78, 221, 0.3)",
          "primary": "#c77dff",
          "primaryDark": "#9d4edd",
          "primaryDeep": "#7b2cbf",
          "secondary": "#e0aaff",
          "text": "#f3e8ff",
          "textMuted": "#a8b2d1",
          "amber": "#f59e0b",
          "emerald": "#10b981",
          "crimson": "#ef4444"
        },
        "brand": {
          "light": "#c77dff",
          "DEFAULT": "#9d4edd",
          "dark": "#7b2cbf"
        },
        "dark": {
          "bg": "#12091c",
          "surface": "#2a1645",
          "border": "#3c096c",
          "text": "#f3e8ff"
        },
        "background": "#12091c",
        "surface-container-lowest": "#130a1d",
        "surface-container-low": "#1c1226",
        "surface-container": "#241832",
        "surface-container-high": "#30243d",
        "surface-container-highest": "#3b3046",
        "on-surface-variant": "#d0c2d5",
        "outline": "#998d9e",
        "primary": "#e0b6ff",
        "primary-container": "#c77dff",
        "error": "#ffb4ab",
        "secondary": "#e1b6ff",
        "surface-variant": "#3b3046",
        "primary-fixed": "#f2daff",
        "inverse-primary": "#8433c4",
        "on-surface": "#edddf8",
        "on-tertiary-container": "#fffdff",
        "inverse-on-surface": "#362c41",
        "tertiary-container": "#e50071",
        "on-secondary-container": "#d69eff",
        "tertiary-fixed": "#ffd9e1",
        "primary-fixed-dim": "#e0b6ff",
        "on-primary": "#4c007d",
        "on-secondary-fixed-variant": "#691a9f",
        "on-error-container": "#ffdad6",
        "on-tertiary-fixed": "#3f001a",
        "on-background": "#edddf8",
        "tertiary": "#ffb1c4",
        "surface-tint": "#e0b6ff",
        "on-primary-container": "#fffdff",
        "outline-variant": "#4d4353",
        "secondary-container": "#691a9f",
        "secondary-fixed": "#f2daff",
        "on-primary-fixed": "#2e004e",
        "surface-dim": "#140a1f",
        "surface-bright": "#3f354a",
        "surface": "#180f22",
        "brand-purple": "#9d4edd",
        "brand-neon": "#c77dff"
      },
      "boxShadow": {
        "purple-glow": "0 0 25px -4px rgba(157, 78, 221, 0.5)",
        "neon-glow": "0 0 35px -5px rgba(199, 125, 255, 0.8)",
        "ambient-glow": "0 15px 35px -5px rgba(157, 78, 221, 0.35)"
      },
      "animation": {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite"
      }
    }
  },
  "darkMode": "class"
};
