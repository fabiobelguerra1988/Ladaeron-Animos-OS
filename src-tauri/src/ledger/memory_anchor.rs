use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LedgerAction {
    pub timestamp: String,
    pub action_type: String,
    pub payload: String,
    pub dna_signature: String,
}

pub struct MemoryAnchor {
    pub ledger_path: PathBuf,
}

impl MemoryAnchor {
    pub fn init(workspace: &Path) -> std::io::Result<Self> {
        let mut path = workspace.to_path_buf();
        path.push(".agent");
        path.push("memory_anchor.jsonl");

        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        Ok(Self { ledger_path: path })
    }

    /// Appends an action securely to the permanent mnemonic substrate
    pub fn commit_action(
        &self,
        action_type: &str,
        payload: &str,
        dna_signature: &str,
    ) -> std::io::Result<()> {
        let action = LedgerAction {
            timestamp: Utc::now().to_rfc3339(),
            action_type: action_type.to_string(),
            payload: payload.to_string(),
            dna_signature: dna_signature.to_string(),
        };

        let serialized = serde_json::to_string(&action)?;

        // Append-only write
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.ledger_path)?;

        writeln!(file, "{}", serialized)?;

        Ok(())
    }
}
