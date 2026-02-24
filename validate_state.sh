#!/bin/bash
set -e

echo "============================================="
echo "[SWARM_GUARD] 🛡️ Initiating System Truth Validation"
echo "============================================="

echo "[SWARM_GUARD] 1. Testing React TypeScript AST (Frontend Syntax)..."
npx tsc --noEmit || { echo "[ERROR] ❌ TypeScript AST Syntax failure. Revert and Fix immediately."; exit 1; }

echo "[SWARM_GUARD] 2. Testing Vite Packaging Logic..."
# Mute normal stdout, but fail if the build chain breaks
npm run build > /dev/null || { echo "[ERROR] ❌ Vite Bundler failed. Revert and Fix immediately."; exit 1; }

echo "[SWARM_GUARD] 3. Testing Rust Tauri UI & Bevy Engines (Backend Logic)..."
# Using --quiet to minimize Swarm Token Cost, but will print errors if failed
cargo check --manifest-path src-tauri/Cargo.toml --quiet || { echo "[ERROR] ❌ Rust Compiler (cargo check) failed. Revert and Fix immediately."; exit 1; }
cargo test --manifest-path src-tauri/Cargo.toml --quiet || { echo "[ERROR] ❌ Rust Unit Tests failed. Revert and Fix immediately."; exit 1; }

echo "============================================="
echo "[SWARM_GUARD] ✅ ALL SYSTEMS NOMINAL. State is stable."
echo "============================================="
echo "[SWARM_GUARD] 4. Creating Immutable Checkpoint Sandbox..."

# Make sure git is tracked
mkdir -p .swarm_checkpoints
TIMESTAMP=$(date +'%Y%m%d_%H%M%S')
tar --exclude="src-tauri/target" --exclude="node_modules" -czf .swarm_checkpoints/checkpoint_${TIMESTAMP}.tar.gz src src-tauri package.json src-tauri/Cargo.toml || echo "[SWARM_GUARD] ℹ️ Snapshot failed, but build succeeded."

echo "============================================="
echo "[SWARM_GUARD] 🟢 PASS! The Top Manager may proceed with the next master logic execution."
echo "============================================="
