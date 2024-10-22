use git2::Repository;

pub fn get_git_root() -> Result<String, git2::Error> {
    let repo = Repository::discover(".")?;

    let workdir = repo.workdir().ok_or_else(|| git2::Error::from_str("No working directory found"))?;

    let abs_path = workdir.canonicalize().expect("Failed to get absolute path");
    Ok(abs_path.to_str().unwrap().to_string())
}