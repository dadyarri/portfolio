use crate::drawing::*;
use crate::structs::{Cli, OgConfig};
use anyhow::{anyhow, Context, Result};
use chrono::{DateTime, NaiveDate};
use clap::Parser;
use log::{error, info, warn};
use rusttype::Font;
use std::collections::HashMap;
use std::fs;
use std::path::{PathBuf};
use std::time::Instant;
use svg::{Node};
use walkdir::WalkDir;

mod parser;
mod structs;
mod text;
mod paths;
mod image;
mod preamble;
mod drawing;

fn main() -> Result<()> {
    env_logger::init();
    let args = Cli::parse();
    info!("Parsed command-line arguments: {:?}", args);

    let root_path = paths::get_git_root()?;
    info!("Working directory: {:?}", root_path);

    let config_path = root_path.join("ogconfig.toml");
    let config = parser::parse_config(&config_path)?;

    let fonts = load_fonts(&config, &root_path)?;

    for section in args.sections.iter() {
        info!("Processing section: {:?}", section);
        let content_path = root_path.join("content").join(section);
        if let Err(e) = process_content(&content_path, &config, &fonts) {
            error!("Failed to process content for section {:?}: {}", section, e);
        }
    }

    Ok(())
}

fn load_fonts<'a>(config: &'a OgConfig, root: &'a PathBuf) -> Result<HashMap<String, Font<'a>>> {
    let mut fonts = HashMap::new();

    for font_config in &config.fonts {
        let font_path = root.join(&font_config.path);

        match fs::read(&font_path) {
            Ok(font_data) => {
                if let Some(font) = Font::try_from_vec(font_data) {
                    info!("Loaded font: {:?}", font_config.name);
                    fonts.insert(font_config.name.clone(), font);
                } else {
                    warn!("Failed to parse font at {:?}", font_path);
                }
            }
            Err(_) => warn!("Could not read font file at {:?}", font_path),
        }
    }

    Ok(fonts)
}

fn process_content(content_path: &PathBuf, config: &OgConfig, fonts: &HashMap<String, Font>) -> Result<()> {
    if !content_path.exists() {
        return Err(anyhow!("Path {:?} does not exist", content_path));
    }

    let root_path = paths::get_git_root()?;
    let mut total_time = 0;

    for entry in WalkDir::new(content_path).max_depth(2).into_iter() {
        let file = entry?;
        let file_name = file.file_name().to_string_lossy();

        if file_name.ends_with(".md") && !file_name.starts_with('_') {
            let post_path = file.path();
            let readable_name = paths::get_readable_directory(&mut post_path.to_path_buf())?;
            info!("Processing file: {:?}", readable_name);

            let start_time = Instant::now();
            let absolute_path = post_path.canonicalize()?;
            let absolute_path_str = absolute_path.to_str().ok_or(anyhow!("Invalid file path"))?;

            match parser::parse_preamble(absolute_path_str) {
                Ok(preamble) => {
                    // Calculate starting Y coordinate by determining the total height of content
                    let total_height = calculate_total_height(config, &preamble, fonts)?;
                    let mut current_y = (config.image.height - total_height) / 2 + config.image.padding;

                    // Create new document by adding nodes
                    let mut nodes: Vec<Box<dyn Node>> = vec![];

                    // Add background
                    let background = create_rectangle(0, 0, config.image.width, config.image.height, &config.background.fill);
                    nodes.push(background.into());

                    // Draw borders, if any
                    for border in &config.background.borders {
                        let border_rect = create_border_rectangle(border, config.image.width, config.image.height);
                        nodes.push(border_rect.into());
                    }

                    // Draw sections
                    for section in &config.sections {
                        section.validate().unwrap();
                        let font = fonts.get(&section.font_family).unwrap_or(fonts.values().next().unwrap());
                        let font_family = if !section.font_family.is_empty() { &section.font_family } else { fonts.keys().next().unwrap() };

                        match section.is_simple() {
                            Ok(true) => {
                                match preamble::get_nested_value(&preamble, section.preamble_key.as_deref().unwrap_or("")) {
                                    None => {
                                        if section.optional {
                                            warn!("{0:#?} is not in preamble of {1}", section.preamble_key, readable_name)
                                        } else {
                                            return Err(anyhow!("{0:#?} is not in preamble of {1}", section.preamble_key, readable_name));
                                        }
                                    }
                                    Some(value) => {
                                        if let Some(list_options) = &section.list {
                                            let value_arr: Vec<&str> = value
                                                .as_array()
                                                .unwrap()
                                                .iter()
                                                .map(|i| i.as_str().unwrap())
                                                .collect();

                                            if let Some(background_options) = &section.background {
                                                let mut current_x = config.image.padding;
                                                for item in value_arr {
                                                    let label_width = text::measure_text_width(item, &font, section.font_size).unwrap_or(0f32) as i32;
                                                    let item_background = create_rectangle(
                                                        current_x,
                                                        current_y,
                                                        label_width + (background_options.padding * 2),
                                                        section.font_size * section.line_height + (background_options.padding * 2),
                                                        &background_options.fill,
                                                    );

                                                    let text_element = create_text(
                                                        item,
                                                        font_family,
                                                        section.fill.clone(),
                                                        section.font_size,
                                                        &section.font_weight,
                                                        current_x + background_options.padding,
                                                        current_y + background_options.padding + section.font_size,
                                                    );

                                                    nodes.push(item_background.into());
                                                    nodes.push(text_element.into());

                                                    current_x += label_width + (list_options.margin * 3);
                                                }
                                            }
                                        } else {
                                            let current_x = config.image.padding;
                                            let value_str = value.as_str().unwrap();

                                            if section.wrap_lines {
                                                let wrapped_lines = text::wrap_text(value_str, &font, section.font_size, (config.image.width - (config.image.padding * 15)) as f32)?;

                                                for line in wrapped_lines {
                                                    let text_element = create_text(
                                                        &line,
                                                        font_family,
                                                        section.fill.clone(),
                                                        section.font_size,
                                                        &section.font_weight,
                                                        current_x,
                                                        current_y,
                                                    );

                                                    nodes.push(text_element.into());
                                                    current_y += section.font_size * section.line_height;
                                                }
                                            } else {
                                                let value = match &section.date_format {
                                                    None => value_str.to_string(),
                                                    Some(date_format) => NaiveDate::parse_from_str(value_str, "%Y-%m-%d")?.format(date_format).to_string(),
                                                };

                                                let text_element = create_text(
                                                    &value,
                                                    font_family,
                                                    section.fill.clone(),
                                                    section.font_size,
                                                    &section.font_weight,
                                                    current_x,
                                                    current_y,
                                                );

                                                nodes.push(text_element.into());
                                            }
                                        }
                                    }
                                }
                            }
                            Ok(false) => {
                                // Formattable section (using format)
                                if let Some(format) = &section.format {
                                    let mut formatted_string = format.clone();
                                    for key in extract_keys_from_format(format) {
                                        if let Some(value) = preamble::get_nested_value(&preamble, &key) {
                                            let value_str = value.as_str().unwrap_or("");
                                            if let Some(date_format) = &section.date_format {
                                                if let Ok(date) = NaiveDate::parse_from_str(value_str, "%Y-%m-%d") {
                                                    formatted_string = formatted_string.replace(&format!("{{{}}}", key), &date.format(date_format).to_string());
                                                } else if let Ok(datetime) = DateTime::parse_from_rfc3339(value_str) {
                                                    formatted_string = formatted_string.replace(&format!("{{{}}}", key), &datetime.format(date_format).to_string());
                                                } else {
                                                    formatted_string = formatted_string.replace(&format!("{{{}}}", key), value_str);
                                                }
                                            } else {
                                                formatted_string = formatted_string.replace(&format!("{{{}}}", key), value_str);
                                            }
                                        } else if let Some(default_value) = &section.default_values.get(&key) {
                                            formatted_string = formatted_string.replace(&format!("{{{}}}", key), default_value);
                                            warn!("Key '{}' not found in preamble for format. Using default value: '{}'.", key, default_value);
                                        } else {
                                            warn!("Key '{}' not found in preamble for format and no default value provided.", key);
                                        }
                                    }

                                    let text_element = create_text(
                                        &formatted_string,
                                        font_family,
                                        section.fill.clone(),
                                        section.font_size,
                                        &section.font_weight,
                                        config.image.padding,
                                        current_y,
                                    );

                                    nodes.push(text_element.into());
                                }
                            }
                            Err(err) => {
                                error!("Invalid section configuration: {}", err);
                                return Err(anyhow::anyhow!(err));
                            }
                        }

                        current_y += config.image.margin;
                    }

                    let document = build_document(nodes, config.image.width, config.image.height);

                    let svg_path = absolute_path.parent().unwrap().join("og-image.svg");
                    let png_path = absolute_path.parent().unwrap().join("og-image.png");

                    svg::save(&svg_path, &document)?;
                    let font_paths: Vec<PathBuf> = config.fonts
                        .iter()
                        .map(|font| root_path.join(&font.path))
                        .collect();
                    image::save_png(&svg_path, &png_path, &font_paths)
                        .with_context(|| format!("Failed to save PNG from SVG: {:?}", &svg_path))?;
                    fs::remove_file(&svg_path)?;
                }
                Err(e) => {
                    error!("Error processing file {:?}: {}", readable_name, e);
                    return Err(e);
                }
            }

            let elapsed_time = start_time.elapsed().as_millis();
            total_time += elapsed_time;
            info!("Finished processing {:?} in {} ms", readable_name, elapsed_time);
        }
    }

    info!("Total time: {} ms", total_time);
    Ok(())
}

fn extract_keys_from_format(format: &str) -> Vec<String> {
    let mut keys = Vec::new();
    let mut start = None;
    for (i, ch) in format.chars().enumerate() {
        match ch {
            '{' => start = Some(i + 1),
            '}' => {
                if let Some(s) = start {
                    keys.push(format[s..i].to_string());
                    start = None;
                }
            }
            _ => {}
        }
    }
    keys
}
