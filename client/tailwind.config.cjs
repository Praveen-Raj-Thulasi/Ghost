/**
 * Tailwind configuration for the Ghost client.
 * Uses the exact color palette specified in the design brief.
 */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}", "./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        "bg-dark": "#090B10",
        "surface": "#11151D",
        "elevated": "#191F2A",
        "spectral-green": "#B7FF5A",
        "spectral-violet": "#A78BFA",
        "text-main": "#F2F4F8",
        "text-muted": "#9AA4B2",
        "border": "#293140",
        "warning": "#FFBF69",
        "error": "#FF7272",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        "glow": "0 0 8px 2px rgba(183,255,90,0.4)",
      },
    },
  },
  plugins: [],
};
