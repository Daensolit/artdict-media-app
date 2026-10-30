/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#070709',
          surface: '#0c0d14',
          elevated: '#12141f',
          subtle: '#181b2a',
        },
        studio: {
          amber: '#f59e0b',
          orange: '#f97316',
          rose: '#f43f5e',
          cyan: '#06b6d4',
          indigo: '#6366f1',
          emerald: '#10b981',
        },
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Apple studio electric orange/amber
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#070709',
        }
      },
      boxShadow: {
        'glass-rim': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.16), 0 16px 40px -8px rgba(0, 0, 0, 0.65)',
        'glass-hover': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.28), 0 24px 48px -8px rgba(0, 0, 0, 0.8), 0 0 24px -4px rgba(249, 115, 22, 0.12)',
        'glow-primary': '0 0 24px -2px rgba(249, 115, 22, 0.35)',
        'glow-cyan': '0 0 24px -2px rgba(6, 182, 212, 0.35)',
        'glow-indigo': '0 0 24px -2px rgba(99, 102, 241, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
        'float-slow': 'floatSlow 12s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '0.08', transform: 'scale(1)' },
          '50%': { opacity: '0.14', transform: 'scale(1.05)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20px, 30px)' },
        }
      }
    },
  },
  plugins: [],
}
