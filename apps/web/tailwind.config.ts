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
          400: '#F07038',
          500: '#E06028',
          600: '#C85020',
          muted: 'rgba(224, 96, 40, 0.15)',
          secondary: '#4B8EC4',
          'secondary-muted': 'rgba(75, 142, 196, 0.15)',
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
