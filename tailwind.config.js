/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        supply: '#F44336',      // Czerwony - zasilanie
        return: '#2196F3',      // Niebieski - powrót
        exclusion: '#9E9E9E',   // Szary - strefy bez grzania
        edge: '#FFC107',        // Pomarańczowy - strefy brzegowe
        manifold: '#4CAF50',    // Zielony - rozdzielacz
      },
    },
  },
  plugins: [],
}
