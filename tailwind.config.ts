import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AMSMA brand palette — see /docs/design-system.md
        stone: {
          50:  '#faf9f6',
          100: '#f5f4f0',
          300: '#d1d5db',
          500: '#6b7280',
          700: '#3d434e',
          800: '#2a2f38',
          900: '#1a1d24',
          950: '#0f1114',
        },
        amber: {
          DEFAULT: '#d97b30',
          light:   '#e8a838',
        },
        terracotta: '#a54a2a',
        sage:       '#6b7d5c',
        success:    '#4a7c59',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
        sans:    ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
