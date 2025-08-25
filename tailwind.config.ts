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
        'wedding-pink': '#FFB6C1',
        'wedding-gold': '#FFD700',
        'wedding-white': '#FFFAFA',
        'wedding-green': '#90EE90',
      },
    },
  },
  plugins: [],
}
export default config