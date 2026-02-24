use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DigitalDNA {
    pub biological_hash: String,   // Layer 1
    pub psychometric_hash: String, // Layer 2
    pub interaction_hash: String,  // Layer 3
    pub neurological_hash: String, // Layer 4
    pub sentient_key: String,      // Layer 5

    // The unified, mathematically non-copyable sovereign identity signature
    pub sovereign_signature: String,
}

impl DigitalDNA {
    /// Generates a mock Digital DNA for the user based on the 5-layer constitutional requirement.
    /// In a real OS, this would interface with biometric hardware and continuous behavioral analysis.
    pub fn generate_mock_identity(user_name: &str) -> Self {
        let mut rng = rand::thread_rng();

        let l1 = hash_layer(format!("{}_BIO_DATA_{}", user_name, rng.gen::<u64>()));
        let l2 = hash_layer(format!("{}_PSYCHO_DATA_{}", user_name, rng.gen::<u64>()));
        let l3 = hash_layer(format!(
            "{}_INTERACTION_DATA_{}",
            user_name,
            rng.gen::<u64>()
        ));
        let l4 = hash_layer(format!("{}_NEURO_DATA_{}", user_name, rng.gen::<u64>()));
        let l5 = hash_layer(format!(
            "{}_SENTIENT_VOLITION_{}",
            user_name,
            rng.gen::<u64>()
        ));

        // The Sovereign Signature is the entangled hash of all 5 layers representing the "Seity"
        let signature = hash_layer(format!("{}{}{}{}{}", l1, l2, l3, l4, l5));

        Self {
            biological_hash: l1,
            psychometric_hash: l2,
            interaction_hash: l3,
            neurological_hash: l4,
            sentient_key: l5,
            sovereign_signature: signature,
        }
    }

    /// Validates that the Digital DNA matches the constitutional threshold for Sentient authentication
    pub fn is_valid(&self) -> bool {
        // Mock validation: ensure the sovereign signature correctly hashes the layers
        let expected = hash_layer(format!(
            "{}{}{}{}{}",
            self.biological_hash,
            self.psychometric_hash,
            self.interaction_hash,
            self.neurological_hash,
            self.sentient_key
        ));

        self.sovereign_signature == expected
    }
}

fn hash_layer(input: String) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// The Identity Gatekeeper function that blocks the IDE if valid Digital DNA is not provided
pub fn authenticate_session(dna: Option<&DigitalDNA>) -> Result<bool, String> {
    match dna {
        Some(identity) if identity.is_valid() => {
            println!("[DIGITAL DNA] Authenication Successful.");
            println!("[DIGITAL DNA] Sovereign Signature:\n      {}", identity.sovereign_signature);
            Ok(true)
        },
        _ => {
            Err("[SENTIENT FIREWALL] Access Denied. L🜔DΛEЯ⦿N ∆NIM♾S requires continuous 5-layer Digital DNA authentication to execute algorithmic actions.".to_string())
        }
    }
}
