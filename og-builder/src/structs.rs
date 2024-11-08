use clap::Parser;
use serde::Deserialize;
#[derive(Deserialize, Debug)]
pub struct OgConfig {
    pub(crate) image: ImageConfig,
    pub(crate) fonts: Vec<FontConfig>,
    pub(crate) background: BackgroundConfig,
    pub(crate) sections: Vec<SectionConfig>,
}

#[derive(Deserialize, Debug)]
pub struct ImageConfig {
    pub(crate) width: i32,
    pub(crate) height: i32,
    pub(crate) padding: i32,
}

#[derive(Deserialize, Debug)]
pub struct FontConfig {
    pub(crate) name: String,
    pub(crate) path: String,
}

#[derive(Deserialize, Debug)]
pub struct BackgroundConfig {
    pub(crate) fill: String,
    #[serde(default)]
    pub(crate) padding: i32,
    #[serde(default)]
    pub(crate) borders: Vec<BorderConfig>,
}

#[derive(Deserialize, Debug, Default)]
pub struct BorderConfig {
    pub(crate) stroke: String,
    pub(crate) stroke_width: i32,
    pub(crate) side: Side,
}

#[derive(Deserialize, Debug, Default)]
pub struct SectionConfig {
    pub(crate) preamble_key: String,
    #[serde(default)]
    pub(crate) wrap_lines: bool,
    #[serde(default)]
    pub(crate) optional: bool,
    pub(crate) font_size: i32,
    #[serde(default)]
    pub(crate) font_weight: FontWeight,
    #[serde(default)]
    pub(crate) font_family: String,
    #[serde(default="get_default_line_height")]
    pub(crate) line_height: i32,
    pub(crate) fill: String,
    pub(crate) date_format: Option<String>,
    pub(crate) background: Option<BackgroundConfig>,
    pub(crate) list: Option<ListConfig>
}

#[derive(Deserialize, Debug, Default)]
pub struct ListConfig {
    #[serde(default)]
    pub(crate) margin: i32,
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
pub enum Side { Left, Right, Bottom, Top }
impl Default for Side {
    fn default() -> Self {
        Side::Bottom
    }
}

#[derive(Deserialize, Debug)]
pub enum FontWeight { Regular, Bold }
impl Default for FontWeight {
    fn default() -> Self {
        FontWeight::Regular
    }
}

fn get_default_line_height() -> i32 {
    1
}