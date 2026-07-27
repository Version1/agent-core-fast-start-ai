import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fast: {
          bg: '#f4f6f8',
          panel: '#ffffff',
          sidebar: '#003A46',
          'sidebar-active': 'rgba(255,255,255,0.12)',
          text: '#1a2332',
          muted: '#64748b',
          teal: '#003A46',
          'teal-light': '#e8eff1',
          cyan: '#003A46',
          blue: '#003A46',
          'blue-light': '#e8eff1',
          'red-light': '#fef2f2',
          'orange-light': '#fff7ed',
          'purple-light': '#f5f3ff',
          'green-light': '#e8eff1',
          approved: '#003A46',
          declined: '#f44336',
          pending: '#ffc107',
          escalated: '#ff9800',
          urgent: '#f44336',
          high: '#ff9800',
          standard: '#64748b',
          low: '#94a3b8',
          caseworker: '#003A46',
          manager: '#003A46',
          admin: '#7c3aed',
        },
      },
      borderRadius: {
        card: '6px',
        chip: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};

export default config;
