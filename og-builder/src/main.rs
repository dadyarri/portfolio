use crate::structs::{Cli, OgConfig, Side};
use anyhow::{anyhow, Result};
use chrono::NaiveDate;
use clap::Parser;
use rusttype::Font;
use std::path::{Path, PathBuf};
use std::{fs, path};
use std::collections::HashMap;
use std::time::Instant;
use log::{info, warn};
use svg::Document;
use svg::node::element::Rectangle;
use toml::Value;
use walkdir::WalkDir;

mod parser;
mod structs;
mod text;
mod paths;
mod image;
mod preamble;

fn main() -> Result<()> {
    env_logger::init();
    let args = Cli::parse();
    let root = paths::get_git_root()?;

    let config_path = Path::new(&root).join("ogconfig.toml");
    let config = parser::parse_config(&config_path)?;

    for section in args.sections.iter() {
        info!("Section: {:?}", section);
        let path = Path::new(&root).join("content").join(section);
        process_content(&path, &args, &config)?;
        println!();
    }

    Ok(())
}

fn process_content(path: &PathBuf, args: &Cli, config: &OgConfig) -> Result<()> {
    if !fs::exists(path)? {
        return Err(anyhow!("Path {path:?} does not exist"));
    }

    let root = paths::get_git_root()?;

    let mut total_time = 0;

    for entry in WalkDir::new(path).max_depth(2).into_iter() {
        let file = entry?;
        let file_name = file.file_name().to_string_lossy();

        if file_name.ends_with(".md") & !file_name.starts_with("_") {
            let post_path = file.path().to_str().unwrap();
            let readable_name = paths::get_readable_directory(&mut file.path())?;
            info!("Processing file: {:?}", readable_name);
            let start_timestamp = Instant::now();
            let absolute_path = path::absolute(post_path)?;
            let absolute_path_str = absolute_path.to_str().unwrap();

            match parser::parse_preamble(absolute_path_str) {
                Ok(preamble) => {
                    // Create new document

                    let mut document = Document::new()
                        .set("viewBox", (0, 0, config.image.width, config.image.height));

                    let background = Rectangle::new()
                        .set("x", 0)
                        .set("y", 0)
                        .set("width", config.image.width)
                        .set("height", config.image.height)
                        .set("fill", &*config.background.fill);

                    document = document.add(background);

                    // Draw borders, if any

                    for border in &config.background.borders {
                        let mut border_rect = Rectangle::new()
                            .set("fill", &*border.stroke);

                        match border.side {
                            Side::Left => {
                                border_rect = border_rect
                                    .set("x", 0)
                                    .set("y", 0)
                                    .set("width", border.stroke_width)
                                    .set("height", config.image.height)
                            }
                            Side::Right => {
                                border_rect = border_rect
                                    .set("x", config.image.width - border.stroke_width)
                                    .set("y", 0)
                                    .set("width", border.stroke_width)
                                    .set("height", config.image.height)
                            }
                            Side::Bottom => {
                                border_rect = border_rect
                                    .set("x", 0)
                                    .set("y", config.image.height - border.stroke_width)
                                    .set("width", config.image.width)
                                    .set("height", border.stroke_width)
                            }
                            Side::Top => {
                                border_rect = border_rect
                                    .set("x", 0)
                                    .set("y", 0)
                                    .set("width", config.image.width)
                                    .set("height", border.stroke_width)
                            }
                        }

                        document = document.add(border_rect);
                    }

                    // Prepare fonts

                    let mut fonts = HashMap::new();

                    for font_config in &config.fonts {
                        let path = Path::new(&root).join(&font_config.path);

                        if let Ok(font_data) = fs::read(&path) {
                            if let Some(font) = Font::try_from_vec(font_data.clone()) {
                                info!("Font {:?} loaded", font_config.name);
                                fonts.insert(&font_config.name, font);
                            }
                        }
                    }

                    // Caclulate start y coordinate

                    let mut total_height = 0;

                    for section in &config.sections {
                        let font = fonts.get(&section.font_family).unwrap();
                        let mut section_height = 0;
                        match preamble::get_nested_value(&preamble, &section.preamble_key) {
                            Some(value) => {
                                if value.is_str() {
                                    let value = value.as_str().unwrap();
                                    if section.wrap_lines {
                                        let wrapped_lines = text::wrap_text(value, &font, section.font_size, (config.image.width - config.image.padding) as f32)?;
                                        section_height = wrapped_lines.count() * section.font_size * section.line_height;
                                    } else {
                                        section_height = section.font_size * section.line_height;
                                    }
                                } else if value.is_array() {
                                    section_height = section.font_size * section.line_height;
                                }
                            }
                            None => {}
                        }

                        total_height += section_height
                    }

                    let mut current_y = (config.image.height - total_height) / 2 + config.image.padding;

                    // Draw sections

                    for section in &config.sections {
                        match preamble::get_nested_value(&preamble, &section.preamble_key) {
                            None => {
                                if section.optional {
                                    warn!("{0} is not in preamble of {1}", section.preamble_key, readable_name)
                                } else {
                                    return Err(anyhow!("{0} is not in preamble of {1}", section.preamble_key, readable_name));
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
                                        let item_background = Rectangle::new()
                                            .set("x", config.image.padding)
                                            .set("y", current_y)
                                            .set("width", 0)
                                            .set("height", 0)
                                            .set("fill", &*background_options.fill);
                                    }
                                } else {
                                    let value_str = value.as_str().unwrap();
                                }
                            }
                        }
                    }

                    let svg_path = absolute_path.parent().unwrap().join("og-image.svg");
                    let png_path = absolute_path.parent().unwrap().join("og-image.png");

                    svg::save(&svg_path, &document)?;
                    image::save_png(&svg_path, &png_path);
                    // fs::remove_file(&svg_path)?;

                    // svg::create_svg(&svg_path, 1200, 630);
                    // svg::write_css(&svg_path, &css_path);
                    // svg::write_rect(&svg_path, 0, 0, 1200, 630, &"background".to_string());
                    // svg::write_rect(&svg_path, 0, 610, 1200, 20, &"border".to_string());
                    //
                    // let mut current_x = 20;
                    // let mut current_y = ((610 - ((wrapped_lines.len()) * 70)) / 2) as i32;
                    //
                    // for line in wrapped_lines {
                    //     svg::write_text(&svg_path, &line, current_x, current_y, &"h1".to_string());
                    //     current_y += 70;
                    // }
                    //
                    // svg::write_text(&svg_path, &format!("{} :: dadyarri", NaiveDate::parse_from_str(&*preamble["date"].as_str().unwrap(), "%Y-%m-%d")?.format("%d.%m.%Y")), current_x, current_y, &"p".to_string());
                    //
                    // svg::open_g(&svg_path);

                    // current_y += 40;

                    // if let Some(taxonomies) = preamble.get("taxonomies") {
                    //     if let Some(tags) = taxonomies.get("tags") {
                    //         for tag in tags.as_array().unwrap() {
                    //             let tag_str = &tag.as_str().unwrap();
                    //             let tag_width = text::measure_text_dimensions_pub(&tag_str, &font, 25)? as i32;
                    //             // svg::write_rect(&svg_path, current_x, current_y, tag_width, 40, &"tag".to_string());
                    //             // svg::write_text(&svg_path, &tag_str, current_x + 10, current_y + 30, &"tag-label".to_string());
                    //
                    //             current_x += tag_width + 20;
                    //         }
                    //     }
                    // }
                    //
                    // svg::close_g(&svg_path);
                    //
                    // svg::close_svg(&svg_path);
                    //
                    // image::save_png(&svg_path, &png_path);
                    // fs::remove_file(&svg_path)?;
                }
                Err(e) => return Err(e),
            }
            let elapsed = start_timestamp.elapsed().as_millis();
            total_time += elapsed;
            info!("Finished in {} ms", elapsed);
        }
    }

    info!("Total time: {} ms", total_time);

    Ok(())
}
