import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ゼクシィ風結婚式カラーパレット
        'wedding-pink': {
          50: '#FFF0F5',
          100: '#FFE4ED',
          200: '#FFC9DB',
          300: '#FFADC9',
          400: '#FF91B7',
          500: '#E91E63',
          600: '#D81B60',
          700: '#C2185B',
        },
        'wedding-rose': {
          50: '#FFF5F7',
          100: '#FFE8EE',
          200: '#FFD1DD',
          300: '#FFBACC',
        },
        'wedding-gold': {
          100: '#FFF8E1',
          200: '#FFECB3',
          300: '#FFE082',
          400: '#FFD54F',
          500: '#FFC107',
        },
        'wedding-lavender': {
          50: '#F5F0FF',
          100: '#EDE7FF',
          200: '#D6C7FF',
          300: '#C0A7FF',
        },
        'wedding-white': '#FFFAFA',
        'wedding-cream': {
          50: '#FFFBF5',
          100: '#FFF8ED',
          200: '#FFF0DB',
        },
      },
      fontFamily: {
        rounded: ['"M PLUS Rounded 1c"', 'ui-rounded', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        handwriting: ['var(--font-handwriting)', 'cursive'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
export default config