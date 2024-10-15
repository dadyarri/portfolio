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
