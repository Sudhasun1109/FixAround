/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fixblue: {
          DEFAULT: '#1e3a5f',
          50: '#f0f5fa',
          100: '#d9e5f3',
          200: '#b3cbe7',
          300: '#82aadb',
          400: '#5285cb',
          500: '#3466b5',
          600: '#264f96',
          700: '#1f3e76',
          800: '#1e3a5f',
          900: '#172c47',
          950: '#0e1b2d',
        },
        fixteal: {
          DEFAULT: '#0d9488',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
