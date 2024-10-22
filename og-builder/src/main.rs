use crate::structs::Cli;
use anyhow::{anyhow, Result};
use clap::Parser;
use std::path::{Path, PathBuf};
use std::{fs, path};
use rusttype::Font;
use walkdir::WalkDir;

mod parser;
mod render;
mod structs;
mod text;

#[tokio::main]
async fn main() -> Result<()> {
    let args = Cli::parse();

    for section in args.sections.iter() {
        let path = Path::new("..").join("content").join(section);
        process_content(&path, &args).await?;
    }

    Ok(())
}

async fn process_content(path: &PathBuf, args: &Cli) -> Result<()> {
    if !fs::exists(path)? {
        return Err(anyhow!("Path {path:?} does not exist"));
    }

    for entry in WalkDir::new(path).max_depth(2).into_iter() {
        let file = entry?;
        let file_name = file.file_name().to_string_lossy();

        if file_name.ends_with(".md") & !file_name.starts_with("_") {
            let post_path = file.path().to_str().unwrap();
            let absolute_path = path::absolute(post_path)?;
            let absolute_path_str = absolute_path.to_str().unwrap();

            match parser::parse_preamble(absolute_path_str) {
                // TODO: Изменить механизм рендера шаблона на svg, добавить автоматический расчёт координат (с учётом файла шрифта)
                Ok(preamble) => {
                    let font_data = include_bytes!("../../fonts/jetbrains-mono.ttf") as &[u8];
                    let font = Font::try_from_bytes(font_data).expect("Error constructing Font");
                    let wrapped_lines = text::wrap_text(&preamble.title, &font, 60, 1100f32)?;

                    match render::render_template(&preamble, &args.theme) {
                        Ok(html) => {}
                        Err(e) => return Err(e),
                    }
                }
                Err(e) => return Err(e),
            }
        }
    }
    Ok(())
}
