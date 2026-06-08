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
        bg: {
          base: "#0f0f1a",
          card: "#1a1a2e",
          elevated: "#20203a",
        },
        border: {
          DEFAULT: "#2a2a3e",
          muted: "#1e1e32",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
          muted: "#6366f120",
        },
        text: {
          primary: "#e2e8f0",
          muted: "#94a3b8",
          subtle: "#64748b",
        },
        sentiment: {
          positive: "#22c55e",
          negative: "#ef4444",
          neutral: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
