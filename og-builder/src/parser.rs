use crate::structs::OgConfig;
use anyhow::{anyhow, Context, Result};
use log::{debug, error};
use regex::Regex;
use std::fs;
use std::path::PathBuf;
use toml::Value;

// Function to parse the TOML preamble from a file
pub(crate) fn parse_preamble(file_path: &str) -> Result<Value> {
    // Log the start of preamble parsing
    debug!("Parsing preamble from file: {}", file_path);

    // Read the content of the file at the provided path
    let content = fs::read_to_string(file_path)
        .with_context(|| format!("Failed to read file from path: {}", file_path))?;

    // Compile a regex to find the preamble within the file (between +++ markers)
    let re = Regex::new(r"^\+{3}([\s\S]+?)\+{3}")
        .context("Failed to compile regex for preamble parsing")?;

    // Debugging log to indicate regex compilation success
    debug!("Regex compiled successfully for preamble parsing");

    // Use regex to capture the preamble content
    if let Some(captures) = re.captures(&content) {
        // Extract the captured preamble as a string
        let toml_str = captures.get(1).map_or_else(
            || {
                // Log an error if preamble extraction fails
                error!("Failed to extract preamble from file: {}", file_path);
                Err(anyhow!("Failed to extract preamble"))
            },
            |m| Ok(m.as_str()),
        )?;

        // Parse the extracted preamble string as TOML
        let preamble = toml_str.parse::<Value>()
            .with_context(|| format!("Failed to parse TOML preamble from file: {}", file_path))?;

        // Log successful parsing of the preamble
        debug!("Successfully parsed preamble from file: {}", file_path);
        Ok(preamble)
    } else {
        // Log an error if no preamble is found in the file
        error!("Preamble not found in file: {}", file_path);
        Err(anyhow!("Preamble not found"))
    }
}

// Function to parse configuration from a file
pub(crate) fn parse_config(file_path: &PathBuf) -> Result<OgConfig> {
    // Log the start of configuration parsing
    debug!("Parsing configuration from file: {:?}", file_path);

    // Read the content of the file at the provided path
    let content = fs::read_to_string(file_path)
        .with_context(|| format!("Failed to read config file from path: {:?}", file_path))?;

    // Parse the content as TOML into the OgConfig struct
    let config: OgConfig = toml::from_str(&content)
        .with_context(|| format!("Failed to parse TOML configuration from file: {:?}", file_path))?;

    // Log successful parsing of the configuration
    debug!("Successfully parsed configuration from file: {:?}", file_path);
    Ok(config)
}
