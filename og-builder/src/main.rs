use async_std::task;
use chromiumoxide::cdp::browser_protocol::page::CaptureScreenshotFormat;
use chromiumoxide::page::ScreenshotParams;
use chromiumoxide::{Browser, BrowserConfig};
use futures::StreamExt;
use regex::Regex;
use serde::Deserialize;
use std::error::Error;
use std::path::{Path, PathBuf};
use std::time::Duration;
use std::{fs, path};
use tera::Tera;
use walkdir::WalkDir;

fn render_template(preamble: &Preamble) -> Result<String, tera::Error> {
    let template_path = Path::new(".")
        .join("..")
        .join("themes")
        .join("dapollo")
        .join("templates");

    let absolute_template_path = path::absolute(template_path)?;
    let templates_glob = absolute_template_path.join("*.html");

    let templates_glob_str = templates_glob.to_str().unwrap();

    let tera = Tera::new(templates_glob_str)?;
    let mut context = tera::Context::new();

    context.insert("title", preamble.title.as_str());
    context.insert("date", preamble.date.as_str());
    context.insert("tags", &preamble.taxonomies.tags);

    let rendered_html = tera.render("og_image.html", &context)?;
    Ok(rendered_html)
}

fn parse_preamble(file_path: &str) -> Result<Preamble, Box<dyn Error>> {
    let content = fs::read_to_string(file_path)?;
    let re = Regex::new(r"^\+{3}([\s\S]+?)\+{3}").unwrap();

    if let Some(captures) = re.captures(&content) {
        let toml_str = captures.get(1).unwrap().as_str();
        let preamble: Preamble = toml::from_str(toml_str).unwrap();
        Ok(preamble)
    } else {
        Err("Preamble not found")?
    }
}

#[async_std::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let posts_path = Path::new("..").join("content").join("posts");

    let (mut browser, mut handler) = Browser::launch(
        BrowserConfig::builder()
            .new_headless_mode()
            .window_size(1160, 630)
            .build()?,
    )
        .await?;

    async_std::task::spawn(async move {
        loop {
            let _event = handler.next().await;
        }
    });

    for entry in WalkDir::new(posts_path).max_depth(2).into_iter() {
        let file = entry.unwrap();
        let file_name = file.file_name().to_string_lossy();

        if file_name.ends_with(".md") & !file_name.starts_with("_") {
            let post_path = file.path().to_str().unwrap();
            let absolute_path = path::absolute(post_path).unwrap();
            let absolute_path_str = absolute_path.to_str().unwrap();

            let preamble = parse_preamble(absolute_path_str);

            match preamble {
                Ok(preamble) => {
                    println!("{preamble:?}");

                    match render_template(&preamble) {
                        Ok(html) => {
                            save_og_image(&mut browser, absolute_path, &html).await?;
                        }
                        Err(e) => {
                            panic!("{}", e);
                        }
                    }
                }
                Err(e) => {
                    panic!("{}", e);
                }
            }
        }
    }

    browser.close().await?;
    Ok(())
}

async fn save_og_image(browser: &mut Browser, absolute_path: PathBuf, html: &String) -> Result<(), Box<dyn Error>> {
    let page = browser
        .new_page(
            "data:text/html,".to_owned() + &urlencoding::encode(&html),
        )
        .await?;

    page.wait_for_navigation_response().await?;
    task::sleep(Duration::from_millis(500)).await;

    let image = page
        .screenshot(
            ScreenshotParams::builder()
                .full_page(true)
                .format(CaptureScreenshotFormat::Jpeg)
                .quality(100)
                .build(),
        )
        .await?;

    let og_image_path =
        absolute_path.parent().unwrap().join("og-image.jpeg");

    fs::write(og_image_path, image)?;
    
    Ok(())
}

#[derive(Deserialize, Debug)]
struct Preamble {
    title: String,
    date: String,
    taxonomies: PreambleTaxonomies,
}

#[derive(Deserialize, Debug)]
struct PreambleTaxonomies {
    tags: Vec<String>,
}
