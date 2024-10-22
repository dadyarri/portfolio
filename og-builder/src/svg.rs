use std::fs::{read_to_string, File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

pub fn create_svg(path: &PathBuf, width: usize, height: usize) {
    let mut file = File::create(path).expect("can't create svg file");
    let svg_header = format!("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{}\" height=\"{}\" style=\"background-color: #121212; color: #f2f8f8;\">", width, height);

    file.write_all(svg_header.as_bytes()).expect("can't write to file");
}

pub fn write_css(svg_path: &PathBuf, css_path: &PathBuf) {
    let mut file = OpenOptions::new()
        .append(true)
        .open(svg_path)
        .unwrap();

    let css_content = read_to_string(css_path).unwrap_or(String::new());
    let style_tag = format!("\n<style>\n{}\n</style>\n", css_content);

    file.write_all(style_tag.as_bytes()).expect("can't write to file");
}

pub fn write_rect(svg_path: &PathBuf, x: i32, y: i32, w: i32, h: i32, class: &String) {
    let mut file = OpenOptions::new()
        .append(true)
        .open(svg_path)
        .unwrap();

    let rect_tag = format!("\n<rect class=\"{}\" x=\"{}\" y=\"{}\" width=\"{}\" height=\"{}\"></rect>", class, x, y, w, h);

    file.write_all(rect_tag.as_bytes()).expect("can't write to file");
}

pub fn write_text(svg_path: &PathBuf, text: &str, x: i32, y: i32, class: &String) {
    let mut file = OpenOptions::new()
        .append(true)
        .open(svg_path)
        .unwrap();

    let text_tag = format!("\n<text class=\"{}\" x=\"{}\" y=\"{}\">{}</text>", class, x, y, text);

    file.write_all(text_tag.as_bytes()).expect("can't write to file");
}

pub fn open_g(path: &PathBuf) {
    let mut file = OpenOptions::new()
        .append(true)
        .open(path)
        .unwrap();

    let g_tag = "\n<g>\n";

    file.write_all(g_tag.as_bytes()).expect("can't write to file");
}

pub fn close_g(path: &PathBuf) {
    let mut file = OpenOptions::new()
        .append(true)
        .open(path)
        .unwrap();

    let g_tag = "\n</g>";

    file.write_all(g_tag.as_bytes()).expect("can't write to file");
}

pub fn close_svg(path: &PathBuf) {
    let mut file = OpenOptions::new()
        .append(true)
        .open(path)
        .unwrap();

    let style_tag = "\n</svg>";

    file.write_all(style_tag.as_bytes()).expect("can't write to file");
}