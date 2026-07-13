/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
        'surface-active': 'rgb(var(--color-surface-active) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
          // Pre-baked alpha tokens: consumed as-is, not via alpha modifiers.
          bg: 'var(--color-accent-bg)',
          border: 'var(--color-accent-border)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          bg: 'var(--color-danger-bg)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
        },
      },
      textColor: {
        primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        faint: 'rgb(var(--color-text-faint) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          '"SF Pro Text"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Noto Sans SC"',
          '"Microsoft YaHei"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"Fira Code"',
          '"JetBrains Mono"',
          'Menlo',
          'Monaco',
          'monospace',
        ],
      },
      borderRadius: {
        // Semantic radius scale. Small controls (list rows, inputs, hover-action
        // chips) collapse the former 3/4/5/6px literals into one consistent
        // step; cards and panels get their own steps.
        control: '6px',
        card: '8px',
        panel: '12px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        popover: 'var(--shadow-popover)',
        modal: 'var(--shadow-modal)',
        border: 'var(--shadow-border)',
        'border-hover': 'var(--shadow-border-hover)',
      },
    },
  },
  plugins: [],
}
