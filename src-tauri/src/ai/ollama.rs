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
