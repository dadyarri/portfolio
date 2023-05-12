const Image = require('@11ty/eleventy-img');
const path = require('path');

async function imageShortcode (src, alt, sizes, classes, loading = 'lazy') {
  let imageSrc = `${path.dirname(this.page.inputPath)}/${src}`;
  let metadata = await Image(imageSrc, {
    widths: [25, 320, 640, 960, 1200, 1800, 2400],
    formats: ['webp', 'png'],
    urlPath: '/assets/img/',
    outputDir: '_site/assets/img/',
  });

  let imageAttributes = {
    class: classes,
    alt,
    sizes: '100vw',
    loading,
    decoding: 'async',
  };

  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = imageShortcode;