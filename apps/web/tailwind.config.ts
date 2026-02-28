import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#14141F',
        card: '#1A1A2E',
        border: '#2A2A3E',
        'border-hover': '#3A3A4E',
        positive: '#00D4AA',
        'positive-dim': '#00D4AA33',
        negative: '#FF4757',
        'negative-dim': '#FF475733',
        muted: '#8888AA',
        'text-primary': '#F0F0FF',
        'text-secondary': '#A0A0C0',
        accent: '#00D4AA',
        'accent-hover': '#00E4BA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
