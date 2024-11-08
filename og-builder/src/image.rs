use std::path::{Path, PathBuf};
use resvg::{tiny_skia, usvg};

pub fn save_png(svg_path: &Path, png_path: &Path, font_paths: &Vec<PathBuf>) {
    let tree = {
        let mut opt = usvg::Options::default();
        // Get file's absolute directory.
        opt.resources_dir = std::fs::canonicalize(&svg_path)
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()));

        for font_path in font_paths {
            opt.fontdb_mut().load_font_file(font_path).expect("failed to load font");
        }

        let svg_data = std::fs::read(&svg_path).unwrap();
        usvg::Tree::from_data(&svg_data, &opt).unwrap()
    };

    let pixmap_size = tree.size().to_int_size();
    let mut pixmap = tiny_skia::Pixmap::new(pixmap_size.width(), pixmap_size.height()).unwrap();
    resvg::render(&tree, tiny_skia::Transform::default(), &mut pixmap.as_mut());
    pixmap.save_png(&png_path).unwrap();
}