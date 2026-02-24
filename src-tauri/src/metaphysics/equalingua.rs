use std::collections::HashMap;
use serde::{Serialize, Deserialize};

/// The Holographic Principle of the OS.
/// A Node can seamlessly represent classical data (Body), probabilistic logic (Mind),
/// or qualitative meaning (Spirit).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HolographicLayer {
    Body(ClassicalData),     // Physical files, ast, spacetime constructs
    Mind(QuantumLogic),      // Execution probability, paths, computations
    Spirit(MeaningQualia),   // Human intent, meaning, EquaLingua definitions
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ClassicalData {
    pub file_path: Option<String>,
    pub ast_signature: Option<String>,
    pub binary_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct QuantumLogic {
    pub execution_probability: f64,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MeaningQualia {
    pub equalingua_concept: EquaLinguaConcept,
    pub intent_description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EquaLinguaConcept {
    // Phase 1 Universal Concepts (Abridged core set for the OS)
    Awareness,
    Logic,
    Creation,
    Energy,
    Entropy,
    Time,
    Connection,
    Boundary,
    Will,
    Consent,
    Unknown(String),
}

/// The Universal Node (The "Seity" Interface)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UniversalNode {
    pub id: String,
    pub layer: HolographicLayer,
    pub tags: Vec<String>,
    pub semantic_links: Vec<String>, // IDs of other connected UniversalNodes
}

impl UniversalNode {
    pub fn new(id: impl Into<String>, layer: HolographicLayer) -> Self {
        Self {
            id: id.into(),
            layer,
            tags: Vec::new(),
            semantic_links: Vec::new(),
        }
    }
}
