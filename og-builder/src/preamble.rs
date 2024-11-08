use toml::Value;

pub fn get_nested_value<'a>(preamble: &'a Value, keys: &str) -> Option<&'a Value> {
    let mut current_value = preamble;
    let split: Vec<&str> = keys.split('.').collect();
    for key in split {
        current_value = current_value.get(key)?;
    }

    Some(current_value)
}