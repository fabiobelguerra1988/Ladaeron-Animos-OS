# ANIMA Graph IDE: SHARED Infrastructure Index

*Path of Least Resistance & Maximum Output Potential*

As per the 2nd law of thermodynamics, to prevent wasted energy and integration friction, this index maps all pre-existing tools, blueprints, and codebases found in `/media/fabio/SHARED`. These will be directly leveraged for **Phase 7: Advanced Architectures (3D/VR & 1st Citizen AI)** rather than rebuilding them from scratch.

---

## 1. Local AI Orchestration: OpenClaw
**Path:** `/media/fabio/SHARED/Openclaw.txt`
**Use Case (Phase 7.3):** The primary engine for the "1st Citizen AI". Rather than building a WebSockets gateway and memory-RAG system from zero, we will use OpenClaw's `--dev` instance (`ws://127.0.0.1:19001`) to power the local agent. It natively handles channel routing, message parsing, and terminal sandboxing.

## 2. 3D Spatial Engine & Math: Ludaeron Animos Core
**Path:** `/media/fabio/SHARED/PROJECT/`
**Use Case (Phase 7.1 & 7.4):** A fully built Rust workspace (`ludaeron-animos-core`) that already implements spatial operating system logic.
- **`modularity-math`**: Provides low-level topological math (SDF, Lyapunov stability) required for laying out the massive 3D VR nodes in Bevy.
- **`existence-layers`**: Handles the topological state manifold, directly accelerating the "Constitution Graph" for the AI.
- **`agent-orchestrator`**: Pre-built intent execution loops.

## 3. Spatial OS Blueprint
**Path:** `/media/fabio/SHARED/spatial_os_blueprint.zip`
**Use Case (Phase 7.1):** Contains zipped architectures and design documents for immersive 3D/VR spatial bridging. This will serve as our Bevy/Egui reference architecture.

## 4. Local Dependency Mirror (RepoLibrary)
**Path:** `/media/fabio/SHARED/RepoLibrary`
**Use Case (Phase 7 & General):** A massive pre-downloaded vault of AI runtimes (Ollama, llama.cpp, transformers) and OS/Rust ecosystems (Tokio, Serde, linux). This guarantees offline security, zero friction during internet outages, and hyper-fast builds matching the OS principles.

---

### Synergy Law (Energy Conservation Protocol)
*Never reinvent if the wheel is in the SHARED drive. Pull from `PROJECT` for math, pull from `OpenClaw` for AI gateways, and assemble them in `Anima_Graph_IDE`.*
