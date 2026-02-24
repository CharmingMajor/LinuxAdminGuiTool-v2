/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a0b',
          50: '#18181b',
          100: '#1e1e22',
          200: '#27272a',
          300: '#3f3f46',
        },
        brand: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
          muted: 'rgba(59,130,246,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
