module.exports = {
    plugins: [
      require('postcss-import'),
      require('autoprefixer'),
      require('cssnano'),
      require('tailwindcss/nesting'),
      require('tailwindcss')
    ],
  };