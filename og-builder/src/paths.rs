use anyhow::{anyhow, Result};
use git2::Repository;
use log::{debug, error};
use std::path::{Path, PathBuf};

// Function to get the root directory of the git repository
pub fn get_git_root() -> Result<PathBuf> {
    // Attempt to discover the git repository from the current directory
    debug!("Attempting to discover Git repository from current directory");
    let repo = Repository::discover(".")?;

    // Retrieve the working directory of the repository
    let workdir = repo.workdir().ok_or_else(|| {
        error!("No working directory found for the Git repository");
        anyhow!("No working directory found")
    })?;

    // Get the absolute path of the working directory
    let abs_path = workdir.canonicalize().map_err(|e| {
        error!("Failed to get absolute path of working directory: {}", e);
        anyhow!("Failed to get absolute path")
    })?;

    debug!("Successfully found Git root: {}", abs_path.display());
    Ok(abs_path)
}

// Function to get a readable version of the directory path, taking the last two sections
pub fn get_readable_directory(path: &Path) -> Result<String> {
    // Log the start of converting the path to a readable format
    debug!("Attempting to get a readable directory path from: {:?}", path);

    // Collect path components in reverse order and take the last two sections
    let mut components = path.components().rev();
    let last = components.next().ok_or_else(|| {
        error!("Failed to get last component of the path");
        anyhow!("Failed to get last component of the path")
    })?.as_os_str();

    let second_last = components.next().ok_or_else(|| {
        error!("Failed to get second to last component of the path");
        anyhow!("Failed to get second to last component of the path")
    })?.as_os_str();

    // Construct a new path from these components and convert to a String
    let readable_path = format!("{}/{}", second_last.to_string_lossy(), last.to_string_lossy());

    // Log successful conversion of path
    debug!("Successfully converted path to readable format: {}", readable_path);
    Ok(readable_path)
}
