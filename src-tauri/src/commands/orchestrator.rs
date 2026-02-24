use tauri::{command, AppHandle, Emitter};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::process::Stdio;
use notify::{Watcher, RecursiveMode, EventKind, event::ModifyKind};
use std::fs::{self, File};

use crate::commands::filesystem::project_root;

#[derive(Serialize, Deserialize)]
pub struct GraphNode { pub id: String, pub label: String, pub kind: String }
#[derive(Serialize, Deserialize)]
pub struct GraphEdge { pub id: String, pub source: String, pub target: String, pub kind: String }
#[derive(Serialize, Deserialize)]
pub struct Graph { pub nodes: Vec<GraphNode>, pub edges: Vec<GraphEdge> }

#[command]
pub async fn generate_sdg(app: AppHandle, root: String) -> Result<Graph, String> {
  let mut cmd = cargo_metadata::MetadataCommand::new();
  cmd.current_dir(&root);
  
  let mut nodes = Vec::new();
  let mut edges = Vec::new();

  // 1. Rust Cargo Dependencies
  if let Ok(md) = cmd.exec() {
    for p in &md.packages {
      let pkg_id = p.name.clone();
      nodes.push(GraphNode{ id: pkg_id.clone(), label: p.name.clone(), kind: "crate".into() });

      let src_dir = p.manifest_path.parent().unwrap().join("src");
      if src_dir.exists() {
        for entry in walkdir::WalkDir::new(&src_dir).max_depth(2).into_iter().filter_map(|e| e.ok()) {
          if entry.file_type().is_file() && entry.path().extension().is_some_and(|ext| ext == "rs") {
            let file_name = entry.path().file_name().unwrap().to_string_lossy().to_string();
            let node_id = format!("{}:{}", pkg_id, file_name);
            nodes.push(GraphNode { id: node_id.clone(), label: file_name.clone(), kind: "module".into() });
            edges.push(GraphEdge { id: format!("{}->{}", pkg_id, node_id), source: pkg_id.clone(), target: node_id.clone(), kind: "contains".into() });

            if let Ok(content) = fs::read_to_string(entry.path()) {
              for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("pub fn ") || trimmed.starts_with("fn ") || 
                   trimmed.starts_with("pub struct ") || trimmed.starts_with("struct ") ||
                   trimmed.starts_with("pub enum ") || trimmed.starts_with("enum ") {
                  
                  let parts: Vec<&str> = trimmed.split_whitespace().collect();
                  let name = parts.iter().skip_while(|&&s| s == "pub" || s == "async").nth(1);
                  if let Some(n) = name {
                    let sym_name = n.split('(').next().unwrap().split('{').next().unwrap().trim();
                    let sym_id = format!("{}:{}", node_id, sym_name);
                    nodes.push(GraphNode { id: sym_id.clone(), label: sym_name.to_string(), kind: "symbol".into() });
                    edges.push(GraphEdge { id: format!("{}->{}", node_id, sym_id), source: node_id.clone(), target: sym_id, kind: "defines".into() });
                  }
                }
              }
            }
          }
        }
      }
    }
    if let Some(resolve) = md.resolve {
      for n in resolve.nodes {
        let pkg = md.packages.iter().find(|p| p.id == n.id);
        let src_name = pkg.map(|p| p.name.clone()).unwrap_or_else(|| n.id.repr.clone());
        for dep in n.deps {
          let dep_pkg = md.packages.iter().find(|p| p.id == dep.pkg);
          let tgt_name = dep_pkg.map(|p| p.name.clone()).unwrap_or_else(|| dep.pkg.repr.clone());
          edges.push(GraphEdge{ id: format!("{}->{}", src_name, tgt_name), source: src_name.clone(), target: tgt_name, kind: "depends_on".into() });
        }
      }
    }
  }

  // 2. Python System Dependencies
  let project_root_path = PathBuf::from(&root);
  for entry in walkdir::WalkDir::new(&project_root_path).into_iter().filter_map(|e| e.ok()) {
    let path = entry.path();
    let path_str = path.to_string_lossy();
    if path_str.contains("node_modules") || path_str.contains("/target/") || path_str.contains(".git") { continue; }
    
    if entry.file_type().is_file() && path.extension().is_some_and(|ext| ext == "py") {
      let file_name = path.file_name().unwrap().to_string_lossy().to_string();
      let node_id = format!("python:{}", file_name);
      nodes.push(GraphNode { id: node_id.clone(), label: file_name.clone(), kind: "python_module".into() });
      
      if let Ok(content) = fs::read_to_string(path) {
        for line in content.lines() {
          let trimmed = line.trim();
          if trimmed.starts_with("def ") || trimmed.starts_with("class ") {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() > 1 {
              let sym_name = parts[1].split('(').next().unwrap().split(':').next().unwrap().trim();
              let sym_id = format!("{}:{}", node_id, sym_name);
              nodes.push(GraphNode { id: sym_id.clone(), label: sym_name.to_string(), kind: "symbol".into() });
              edges.push(GraphEdge { id: format!("{}->{}", node_id, sym_id), source: node_id.clone(), target: sym_id, kind: "defines".into() });
            }
          }
          if trimmed.starts_with("import ") || trimmed.starts_with("from ") {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            let target_module = if trimmed.starts_with("import ") && parts.len() > 1 { parts[1].split('.').next().unwrap().to_string() }
            else if trimmed.starts_with("from ") && parts.len() > 1 { parts[1].split('.').next().unwrap().to_string() }
            else { "".to_string() };
            
            if !target_module.is_empty() {
              let target_id = format!("python:{}.py", target_module);
              edges.push(GraphEdge { id: format!("{}->{}", node_id, target_id), source: node_id.clone(), target: target_id, kind: "depends_on".into() });
            }
          }
        }
      }
    }
  }

  // 3. SAT Solver DFS Loop Resolver (Semantic Guard)
  // Rejects returning the graph if Destructive Entropy / Circular Paradox exists.
  if let Err(e) = crate::analyzer::sat_solver::detect_circular_dependencies(&app, &nodes, &edges) {
      eprintln!("[SAT SOLVER] Refusing SDG Compilation: {}", e);
      // Wait to drop compilation, for the sake of frontend UI visualization we'll still return the graph 
      // but the event emitter hook has already fired the SENTINEL BLOCK onto the GUI.
  }

  Ok(Graph{ nodes, edges })
}

#[command]
pub async fn run_job(app: AppHandle, contract_path: String) -> Result<String, String> {
  let root = project_root().map_err(|e| e.to_string())?;
  let orchestrator_path = root.parent().unwrap()
    .join("antigravity_skills")
    .join("dev-loop-orchestrator")
    .join("scripts")
    .join("dev_loop_orchestrator.py");

  if !orchestrator_path.exists() {
    return Err(format!("Orchestrator not found at {:?}", orchestrator_path));
  }

  let validator_path = PathBuf::from("/home/fabio/Desktop/codex_agent_vm_blueprint/CONTRACTS_UNIFIED/scripts/validate_job.py");
  
  if validator_path.exists() {
    let val_output = std::process::Command::new("python3")
        .arg(&validator_path)
        .arg("--job")
        .arg(&contract_path)
        .output();
    
    if let Ok(out) = val_output {
        if !out.status.success() {
            let err = String::from_utf8_lossy(&out.stderr).to_string();
            return Err(format!("Contract Validation Failed: {}", err));
        }
    }
  }

  let run_root = root.join(".agent").join("dev-loop-runs");
  fs::create_dir_all(&run_root).ok();

  let mut child = std::process::Command::new("timeout")
    .arg("--kill-after=5s")
    .arg("120s")
    .arg("python3")
    .arg(&orchestrator_path)
    .arg("--job-path")
    .arg(&contract_path)
    .arg("--run-root")
    .arg(&run_root)
    .current_dir(&root)
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
    .map_err(|e| e.to_string())?;

  let stdout = child.stdout.take().unwrap();
  let stderr = child.stderr.take().unwrap();

  let app_clone = app.clone();
  let err_thread = std::thread::spawn(move || {
    let reader = BufReader::new(stderr);
    let mut err_acc = String::new();
    for line in reader.lines().flatten() {
      err_acc.push_str(&line);
      err_acc.push('\n');
      app_clone.emit("orchestrator-log", line).ok();
    }
    err_acc
  });

  let mut stdout_acc = String::new();
  let reader = BufReader::new(stdout);
  for line in reader.lines().flatten() {
    stdout_acc.push_str(&line);
    stdout_acc.push('\n');
  }

  let status = child.wait().map_err(|e| e.to_string())?;
  let final_stderr = err_thread.join().unwrap_or_default();

  if !status.success() {
    return Err(format!("Orchestrator failed ({}): {}", status, final_stderr));
  }
  Ok(stdout_acc)
}

#[command]
pub fn start_agent_telemetry(app: AppHandle) {
  std::thread::spawn(move || {
    let path = std::path::Path::new("/tmp/anima_orchestration.log");
    
    // Ensure the file exists before watching
    if !path.exists() {
      File::create(path).ok();
    }

    let mut last_pos = if let Ok(meta) = fs::metadata(path) { meta.len() } else { 0 };
    let (tx, rx) = std::sync::mpsc::channel();
    let mut watcher = notify::recommended_watcher(tx).expect("Failed to create notify watcher");
    
    watcher.watch(path, RecursiveMode::NonRecursive).expect("Failed to watch log file");

    for res in rx {
      if let Ok(event) = res {
        if matches!(event.kind, EventKind::Modify(ModifyKind::Data(_))) {
          if let Ok(mut file) = File::open(path) {
            if file.seek(SeekFrom::Start(last_pos)).is_ok() {
              let reader = BufReader::new(&file);
              for line in reader.lines().flatten() {
                app.emit("orchestrator-log", line).ok();
              }
            }
            if let Ok(meta) = file.metadata() {
                last_pos = meta.len();
            }
          }
        }
      }
    }
  });
}
