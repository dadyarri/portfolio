const Image = require('@11ty/eleventy-img');
const path = require('path');

async function imageShortcode (src, alt, caption = "", sizes, classes, loading = 'lazy') {
  let imageSrc = `${path.dirname(this.page.inputPath)}/${src}`;

  function wrapFigure(output, caption) {
    return `
      <figure>
        ${output}
        <figcaption>${caption}</figcaption>
      <figure>
    `;
  }

  let metadata = await Image(imageSrc, {
    widths: [25, 320, 640, 960, 1200, 1800, 2400],
    formats: ['webp', 'png'],
    urlPath: '/assets/img/',
    outputDir: '_site/assets/img/',
  });

  let imageAttributes = {
    class: classes,
    alt: alt,
    sizes: sizes ?? "100vw",
    loading: loading,
    decoding: 'async',
  };


  const generated = Image.generateHTML(metadata, imageAttributes);

  return caption ? wrapFigure(generated, caption) : generated;
}

module.exports = imageShortcode;