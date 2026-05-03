/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef5ff',
          100: '#d9eaff',
          200: '#bcd8ff',
          300: '#8ebeff',
          400: '#5a9aff',
          500: '#3b7fff',
          600: '#1a5ef5',
          700: '#1448e1',
          800: '#173ab6',
          900: '#19358f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
