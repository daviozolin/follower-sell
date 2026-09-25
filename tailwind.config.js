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
        /** Verde-limão: ação primária, foco, estados positivos. */
        accent: { DEFAULT: token('color-accent'), soft: token('color-accent-soft'), ink: token('color-accent-ink') },
        /** Magenta: destaque de marca, "mais escolhido", premium. */
        magenta: { DEFAULT: token('color-magenta'), soft: token('color-magenta-soft') },
        success: token('color-success'),
        warning: token('color-warning'),
        danger: token('color-danger'),
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Inter Variable"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--color-accent) / 0.55), 0 12px 40px -12px rgb(var(--color-accent) / 0.45)',
        'glow-magenta': '0 0 0 1px rgb(var(--color-magenta) / 0.6), 0 14px 44px -12px rgb(var(--color-magenta) / 0.55)',
        'glow-success': '0 0 0 1px rgb(var(--color-success) / 0.5), 0 10px 40px -12px rgb(var(--color-success) / 0.45)',
        card: '0 1px 0 0 rgb(255 255 255 / 0.05) inset, 0 24px 60px -32px rgb(0 0 0 / 0.9)',
        brutal: '6px 6px 0 0 rgb(var(--color-canvas))',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.9)', opacity: '0.7' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
        marquee: 'marquee 38s linear infinite',
      },
    },
  },
  plugins: [],
};
