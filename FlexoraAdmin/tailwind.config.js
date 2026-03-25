/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#18A57A',
          light: '#22B38A',
          dark: '#0E6A53',
          accent: '#3B82F6',
          bg: '#F4F8FB',
          panel: '#EDF3F8',
          card: '#FFFFFF',
          border: '#D6E2EE',
          text: '#142536',
          muted: '#61758A'
        }
      },
      boxShadow: {
        soft: '0 12px 28px rgba(22, 40, 64, 0.12)',
      },
      borderRadius: {
        xl2: '1rem',
      }
    },
  },
  plugins: [],
};
