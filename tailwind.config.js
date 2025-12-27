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
        // Primary accent colors
        'accent': {
          cyan: '#00d4ff',
          purple: '#a855f7',
          pink: '#ec4899',
          orange: '#f97316',
          green: '#10b981',
          blue: '#3b82f6',
        },
        // Dark mode backgrounds
        'dark': {
          50: '#1a1a2e',
          100: '#16162a',
          200: '#12121f',
          300: '#0f0f1a',
          400: '#0a0a14',
          500: '#06060c',
          600: '#040408',
          700: '#020204',
          800: '#010102',
          900: '#000000',
        },
        // Light mode backgrounds
        'light': {
          50: '#ffffff',
          100: '#f8fafc',
          200: '#f1f5f9',
          300: '#e2e8f0',
          400: '#cbd5e1',
          500: '#94a3b8',
          600: '#64748b',
          700: '#475569',
          800: '#334155',
          900: '#1e293b',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
        'display': ['Outfit', 'Inter', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient': 'gradient 8s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { 
            boxShadow: '0 0 5px var(--glow-color, rgba(0, 212, 255, 0.2))',
          },
          '100%': { 
            boxShadow: '0 0 20px var(--glow-color, rgba(0, 212, 255, 0.4))',
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, var(--mesh-1) 0%, var(--mesh-2) 50%, var(--mesh-3) 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px var(--glow-color, rgba(0, 212, 255, 0.3))',
        'glow': '0 0 20px var(--glow-color, rgba(0, 212, 255, 0.3))',
        'glow-lg': '0 0 40px var(--glow-color, rgba(0, 212, 255, 0.4))',
        'inner-glow': 'inset 0 0 20px var(--glow-color, rgba(0, 212, 255, 0.1))',
      }
    },
  },
  plugins: [],
}
