import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          soft: "#e0efff",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      boxShadow: {
        brand: "0 18px 48px -18px rgba(255, 45, 120, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
