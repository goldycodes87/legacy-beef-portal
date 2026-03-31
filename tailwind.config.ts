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
          'orange-light': '#FFF5F0',
          green: '#1A3D2B',
          'green-light': '#2D5E42',
          'green-pale': '#F0F7E8',
          dark: '#0F0F0F',
          warm: '#F5F0E8',
          gray: '#6B7280',
          'gray-light': '#E5E7EB',
          'gray-pale': '#F9F9F9',
          gold: '#C4A46B',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        sign: ['"Dancing Script"', 'cursive'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        badge: '999px',
        input: '10px',
      },
      maxWidth: {
        content: '680px',
        wide: '860px',
      }
    },
  },
  plugins: [],
};

export default config;
