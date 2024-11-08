use clap::Parser;
use serde::Deserialize;
#[derive(Deserialize, Debug)]
pub struct OgConfig {
    image: ImageConfig,
    text: TextConfig,
    background: BackgroundConfig,
    sections: Vec<SectionConfig>,
}

#[derive(Deserialize, Debug)]
pub struct ImageConfig {
    width: i32,
    height: i32,
    padding: i32,
}

#[derive(Deserialize, Debug)]
pub struct TextConfig {
    font_family: String,
}

#[derive(Deserialize, Debug)]
pub struct BackgroundConfig {
    fill: String,
    borders: Vec<BorderConfig>,
}

#[derive(Deserialize, Debug, Default)]
pub struct BorderConfig {
    stroke: String,
    stroke_width: i32,
    side: Side,
}

#[derive(Deserialize, Debug, Default)]
pub struct SectionConfig {
    preamble_key: String,
    #[serde(default)]
    wrap_lines: bool,
    font_size: i32,
    #[serde(default)]
    font_weight: FontWeight,
    fill: String,
}

#[derive(Parser)]
#[command(version, about, long_about = None)]
pub struct Cli {
    #[arg(short, long)]
    pub(crate) theme: String,
    #[arg(short, long, default_value_t = 600)]
    pub(crate) wait_for_browser_in_msec: u64,
    #[arg(short, long, value_delimiter = ',', default_value = "posts")]
    pub(crate) sections: Vec<String>,
}

#[derive(Deserialize, Debug)]
enum Side { Left, Right, Bottom, Top }
impl Default for Side {
    fn default() -> Self {
        Side::Bottom
    }
}

#[derive(Deserialize, Debug)]
enum FontWeight { Regular, Bold }
impl Default for FontWeight {
    fn default() -> Self {
        FontWeight::Regular
    }
}
