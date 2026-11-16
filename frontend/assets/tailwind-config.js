/* Cấu hình Tailwind dùng chung cho toàn bộ site (gộp từ các trang gốc). */
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
        "surface-container-lowest": "#0a0510",
        "surface-container-low": "#180c26",
        "surface-container": "#1f1032",
        "surface-container-high": "#291542",
        "surface-container-highest": "#331a52",
        "on-surface-variant": "#d8b4e2",
        "outline": "#a78bba",
        "primary": "#c77dff",
        "primary-container": "#c77dff",
        "error": "#f87171",
        "secondary": "#c77dff"
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
