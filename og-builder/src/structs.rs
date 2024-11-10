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

impl Display for OgConfig {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "OgConfig {{ image: {}, fonts: [{}], background: {}, sections: [{}] }}",
            self.image,
            self.fonts.iter().map(|font| font.to_string()).collect::<Vec<_>>().join(", "),
            self.background,
            self.sections.iter().map(|section| section.to_string()).collect::<Vec<_>>().join(", ")
        )
    }
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

impl Display for ImageConfig {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "ImageConfig {{ width: {}, height: {}, padding: {} }}", self.width, self.height, self.padding)
    }
}

#[derive(Deserialize, Debug, Default)]
pub struct FontConfig {
    pub(crate) name: String,
    pub(crate) path: String,
}

impl Display for FontConfig {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "FontConfig {{ name: '{}', path: '{}' }}", self.name, self.path)
    }
}

#[derive(Deserialize, Debug, Default)]
pub struct BackgroundConfig {
    pub(crate) fill: String,
    #[serde(default = "get_default_padding")]
    pub(crate) padding: i32,
    #[serde(default)]
    pub(crate) borders: Vec<BorderConfig>,
}

impl Display for BackgroundConfig {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "BackgroundConfig {{ fill: '{}', padding: {}, borders: [{}] }}",
            self.fill,
            self.padding,
            self.borders.iter().map(|border| border.to_string()).collect::<Vec<_>>().join(", ")
        )
    }
}

#[derive(Deserialize, Debug, Default)]
pub struct BorderConfig {
    pub(crate) stroke: String,
    #[serde(default = "get_default_stroke_width")]
    pub(crate) stroke_width: i32,
    #[serde(default)]
    pub(crate) side: Side,
}

impl Display for BorderConfig {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "BorderConfig {{ stroke: '{}', stroke_width: {}, side: {} }}", self.stroke, self.stroke_width, self.side)
    }
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

impl Display for SectionConfig {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "SectionConfig {{ preamble_key: '{}' optional: {}}}",
            self.preamble_key,
            self.optional,
        )
    }
}

#[derive(Deserialize, Debug, Default)]
pub struct ListConfig {
    #[serde(default = "get_default_margin")]
    pub(crate) margin: i32,
}

impl Display for ListConfig {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "ListConfig {{ margin: {} }}", self.margin)
    }
}

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
pub struct Cli {
    #[arg(short, long, value_delimiter = ',', default_value = "posts")]
    pub(crate) sections: Vec<String>,
}

impl Display for Cli {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "Cli {{ sections: [{}] }}", self.sections.join(", "))
    }
}

#[derive(Deserialize, Debug)]
pub enum Side {
    Left,
    Right,
    Bottom,
    Top,
}

impl Default for Side {
    fn default() -> Self {
        Side::Bottom
    }
}

impl Display for Side {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Deserialize, Debug)]
pub enum FontWeight {
    Regular,
    Bold,
}

impl Default for FontWeight {
    fn default() -> Self {
        FontWeight::Regular
    }
}

impl Display for FontWeight {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        let str = match self {
            FontWeight::Regular => "normal",
            FontWeight::Bold => "bold",
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
    1 // Default line height for text sections
}

fn get_default_margin() -> i32 {
    10 // Default margin for list items
}
