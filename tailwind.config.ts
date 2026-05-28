import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
