use std::fs::File;
use std::path::PathBuf;

fn create_svg(path: &PathBuf, width: usize, height: usize) {
    let mut file = File::create(path).expect("can't create svg file");

    writeln!(file, r#"<svg xmlns="http://www.w3.org/2000/svg" width="{}" height="{}">"#, width, height)
        .expect("can't write to file");
}