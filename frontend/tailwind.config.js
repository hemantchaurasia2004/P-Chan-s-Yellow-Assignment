/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ec',
          100: '#fdebd3',
          200: '#fad4a5',
          300: '#f7b76d',
          400: '#f49032',
          500: '#f17a13',
          600: '#e25d09',
          700: '#bb430a',
          800: '#96350f',
          900: '#7a2d10',
        },
        dark: {
          50: '#f6f6f7',
          100: '#e2e3e5',
          200: '#c4c6ca',
          300: '#9fa2a8',
          400: '#7a7e86',
          500: '#60636b',
          600: '#4c4e55',
          700: '#3f4146',
          800: '#35373b',
          900: '#1a1b1e',
          950: '#0d0e10',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
