import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        brand: {
          DEFAULT: "#111111",
          900: "#0a0a0a",
          800: "#111111",
          700: "#1f1f1f",
          600: "#2b2b2b",
          400: "#3B82F6", // Consistent blue
        },
        success: "#22c55e",
        warning: "#f97316",
        danger: "#ef4444",
      },
    },
  },
  plugins: [],
};
export default config;
