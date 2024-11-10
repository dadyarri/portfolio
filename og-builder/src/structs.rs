use clap::Parser;
use serde::Deserialize;
use std::fmt;
use std::fmt::{Debug, Display, Formatter};

#[derive(Deserialize, Debug, Default)]
pub struct OgConfig {
    pub(crate) image: ImageConfig,
    pub(crate) fonts: Vec<FontConfig>,
    pub(crate) background: BackgroundConfig,
    pub(crate) sections: Vec<SectionConfig>,
}

#[derive(Deserialize, Debug, Default)]
pub struct ImageConfig {
    #[serde(default = "get_default_image_width")]
    pub(crate) width: i32,
    #[serde(default = "get_default_image_height")]
    pub(crate) height: i32,
    #[serde(default = "get_default_padding")]
    pub(crate) padding: i32,
}

#[derive(Deserialize, Debug, Default)]
pub struct FontConfig {
    pub(crate) name: String,
    pub(crate) path: String,
}

#[derive(Deserialize, Debug, Default)]
pub struct BackgroundConfig {
    pub(crate) fill: String,
    #[serde(default = "get_default_padding")]
    pub(crate) padding: i32,
    #[serde(default)]
    pub(crate) borders: Vec<BorderConfig>,
}

#[derive(Deserialize, Debug, Default)]
pub struct BorderConfig {
    pub(crate) stroke: String,
    #[serde(default = "get_default_stroke_width")]
    pub(crate) stroke_width: i32,
    #[serde(default)]
    pub(crate) side: Side,
}

#[derive(Deserialize, Debug, Default)]
pub struct SectionConfig {
    pub(crate) preamble_key: String,
    #[serde(default)]
    pub(crate) wrap_lines: bool,
    #[serde(default)]
    pub(crate) optional: bool,
    #[serde(default = "get_default_font_size")]
    pub(crate) font_size: i32,
    #[serde(default)]
    pub(crate) font_weight: FontWeight,
    #[serde(default)]
    pub(crate) font_family: String,
    #[serde(default = "get_default_line_height")]
    pub(crate) line_height: i32,
    pub(crate) fill: String,
    pub(crate) date_format: Option<String>,
    pub(crate) background: Option<BackgroundConfig>,
    pub(crate) list: Option<ListConfig>,
}

#[derive(Deserialize, Debug, Default)]
pub struct ListConfig {
    #[serde(default = "get_default_margin")]
    pub(crate) margin: i32,
}

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Cli {
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
impl Display for FontWeight {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        let str = match self {
            FontWeight::Regular => "normal".to_string(),
            FontWeight::Bold => "bold".to_string(),
        };
        write!(f, "{}", str)
    }
}

// Logical default values for Open Graph image specifications
fn get_default_image_width() -> i32 {
    1200 // Default width suitable for OG images
}

fn get_default_image_height() -> i32 {
    630 // Default height suitable for OG images
}

fn get_default_padding() -> i32 {
    20 // Default padding around the image or background
}

fn get_default_stroke_width() -> i32 {
    2 // Default border stroke width
}

fn get_default_font_size() -> i32 {
    24 // Default font size for text sections
}

fn get_default_line_height() -> i32 {
    32 // Default line height for text sections
}

fn get_default_margin() -> i32 {
    10 // Default margin for list items
}
