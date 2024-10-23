use crate::structs::Cli;
use anyhow::{anyhow, Result};
use chrono::NaiveDate;
use clap::Parser;
use rusttype::Font;
use std::path::{Path, PathBuf};
use std::{fs, path};
use walkdir::WalkDir;

mod parser;
mod structs;
mod text;
mod svg;
mod paths;
mod image;

fn main() -> Result<()> {
    env_logger::init();
    let args = Cli::parse();
    let root = paths::get_git_root()?;

    for section in args.sections.iter() {
        let path = Path::new(&root).join("content").join(section);
        process_content(&path, &args)?;
    }

    Ok(())
}

fn process_content(path: &PathBuf, args: &Cli) -> Result<()> {
    if !fs::exists(path)? {
        return Err(anyhow!("Path {path:?} does not exist"));
    }

    let root = paths::get_git_root()?;

    for entry in WalkDir::new(path).max_depth(2).into_iter() {
        let file = entry?;
        let file_name = file.file_name().to_string_lossy();

        if file_name.ends_with(".md") & !file_name.starts_with("_") {
            let post_path = file.path().to_str().unwrap();
            let absolute_path = path::absolute(post_path)?;
            let absolute_path_str = absolute_path.to_str().unwrap();

            match parser::parse_preamble(absolute_path_str) {
                Ok(preamble) => {
                    let font_path = Path::new(&root)
                        .join("fonts")
                        .join("jetbrains-mono.ttf");
                    let font_data = fs::read(&font_path)?;
                    let font = Font::try_from_bytes(&*font_data).expect("Error constructing Font");
                    let wrapped_lines = text::wrap_text(&preamble.title, &font, 60, 1100f32)?;

                    let svg_path = absolute_path.parent().unwrap().join("og-image.svg");
                    let png_path = absolute_path.parent().unwrap().join("og-image.png");
                    let css_path = Path::new(&root)
                        .join("themes")
                        .join(&args.theme)
                        .join("css")
                        .join("og-image.css");

                    svg::create_svg(&svg_path, 1200, 630);
                    svg::write_css(&svg_path, &css_path);
                    svg::write_rect(&svg_path, 0, 0, 1200, 630, &"background".to_string());
                    svg::write_rect(&svg_path, 0, 610, 1200, 20, &"border".to_string());

                    let mut current_x = 20;
                    let mut current_y = ((610 - ((wrapped_lines.len()) * 70)) / 2) as i32;

                    for line in wrapped_lines {
                        svg::write_text(&svg_path, &line, current_x, current_y, &"h1".to_string());
                        current_y += 70;
                    }

                    svg::write_text(&svg_path, &format!("{} :: dadyarri", NaiveDate::parse_from_str(&*preamble.date, "%Y-%m-%d")?.format("%d.%m.%Y")), current_x, current_y, &"p".to_string());

                    svg::open_g(&svg_path);

                    current_y += 40;

                    for tag in preamble.taxonomies.tags {
                        let tag_width = text::measure_text_dimensions_pub(&tag, &font, 25)? as i32;
                        svg::write_rect(&svg_path, current_x, current_y, tag_width, 40, &"tag".to_string());
                        svg::write_text(&svg_path, &tag, current_x + 10, current_y + 30, &"tag-label".to_string());

                        current_x += tag_width + 20;
                    }

                    svg::close_g(&svg_path);

                    svg::close_svg(&svg_path);

                    image::save_png(&svg_path, &png_path);
                    fs::remove_file(&svg_path)?;
                }
                Err(e) => return Err(e),
            }
        }
    }
    Ok(())
}
