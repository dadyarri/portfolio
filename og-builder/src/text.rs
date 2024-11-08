use anyhow::Result;
use rusttype::{point, Font, Scale};

fn measure_text_dimensions(text: &str, font: &Font, scale: Scale) -> Result<f32> {
    let width = font
        .layout(text, scale, point(40.0, 40.0))
        .map(|g| g.position().x)
        .last()
        .unwrap_or(0.0);

    Ok(width)
}

pub fn measure_text_dimensions_pub(text: &str, font: &Font, font_size: i32) -> Result<f32> {
    let scale = Scale::uniform(font_size as f32);

    measure_text_dimensions(text, font, scale)
}

pub fn wrap_text(text: &str, font: &Font, font_size: i32, canvas_width: f32) -> Result<Vec<String>> {
    let scale = Scale::uniform(font_size as f32);
    let mut lines: Vec<String> = Vec::new();
    let mut current_line = String::new();
    let mut current_line_width = 0.0;

    let space_width = measure_text_dimensions(" ", font, scale)?;

    for word in text.split_whitespace() {
        let word_width = measure_text_dimensions(word, font, scale)?;

        if current_line_width + word_width > canvas_width {
            lines.push(current_line.trim().to_string());
            current_line = String::new();
            current_line_width = 0.0;
        }

        current_line.push_str(word);
        current_line.push(' ');
        current_line_width += word_width + space_width;
    }

    if !current_line.is_empty() {
        lines.push(current_line.trim().to_string());
    }


    Ok(lines)
}