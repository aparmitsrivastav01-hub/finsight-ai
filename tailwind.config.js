/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0F',
        'deep-slate': '#111118',
        'teal-core': '#00D4AA',
        'electric-teal': '#00FFD1',
        'deep-emerald': '#00A67E',
        'surface-dark': '#16161F',
        'border-mist': '#1E1E2E',
        'muted-ink': '#6B7280',
        'soft-white': '#F0F4F8',
        'frosted-teal': 'rgba(0,212,170,0.07)',
        success: '#00C896',
        warning: '#F5A623',
        error: '#FF4D6D',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,170,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0,212,170,0.6)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      backgroundImage: {
        'grid-teal':
          'linear-gradient(rgba(0,212,170,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.03) 1px, transparent 1px)',
        'hero-radial':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,212,170,0.15), transparent)',
        'cta-radial':
          'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,212,170,0.1), transparent)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        'teal-glow': '0 0 30px rgba(0,212,170,0.25)',
        'teal-glow-lg': '0 0 60px rgba(0,212,170,0.35)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,170,0.2)',
        card: '0 4px 16px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [animate],
};