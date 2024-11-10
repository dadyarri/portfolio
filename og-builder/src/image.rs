use std::path::{Path, PathBuf};
use std::fs;
use log::{debug};
use resvg::{tiny_skia, usvg};
use anyhow::{Context, Result};

pub fn save_png(svg_path: &Path, png_path: &Path, font_paths: &[PathBuf]) -> Result<()> {
    debug!("Starting to save PNG from SVG: {:?}", svg_path);

    // Step 1: Configure usvg Options with the absolute directory of the svg file
    let tree = {
        let mut opt = usvg::Options::default();

        // Get file's absolute directory
        opt.resources_dir = fs::canonicalize(svg_path)
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()));

        // Load fonts
        for font_path in font_paths {
            debug!("Loading font from path: {:?}", font_path);
            opt.fontdb_mut()
                .load_font_file(font_path)
                .with_context(|| format!("Failed to load font from path: {:?}", font_path))?;
        }

        // Read the SVG file
        let svg_data = fs::read(svg_path)
            .with_context(|| format!("Failed to read SVG file from path: {:?}", svg_path))?;

        // Create usvg tree
        usvg::Tree::from_data(&svg_data, &opt)
            .with_context(|| format!("Failed to parse SVG data from path: {:?}", svg_path))?
    };

    debug!("Successfully parsed SVG file: {:?}", svg_path);

    // Step 2: Prepare the pixmap for rendering
    let pixmap_size = tree.size().to_int_size();
    let mut pixmap = tiny_skia::Pixmap::new(pixmap_size.width(), pixmap_size.height())
        .context("Failed to create pixmap with given dimensions")?;

    // Step 3: Render the SVG into the pixmap
    resvg::render(&tree, tiny_skia::Transform::default(), &mut pixmap.as_mut());

    debug!("Successfully rendered SVG to pixmap");

    // Step 4: Save the pixmap as PNG
    pixmap.save_png(png_path)
        .with_context(|| format!("Failed to save PNG to path: {:?}", png_path))?;

    debug!("Successfully saved PNG to path: {:?}", png_path);
    Ok(())
}
