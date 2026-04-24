import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#7089F9',
          500: '#4F6EF7',
          600: '#3A56E8',
          muted: 'rgba(79, 110, 247, 0.15)',
        },
        sidebar: '#181B20',
        surface: {
          base: '#0a0a0f',
          card: '#13131a',
          input: '#1c1c26',
          hover: '#1e1e2a',
        },
      },
      fontFamily: {
        ui: ['Inter', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
        md: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['28px', '36px'],
      },
      borderRadius: {
        card: '10px',
        input: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config
