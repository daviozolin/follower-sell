/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        canvas: token('color-canvas'),
        surface: { DEFAULT: token('color-surface'), raised: token('color-surface-raised') },
        line: token('color-line'),
        ink: { DEFAULT: token('color-ink'), muted: token('color-ink-muted'), faint: token('color-ink-faint') },
        accent: { DEFAULT: token('color-accent'), soft: token('color-accent-soft') },
        success: token('color-success'),
        warning: token('color-warning'),
        danger: token('color-danger'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--color-accent) / 0.45), 0 10px 40px -10px rgb(var(--color-accent) / 0.55)',
        'glow-success': '0 0 0 1px rgb(var(--color-success) / 0.45), 0 10px 40px -12px rgb(var(--color-success) / 0.5)',
        card: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 20px 50px -30px rgb(0 0 0 / 0.8)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.9)', opacity: '0.7' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
