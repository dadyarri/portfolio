/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: [
      require('autoprefixer'),
      require('cssnano')
    ]
  }
  
  export default config