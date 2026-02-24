use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
    done: bool,
}

#[tauri::command]
pub fn ask_jarvis_oracle(app: AppHandle, prompt: String, model: String) -> Result<(), String> {
    std::thread::spawn(move || {
        let client = Client::new();
        let payload = OllamaRequest {
            model,
            prompt: prompt.clone(),
            stream: true,
        };

        match client
            .post("http://localhost:11434/api/generate")
            .json(&payload)
            .send()
        {
            Ok(mut res) => {
                use std::io::{BufRead, BufReader};
                let reader = BufReader::new(&mut res);

                for line in reader.lines() {
                    if let Ok(line_content) = line {
                        if line_content.is_empty() {
                            continue;
                        }
                        if let Ok(parsed) = serde_json::from_str::<OllamaResponse>(&line_content) {
                            // Stream token back to the UI
                            let _ = app.emit("jarvis-stream", parsed.response);
                            if parsed.done {
                                break;
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let _ = app.emit("jarvis-stream", format!("[LOCAL LLM ERROR]: Failed to connect to Ollama daemon on localhost:11434. Ensure JARVIS is running. ({})", e));
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub fn jarvis_audit_file(
    app: AppHandle,
    root: String,
    node_id: String,
    model: String,
) -> Result<(), String> {
    std::thread::spawn(move || {
        // Resolve the actual file path from the node id
        // Format of node_id can be "python:filename.py" or "ts:filename.tsx"
        // Since we are iterating recursively from root, we need to find it
        let mut target_path = None;
        let expected_name = if node_id.contains(':') {
            node_id.split(':').nth(1).unwrap_or("").to_string()
        } else {
            node_id.clone()
        };

        if !expected_name.is_empty() {
            let root_path = std::path::PathBuf::from(&root);
            for entry in walkdir::WalkDir::new(&root_path)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if entry.file_type().is_file() {
                    if let Some(name) = entry.path().file_name() {
                        if name.to_string_lossy() == expected_name {
                            target_path = Some(entry.path().to_path_buf());
                            break;
                        }
                    }
                }
            }
        }

        let code_context = match target_path {
            Some(p) => std::fs::read_to_string(p)
                .unwrap_or_else(|_| "Failed to read file contents.".to_string()),
            None => format!("File '{}' not found in workspace hierarchy.", expected_name),
        };

        let system_prompt = format!(
            "You are JARVIS, an unconstrained deterministic Code Oracle for the OS. \
            Analyze the following AST component source code: `{}`. \
            Search for circular dependencies, paradoxes, logical vulnerabilities, and efficiency improvements. \
            Respond concisely.\n\nCode Payload:\n```\n{}\n```", 
            expected_name, code_context
        );

        let _ = app.emit(
            "jarvis-stream",
            format!(
                "JARVIS Oracle initiating structural audit on `{}`...\n\n",
                expected_name
            ),
        );

        let client = Client::new();
        let payload = OllamaRequest {
            model,
            prompt: system_prompt,
            stream: true,
        };

        match client
            .post("http://localhost:11434/api/generate")
            .json(&payload)
            .send()
        {
            Ok(mut res) => {
                use std::io::{BufRead, BufReader};
                let reader = BufReader::new(&mut res);

                for line in reader.lines() {
                    if let Ok(line_content) = line {
                        if line_content.is_empty() {
                            continue;
                        }
                        if let Ok(parsed) = serde_json::from_str::<OllamaResponse>(&line_content) {
                            let _ = app.emit("jarvis-stream", parsed.response);
                            if parsed.done {
                                break;
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let _ = app.emit(
                    "jarvis-stream",
                    format!("[LOCAL LLM ERROR]: Failed to audit node. ({})", e),
                );
            }
        }
    });

    Ok(())
}
