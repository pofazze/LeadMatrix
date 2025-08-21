import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
  './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SF Pro Text',
          'SF Pro Display',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif'
        ]
      },
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9ecff',
          200: '#b8dbff',
          300: '#8ac3ff',
          400: '#59a5ff',
          500: '#2f84ff',
          600: '#1b66e6',
          700: '#164db4',
          800: '#163f8c',
          900: '#16356f',
        }
      },
      container: { center: true, padding: '1rem' }
    }
  },
  plugins: []
} satisfies Config
