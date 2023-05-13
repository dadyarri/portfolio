const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const imageShortcode = require('./src/_11ty/shortcodes/image-shortcode');
const markdownLibrary = require('./src/_11ty/libraries/markdown-library');
const minifyHtml = require('./src/_11ty/utils/minify-html');
const markdownFilter = require('./src/_11ty/filters/markdown-filter');
const svgFilter = require('./src/_11ty/filters/svg-filter');
const browserSyncConfig = require('./src/_11ty/utils/browser-sync-config');
const tableOfContents = require('eleventy-plugin-toc');
const { readableDateFilter, machineDateFilter } = require('./src/_11ty/filters/date-filters');
const cardShortcode = require('./src/_11ty/shortcodes/card-shortcode');

module.exports = function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(tableOfContents, {
    tags: ['h2', 'h3'],
    ul: true
  });

  // Filters
  eleventyConfig.addFilter('markdown', markdownFilter);
  eleventyConfig.addFilter('readableDate', readableDateFilter);
  eleventyConfig.addFilter('machineDate', machineDateFilter);
  eleventyConfig.addFilter('svg', svgFilter);

  // Shortcodes
  eleventyConfig.addNunjucksAsyncShortcode('image', imageShortcode);
  eleventyConfig.addNunjucksAsyncShortcode('card', cardShortcode)

  // Libraries
  eleventyConfig.setLibrary('md', markdownLibrary);
  eleventyConfig.amendLibrary('md', md => md.use(require("markdown-it-eleventy-img")));

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  // Trigger a build when files in this directory change
  eleventyConfig.addWatchTarget('./src/assets/scss/');
  eleventyConfig.addWatchTarget('**/*.md');
  eleventyConfig.addWatchTarget('**/*.njk');

  // Minify HTML output
  eleventyConfig.addTransform('htmlmin', minifyHtml);

  // Don't process folders with static assets
  eleventyConfig.addPassthroughCopy('./src/favicon.ico');
  eleventyConfig.addPassthroughCopy('./src/admin');
  eleventyConfig.addPassthroughCopy('./src/assets/img');
  eleventyConfig.addPassthroughCopy({'./src/post-images': 'posts'});
  eleventyConfig.addPassthroughCopy('./src/assets/fonts');
  eleventyConfig.addPassthroughCopy('./src/assets/js/switchTheme.js');
  eleventyConfig.addPassthroughCopy('./src/assets/*.pdf');

  // Allow Turbolinks to work in development mode
  eleventyConfig.setBrowserSyncConfig(browserSyncConfig);

  return {
    templateFormats: ['md', 'njk', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    passthroughFileCopy: true,
    dir: {
      input: 'src',
      layouts: "_layouts"
    },
  };
};
