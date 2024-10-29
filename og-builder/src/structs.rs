use clap::Parser;
use serde::Deserialize;
#[derive(Deserialize, Debug, Default)]
pub struct PreambleTaxonomies {
    pub(crate) tags: Vec<String>,
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
