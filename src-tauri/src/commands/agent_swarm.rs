use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::thread;
use tauri::{command, AppHandle, Emitter};

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct SwarmEvent {
    pub job_id: String,
    pub status: String,
    pub output: String,
}

#[command]
pub fn dispatch_swarm_job(
    app: AppHandle,
    job_id: String,
    prompt: String,
    context_dir: String,
    model: Option<String>,
) -> Result<String, String> {
    // As the Top Manager, we spawn a detached worker thread to run the codex CLI sub-agent.
    thread::spawn(move || {
        let binary_path = "/home/fabio/.npm-global/bin/codex"; // Fast, hardcoded resolution for efficiency

        let mut cmd = Command::new(binary_path);
        cmd.arg("exec");
        cmd.arg(&prompt);
        cmd.arg("--cd").arg(&context_dir);
        cmd.arg("--full-auto"); // We trust our own generated sandbox domains

        if let Some(m) = model {
            cmd.arg("--model").arg(m);
        } else {
            // Default to ultra-fast local provider if unspecified
            cmd.arg("--oss");
        }

        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        app.emit(
            "swarm-event",
            SwarmEvent {
                job_id: job_id.clone(),
                status: "STARTED".to_string(),
                output: format!("Swarm task '{}' initiated in {}", job_id, context_dir),
            },
        )
        .ok();

        match cmd.spawn() {
            Ok(mut child) => {
                let stdout = child.stdout.take().expect("Failed to open codex stdout");
                let job_id_clone = job_id.clone();
                let app_clone = app.clone();

                thread::spawn(move || {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines().flatten() {
                        app_clone
                            .emit(
                                "swarm-event",
                                SwarmEvent {
                                    job_id: job_id_clone.clone(),
                                    status: "STREAMING".to_string(),
                                    output: line,
                                },
                            )
                            .ok();
                    }
                });

                let status_res = child.wait();

                match status_res {
                    Ok(status) => {
                        let final_state = if status.success() {
                            "COMPLETED"
                        } else {
                            "FAILED"
                        };
                        app.emit(
                            "swarm-event",
                            SwarmEvent {
                                job_id: job_id.clone(),
                                status: final_state.to_string(),
                                output: format!("Swarm agent Exited with status: {}", status),
                            },
                        )
                        .ok();
                    }
                    Err(e) => {
                        app.emit(
                            "swarm-event",
                            SwarmEvent {
                                job_id: job_id.clone(),
                                status: "FAILED".to_string(),
                                output: format!("Swarm agent Wait Error: {}", e),
                            },
                        )
                        .ok();
                    }
                }
            }
            Err(e) => {
                app.emit(
                    "swarm-event",
                    SwarmEvent {
                        job_id: job_id.clone(),
                        status: "FAILED".to_string(),
                        output: format!("Failed to spawn codex sub-agent: {}", e),
                    },
                )
                .ok();
            }
        }
    });

    Ok("Job dispatched to Local Swarm Pool.".to_string())
}
