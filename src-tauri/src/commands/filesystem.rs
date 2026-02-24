use std::{fs, path::{Path, PathBuf}, time::{SystemTime, UNIX_EPOCH}};
use anyhow::{Context, Result};
use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct FileEntry {
  pub path: String,
  pub kind: String, // "file" | "dir"
}

pub fn project_root() -> Result<PathBuf> {
  let cwd = std::env::current_dir().context("failed to get cwd")?;
  Ok(cwd)
}

fn snapshot_before_write(abs_path: &Path, contents: &str) -> Result<()> {
  let root = project_root()?;
  let rel = abs_path.strip_prefix(&root).unwrap_or(abs_path);

  let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
  let snap_dir = root.join(".anima_snapshots").join(ts.to_string());
  let snap_path = snap_dir.join(rel);

  if let Some(parent) = snap_path.parent() {
    fs::create_dir_all(parent).ok();
  }

  if abs_path.exists() {
    let prior = fs::read_to_string(abs_path).unwrap_or_default();
    fs::write(&snap_path, prior).ok();
  } else {
    fs::write(&snap_path, "<NEW FILE>\n").ok();
  }

  let intended = snap_dir.join(rel).with_extension("intended");
  if let Some(parent) = intended.parent() {
    fs::create_dir_all(parent).ok();
  }
  fs::write(intended, contents).ok();

  Ok(())
}

#[command]
pub async fn get_project_root() -> Result<String, String> {
  project_root().map(|p| p.to_string_lossy().to_string()).map_err(|e| e.to_string())
}

#[command]
pub async fn list_files(root: String) -> Result<Vec<FileEntry>, String> {
  let mut out = Vec::new();
  let rootp = PathBuf::from(root);
  for entry in walkdir::WalkDir::new(&rootp).max_depth(5).into_iter().filter_map(|e| e.ok()) {
    let p = entry.path();
    if p.components().any(|c| matches!(c.as_os_str().to_string_lossy().as_ref(), "node_modules"|"target"|"dist"|".git"|".anima_snapshots")) {
      continue;
    }
    let kind = if entry.file_type().is_dir() { "dir" } else { "file" };
    out.push(FileEntry{
      path: p.to_string_lossy().to_string(),
      kind: kind.to_string(),
    });
  }
  Ok(out)
}

#[command]
pub async fn read_file(path: String) -> Result<String, String> {
  fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[command]
pub async fn write_file(path: String, contents: String) -> Result<(), String> {
  let p = PathBuf::from(&path);
  snapshot_before_write(&p, &contents).map_err(|e| e.to_string())?;
  if let Some(parent) = p.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }
  fs::write(&p, contents).map_err(|e| e.to_string())
}

#[command]
pub async fn read_or_init_layout(path: String, default_contents: String) -> Result<String, String> {
  let p = PathBuf::from(&path);
  if !p.exists() {
    write_file(path.clone(), default_contents.clone()).await?;
    return Ok(default_contents);
  }
  read_file(path).await
}

#[command]
pub async fn open_in_external(path: String) -> Result<(), String> {
  let p = PathBuf::from(path);
  if !p.exists() {
    return Err("Path does not exist".into());
  }
  
  #[cfg(target_os = "linux")]
  let status = std::process::Command::new("xdg-open").arg(p).status();
  
  #[cfg(target_os = "macos")]
  let status = std::process::Command::new("open").arg(p).status();
  
  #[cfg(target_os = "windows")]
  let status = std::process::Command::new("explorer").arg(p).status();

  match status {
    Ok(s) if s.success() => Ok(()),
    Ok(s) => Err(format!("Opener failed with status {}", s)),
    Err(e) => Err(format!("Failed to start opener: {}", e))
  }
}
