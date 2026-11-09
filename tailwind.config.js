/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinova: {
          bg: '#F7F9F6',
          'bg-subtle': '#F0F5EF',
          card: '#FFFFFF',
          sidebar: '#FFFFFF',
          sage: '#779985',
          'sage-dark': '#456B56',
          'sage-light': '#DFEAE0',
          'sage-hover': '#658572',
          teal: '#8BAFA3',
          'teal-light': '#E7F1ED',
          beige: '#F4EBDD',
          peach: '#F3E5DC',
          lavender: '#EEEAF5',
          'text-primary': '#35463B',
          'text-secondary': '#758278',
          'text-muted': '#96A499',
          border: '#E4EAE3',
          'border-subtle': '#EEF2EC',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'Manrope',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'clinova-sm': '0 1px 3px 0 rgba(69, 107, 86, 0.04), 0 1px 2px -1px rgba(69, 107, 86, 0.03)',
        'clinova-card': '0 2px 8px -2px rgba(69, 107, 86, 0.05), 0 1px 4px -1px rgba(69, 107, 86, 0.03)',
        'clinova-hover': '0 8px 24px -6px rgba(69, 107, 86, 0.08), 0 2px 6px -2px rgba(69, 107, 86, 0.04)',
        'clinova-dropdown': '0 12px 32px -4px rgba(69, 107, 86, 0.12), 0 4px 12px -2px rgba(69, 107, 86, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      }
    },
  },
  plugins: [],
}

