import type { Config } from "tailwindcss";

// Konfigurasi Tailwind CSS — scan semua file di app/ dan components/
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
