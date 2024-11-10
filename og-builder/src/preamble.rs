use log::debug;
use toml::Value;

// Function to get a nested value from a TOML value using a dot-separated string of keys
pub fn get_nested_value<'a>(preamble: &'a Value, keys: &str) -> Option<&'a Value> {
    let mut current_value = preamble;
    let split: Vec<&str> = keys.split('.').collect();

    debug!("Attempting to get nested value for keys: {}", keys);

    for key in split {
        debug!("Accessing key: {}", key);
        current_value = match current_value.get(key) {
            Some(value) => value,
            None => {
                debug!("Key not found: {}", key);
                return None;
            }
        };
    }

    debug!("Successfully retrieved value for keys: {}", keys);

    Some(current_value)
}
