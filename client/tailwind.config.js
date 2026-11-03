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
          DEFAULT: '#3498F6',
          50: '#F4F7FB',
          100: '#E1EBF7',
          200: '#C3D7EF',
          300: '#92BCE7',
          400: '#5FA0DF',
          500: '#3498F6', // Primary Blue
          600: '#2563EB',
          700: '#1976D2', // Dark Blue
          800: '#155FB5',
          900: '#172033', // Primary Text
          950: '#0F172A',
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
        },
        brand: {
          blue: '#3498F6',
          darkBlue: '#1976D2',
          bg: '#F4F7FB',
          text: '#172033',
          muted: '#7B8494',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        luxury: {
          navy: '#101D2B',
          surface: '#17283A',
          gold: '#C5A46D',
          goldHover: '#D8B881',
          goldLight: '#E8D7B8',
          white: '#FFFFFF',
          offwhite: '#F5F3EE',
          muted: '#A9B0B8',
          divider: '#354252',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(23, 32, 51, 0.06), 0 2px 6px -1px rgba(23, 32, 51, 0.04)',
        'card': '0 10px 30px -4px rgba(52, 152, 246, 0.08), 0 4px 12px -2px rgba(23, 32, 51, 0.03)',
        'blue-glow': '0 8px 25px -4px rgba(52, 152, 246, 0.35)',
        'gold-glow': '0 4px 20px -2px rgba(197, 164, 109, 0.25)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'Cambria', 'serif'],
      }
    },
  },
  plugins: [],
}
