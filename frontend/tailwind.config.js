/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  'var(--bg-primary)',
        surface:  'var(--bg-surface)',
        sidebar:  'var(--bg-sidebar)',
        gold:     'var(--accent-gold)',
        crimson: {
          DEFAULT: 'var(--accent-red)',
          hover:   'var(--accent-red-hover)',
        },
        muted:   'var(--text-muted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        sans:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
