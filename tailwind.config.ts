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
        brand: {
          orange: '#E85D24',
          'orange-hover': '#D14E1A',
          green: '#1A3D2B',
          'green-light': '#2D5E42',
          dark: '#0F0F0F',
          gray: '#6B7280',
          'gray-light': '#E5E7EB',
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
