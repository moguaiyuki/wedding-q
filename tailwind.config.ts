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
        // 旧カラー（互換性のため保持）
        'wedding-pink': '#FFB6C1',
        'wedding-gold': '#FFD700',
        'wedding-white': '#FFFAFA',
        'wedding-green': '#90EE90',
        // 新デザインシステムのカラーパレット
        'quiz-beige': {
          50: '#FAF8F5',
          100: '#F5F1E8',
          200: '#EDE7DB',
        },
        'quiz-yellow': {
          100: '#FFF4D4',
          200: '#FFE4A3',
          300: '#FFD770',
        },
        'quiz-pink': {
          100: '#FFE3EB',
          200: '#FFD6E0',
          300: '#FFB6C1',
        },
        'quiz-blue': {
          100: '#D9EEF2',
          200: '#C5E3E8',
          300: '#B3D9E8',
        },
        'quiz-green': {
          100: '#D9F2E3',
          200: '#C5E8D4',
          300: '#B3E8C5',
        },
        'quiz-purple': {
          100: '#F0E8F7',
          200: '#E3D5F0',
          300: '#D8C5E8',
        },
        'quiz-coral': {
          400: '#FF8B7B',
          500: '#FF6B6B',
          600: '#FF5252',
        },
        'quiz-teal': {
          400: '#6AA0A5',
          500: '#5C8A8F',
          600: '#4A7C7F',
        },
      },
      fontFamily: {
        rounded: ['"M PLUS Rounded 1c"', 'ui-rounded', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
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