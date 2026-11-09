import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#111111',
        offwhite: '#F5F2E9',
        green: '#0B5D45',
        white: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#111111',
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;