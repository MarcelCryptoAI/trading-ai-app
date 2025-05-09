// frontend/postcss.config.cjs
module.exports = {
  plugins: {
    // Dit was eerst 'tailwindcss', maar we gebruiken nu de aparte PostCSS-plugin
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
