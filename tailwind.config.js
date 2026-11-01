/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Figtree', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        card: 'var(--card)',
        'card-2': 'var(--card-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        ember: 'var(--ember)',
        sun: 'var(--sun)',
        berry: 'var(--berry)',
        mint: 'var(--mint)',
        sky: 'var(--sky)',
        grape: 'var(--grape)',
        crack: 'var(--crack)',
      },
      boxShadow: {
        pop: '0 1px 2px rgba(27,19,53,.05), 0 14px 32px -18px rgba(27,19,53,.24)',
        'pop-sm': '0 1px 2px rgba(27,19,53,.08)',
        'pop-lg': '0 2px 4px rgba(27,19,53,.06), 0 24px 48px -20px rgba(27,19,53,.3)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
