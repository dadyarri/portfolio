use crate::structs;
use anyhow::anyhow;
use regex::Regex;
use std::fs;

pub(crate) fn parse_preamble(file_path: &str) -> anyhow::Result<structs::Preamble> {
    let content = fs::read_to_string(file_path)?;
    let re = Regex::new(r"^\+{3}([\s\S]+?)\+{3}")?;

    if let Some(captures) = re.captures(&content) {
        let toml_str = captures.get(1).map_or_else(
            || Err(anyhow!("Failed to extract preamble")),
            |m| Ok(m.as_str()),
        )?;

        let preamble: structs::Preamble = toml::from_str(toml_str)?;
        Ok(preamble)
    } else {
        Err(anyhow!("Preamble not found"))
    }
}
