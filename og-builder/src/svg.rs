use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

pub fn create_svg(path: &PathBuf, width: usize, height: usize) {
    let mut file = File::create(path).expect("can't create svg file");
    let svg_header = format!(r#"<svg xmlns="http://www.w3.org/2000/svg" width="{}" height="{}">"#, width, height);

    file.write_all(svg_header.as_bytes()).expect("can't write to file");
}