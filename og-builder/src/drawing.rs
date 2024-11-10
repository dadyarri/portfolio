use std::collections::HashMap;
use rusttype::Font;
use svg::{Document, Node};
use svg::node::element::{Rectangle, Text};
use crate::{preamble, structs, text};
use crate::structs::{FontWeight, OgConfig, Side};

pub fn build_document(nodes: Vec<Box<dyn Node>>, width: i32, height: i32) -> Document {
    let mut document = Document::new().set("viewBox", (0, 0, width, height));
    for node in nodes {
        document = document.add(node);
    }
    document
}

pub fn create_rectangle(x: i32, y: i32, width: i32, height: i32, fill: &str) -> Rectangle {
    Rectangle::new()
        .set("x", x)
        .set("y", y)
        .set("width", width)
        .set("height", height)
        .set("fill", fill)
}

pub fn create_text(content: &str, font_family: &str, fill: String, font_size: i32, font_weight: &FontWeight, x: i32, y: i32) -> Text {
    Text::new(content)
        .set("font-family", font_family)
        .set("fill", fill)
        .set("font-size", font_size)
        .set("font-weight", font_weight.to_string().to_lowercase())
        .set("x", x)
        .set("y", y)
}

pub fn create_border_rectangle(border: &structs::BorderConfig, image_width: i32, image_height: i32) -> Rectangle {
    match border.side {
        Side::Left => create_rectangle(0, 0, border.stroke_width, image_height, &border.stroke),
        Side::Right => create_rectangle(image_width - border.stroke_width, 0, border.stroke_width, image_height, &border.stroke),
        Side::Bottom => create_rectangle(0, image_height - border.stroke_width, image_width, border.stroke_width, &border.stroke),
        Side::Top => create_rectangle(0, 0, image_width, border.stroke_width, &border.stroke),
    }
}

pub fn calculate_total_height(config: &OgConfig, preamble: &toml::Value, fonts: &HashMap<String, Font>) -> anyhow::Result<i32> {
    let mut total_height = 0;

    for section in &config.sections {
        let font = fonts.get(&section.font_family).unwrap_or(fonts.values().next().unwrap());
        let mut section_height = 0;

        if let Some(value) = preamble::get_nested_value(&preamble, &section.preamble_key) {
            if value.is_str() {
                let value_str = value.as_str().unwrap();
                if section.wrap_lines {
                    let wrapped_lines = text::wrap_text(value_str, &font, section.font_size, (config.image.width - (config.image.padding * 15)) as f32)?;
                    section_height = wrapped_lines.len() as i32 * section.font_size * section.line_height;
                } else {
                    section_height = section.font_size * section.line_height;
                }
            } else if value.is_array() {
                section_height = section.font_size * section.line_height;
            }
        }

        total_height += section_height;
    }

    Ok(total_height)
}