/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // 1) Nettere diepte-perspectieven
      perspective: {
        '500':  '500px',
        '1000': '1000px',
        '1500': '1500px',
      },
      // 2) Extra ‘plaat’-achtige schaduwen
      boxShadow: {
        '3d-sm': '0 5px 15px rgba(0, 0, 0, 0.4)',
        '3d-md': '0 10px 30px rgba(0, 0, 0, 0.5)',
        '3d-lg': '0 20px 60px rgba(0, 0, 0, 0.6)',
      },
      // 3) Grotere hover-scales
      scale: {
        '103': '1.03',
        '105': '1.05',
      },
    },
  },
  plugins: [
    // hier kun je forms, typography etc. toevoegen als je wilt
  ],
};
