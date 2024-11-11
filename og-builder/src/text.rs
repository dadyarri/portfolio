use anyhow::{Result};
use rusttype::{point, Font, Scale};
use log::{debug};

// Public function to measure the width of the given text, specifying the font size
pub fn measure_text_width(text: &str, font: &Font, font_size: i32) -> Result<f32> {
    let scale = Scale::uniform(font_size as f32);
    debug!("Measuring dimensions for text: '{}', with scale: {:?}", text, scale);
    let width = font
        .layout(text, scale, point(40.0, 40.0))
        .map(|g| g.position().x)
        .last()
        .unwrap_or(0.0);

    debug!("Measured width: {}", width);
    Ok(width)
}

// Function to wrap text to fit within the specified canvas width
pub fn wrap_text(text: &str, font: &Font, font_size: i32, canvas_width: f32) -> Result<Vec<String>> {
    let mut lines: Vec<String> = Vec::new();
    let mut current_line = String::new();
    let mut current_line_width = 0.0;

    let space_width = measure_text_width(" ", font, font_size)?;
    debug!("Wrapping text to fit canvas width: {}", canvas_width);

    for word in text.split_whitespace() {
        let word_width = measure_text_width(word, font, font_size)?;

        // Check if adding the word would exceed the canvas width
        if current_line_width + word_width > canvas_width {
            debug!("Line exceeds canvas width. Creating new line.");
            lines.push(current_line.trim().to_string());
            current_line = String::new();
            current_line_width = 0.0;
        }

        current_line.push_str(word);
        current_line.push(' ');
        current_line_width += word_width + space_width;
    }

    // Push the remaining line if not empty
    if !current_line.is_empty() {
        lines.push(current_line.trim().to_string());
    }

    debug!("Successfully wrapped text into {} lines", lines.len());
    Ok(lines)
}
