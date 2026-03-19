/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // scope utilities to #tw-root so Tailwind's reset doesn't override MUI
  important: '#tw-root',
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0a0d14',
          800: '#111827',
          700: '#1e2535',
          600: '#2a3347',
          500: '#3b4a62',
          accent:      '#6366f1',
          accentHover: '#4f46e5',
          gold:  '#f59e0b',
          green: '#22c55e',
          red:   '#ef4444',
        },
      },
      fontFamily: {
        sans: ["'Inter'", "'Segoe UI'", 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.4s ease-out both',
        'marquee':    'marquee 28s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};


