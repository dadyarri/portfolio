use clap::Parser;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct Preamble {
    pub(crate) title: String,
    pub(crate) date: String,
    pub(crate) taxonomies: PreambleTaxonomies,
}

#[derive(Deserialize, Debug)]
pub struct PreambleTaxonomies {
    pub(crate) tags: Vec<String>,
}

#[derive(Parser)]
pub struct Cli {
    pub(crate) theme: String,
    pub(crate) wait_for_browser_in_msec: u64,
}
