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
        pelindo: {
          50: '#F0F7FC',
          100: '#E1EFF9',
          200: '#BADDF2',
          300: '#7EC3E8',
          400: '#3CA5DC',
          500: '#005BAC', // Pelindo Brand Primary
          600: '#004E94',
          700: '#003E78',
          800: '#062B52',
          900: '#0B213E',
          navy: '#0B2545',
          sky: '#00A3E0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

