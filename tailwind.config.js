/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original colors
        supply: '#F44336',      // Czerwony - zasilanie
        return: '#2196F3',      // Niebieski - powrót
        exclusion: '#9E9E9E',   // Szary - strefy bez grzania
        edge: '#FFC107',        // Pomarańczowy - strefy brzegowe
        manifold: '#4CAF50',    // Zielony - rozdzielacz

        // Modern minimal UI colors
        background: '#F8F9FA',
        canvas: '#FFFFFF',
        grid: '#E9ECEF',
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        accent: '#10B981',
        danger: '#EF4444',
        text: {
          DEFAULT: '#1F2937',
          light: '#6B7280',
        },
        heating: {
          start: '#F59E0B',
          end: '#EF4444',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
