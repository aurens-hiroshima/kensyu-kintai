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
        primary: {
          50:  '#ebf0ff',
          100: '#d6e2ff',
          500: '#1a56db',
          600: '#1342b0',
          700: '#0f3389',
        },
      },
    },
  },
  plugins: [],
}

export default config
