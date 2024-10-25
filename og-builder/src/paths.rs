use anyhow::Result;
use git2::Repository;
use std::path::Path;

pub fn get_git_root() -> Result<String, git2::Error> {
    let repo = Repository::discover(".")?;

    let workdir = repo.workdir().ok_or_else(|| git2::Error::from_str("No working directory found"))?;

    let abs_path = workdir.canonicalize().expect("Failed to get absolute path");
    Ok(abs_path.to_str().unwrap().to_string())
}

pub fn get_readable_directory(path: &mut &Path) -> Result<String> {
    // Collect path components in reverse and take the last two sections
    let mut components = path.components().rev();
    let last = components.next().unwrap().as_os_str();
    let second_last = components.next().unwrap().as_os_str();

    // Construct a new path from these components and convert to a String
    Ok(format!("{}/{}", second_last.to_string_lossy(), last.to_string_lossy()))
}