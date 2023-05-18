const { createCanvas } = require('canvas');

module.exports = (text, font) => {
    // Create a hidden <span> element
    const canvas = createCanvas(200, 100);
    const ctx = canvas.getContext('2d');

    // Set the font
    ctx.font = font;

    // Measure the width of the text
    const width = ctx.measureText(text).width;

    // Return the calculated width
    return width;
  }