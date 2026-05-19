import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        card: "#FFFFFF",
        border: "#E2E8F0",
        muted: {
          DEFAULT: "#94A3B8",
          foreground: "#64748B",
        },
        primary: {
          DEFAULT: "#25D366",
          foreground: "#FFFFFF",
        },
        whatsapp: {
          DEFAULT: "#25D366",
          dark: "#128C7E",
          light: "#DDF8EA",
        },
        warning: "#F59E0B",
        success: "#10B981",
        error: "#EF4444",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 12px 32px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
