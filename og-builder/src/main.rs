use crate::structs::Cli;
use anyhow::Result;
use clap::Parser;
use std::path;
use std::path::Path;
use walkdir::WalkDir;

mod browser;
mod parser;
mod render;
mod structs;

#[tokio::main]
async fn main() -> Result<()> {
    let args = Cli::parse();

    let posts_path = Path::new("..").join("content").join("posts");

    let mut browser = browser::start_browser().await?;

    for entry in WalkDir::new(posts_path).max_depth(2).into_iter() {
        let file = entry?;
        let file_name = file.file_name().to_string_lossy();

        if file_name.ends_with(".md") & !file_name.starts_with("_") {
            let post_path = file.path().to_str().unwrap();
            let absolute_path = path::absolute(post_path)?;
            let absolute_path_str = absolute_path.to_str().unwrap();

            match parser::parse_preamble(absolute_path_str) {
                Ok(preamble) => match render::render_template(&preamble, &args.theme) {
                    Ok(html) => {
                        browser::save_og_image(
                            &mut browser,
                            absolute_path,
                            &html,
                            args.wait_for_browser_in_msec,
                        )
                        .await?
                    }
                    Err(e) => return Err(e),
                },
                Err(e) => return Err(e),
            }
        }
    }

    browser.close().await?;
    Ok(())
}
