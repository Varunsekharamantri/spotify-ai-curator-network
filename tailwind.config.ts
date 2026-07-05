import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ai: {
          bg: "#121212",
          card: "#181818",
          cardHover: "#282828",
          border: "rgba(255,255,255,0.08)",
          accent: "#1DB954",
          accentLight: "#1ED760",
          accentAlt: "#1ED760",
          green: "#1DB954",
          text: "#FFFFFF",
          subtext: "#B3B3B3",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        pill: "500px",
      },
    },
  },
  plugins: [],
} satisfies Config;
