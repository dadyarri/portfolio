use crate::structs::Preamble;
use anyhow::{anyhow, Result};
use std::path;
use std::path::Path;
use tera::Tera;

pub fn render_template(preamble: &Preamble, theme: &str) -> Result<String> {
    let template_path = Path::new(".")
        .join("..")
        .join("themes")
        .join(theme)
        .join("templates");

    let absolute_template_path = path::absolute(template_path)?;
    let templates_glob = absolute_template_path.join("*.html");

    let templates_glob_str = templates_glob
        .to_str()
        .ok_or(anyhow!("Invalid UTF-8 in templates glob"))?;

    let tera = Tera::new(templates_glob_str)?;
    let mut context = tera::Context::new();

    context.insert("title", preamble.title.as_str());
    context.insert("date", preamble.date.as_str());
    context.insert("tags", &preamble.taxonomies.tags);

    let rendered_html = tera.render("og_image.html", &context)?;
    Ok(rendered_html)
}
