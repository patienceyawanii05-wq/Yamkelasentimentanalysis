/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec1ff',
          400: '#599dff',
          500: '#3478f6',
          600: '#1f5be0',
          700: '#1947b8',
          800: '#1a3d95',
          900: '#1b3776',
          950: '#15244a',
        },
        surface: {
          light: '#ffffff',
          'light-subtle': '#f8fafc',
          'light-border': '#e2e8f0',
          dark: '#0f172a',
          'dark-subtle': '#1e293b',
          'dark-border': '#334155',
        },
        sentiment: {
          positive: '#10b981',
          neutral: '#64748b',
          negative: '#ef4444',
        },
        emotion: {
          joy: '#f59e0b',
          anger: '#ef4444',
          sadness: '#3b82f6',
          fear: '#8b5cf6',
          surprise: '#ec4899',
          neutral: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
