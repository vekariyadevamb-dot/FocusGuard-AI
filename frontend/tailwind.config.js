/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        bg: {
          main: '#090A12',
          secondary: '#0E1020',
          sidebar: '#080910',
        },
        surface: {
          base: '#0E1020',
          card: '#121426',
          elevated: '#15172A',
          hover: '#1B1D35',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.04)',
          borderHighlight: 'rgba(139, 92, 246, 0.35)',
        },
        text: {
          primary: '#F5F3FF',
          secondary: '#A1A1B5',
          muted: '#63657E',
        },
        brand: {
          violet: '#8B5CF6',
          brightViolet: '#A78BFA',
          violetMuted: 'rgba(139, 92, 246, 0.12)',
          violetBorder: 'rgba(139, 92, 246, 0.28)',
          cyan: '#38BDF8',
          cyanMuted: 'rgba(56, 189, 248, 0.12)',
          cyanBorder: 'rgba(56, 189, 248, 0.28)',
          pink: '#EC4899',
          pinkMuted: 'rgba(236, 72, 153, 0.12)',
        },
        status: {
          attentive: '#34D399',
          attentiveMuted: 'rgba(52, 211, 153, 0.12)',
          attentiveBorder: 'rgba(52, 211, 153, 0.28)',
          warning: '#FBBF24',
          warningMuted: 'rgba(251, 191, 36, 0.12)',
          warningBorder: 'rgba(251, 191, 36, 0.28)',
          critical: '#FB7185',
          criticalMuted: 'rgba(251, 113, 133, 0.12)',
          criticalBorder: 'rgba(251, 113, 133, 0.28)',
        }
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'elevated': '0 16px 36px -4px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'glow-violet': '0 0 30px -4px rgba(139, 92, 246, 0.35)',
        'glow-cyan': '0 0 30px -4px rgba(56, 189, 248, 0.3)',
        'glow-attentive': '0 0 25px -4px rgba(52, 211, 153, 0.35)',
      }
    },
  },
  plugins: [],
}
