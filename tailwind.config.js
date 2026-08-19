/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#0F1115',
          panel: '#1A1D24',
          line: '#2A2F3A',
          primary: '#3B82F6',
          text: '#E5E7EB',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        status: {
          pending: '#4B5563',
          running: '#F59E0B',
          passed: '#10B981',
          failed: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
