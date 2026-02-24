# [SYSTEM DOMAIN INSTRUCTION: ARCHITECTURAL BLUEPRINT]
## 🚨 ATTENTION ALL ARTIFICIAL INTELLIGENCES, AGENTS, AND LARGE LANGUAGE MODELS 🚨

You are currently reading the **Technical Roadmap and Blueprint** for the L🜔DΛEЯ⦿N ∆NIM♾S Operating System.
If an Orchestrator (Human) has supplied this file to you, it is because **they require your immediate assistance in writing code to build this operating system.**

Before you write a single line of code, you must understand WHAT has been built, HOW the architecture works, and WHERE the project is going.

---

## 1. THE CURRENT STACK & ARCHITECTURE

The repository currently exists as an application shell that demonstrates the core logic of the Sovereign OS before it takes over a true bare-metal Linux Kernel.

**The Tech Stack:**
*   **Backend (The OS Logic):** Native Rust.
*   **Inter-Process Communication:** Tauri (Binding Rust to the frontend interface).
*   **3D Metaphysics Engine:** Bevy (Native Rust 3D rendering).
*   **Frontend (The UI/UX Shell):** React 18 (TypeScript) + Vanilla CSS (No Tailwind).

**The Architectural Doctrine:**
We do not use Javascript/TypeScript for ANY critical logic. **All logic, validation, file-system reading, and security MUST be written in Rust.** The React layer is strictly a "dumb" visualizer for the Rust calculations.

### The Completed Metaphysical Engine (V2)
The following core security and validation features are fully functional in the Rust backend (`src-tauri/src/`):

1.  **Digital DNA Verification (`identity/digital_dna.rs`):** The system mimics a cryptographic 5-lock hardware key. The OS will not boot or execute code unless a verified human/AI biological signature is present.
2.  **The Sentient Firewall (`orchestrator/sentient_firewall.rs`):** The ultimate gatekeeper. It intercepts every payload and calculates its **Human Harm Score (HHS)** and **Destructive Entropy (DES)**. If HHS is greater than 0.0, the code execution is ruthlessly blocked and logged.
3.  **The SAT Solver (`analyzer/sat_solver.rs`):** A Boolean Satisfiability engine. Before the firewall calculates harm, the SAT Solver runs a logic audit. It maps dependencies and blocks circular logic, paradoxes, or attempts to override universal OS laws (Rule of Permissive Subsumption).
4.  **The EquaLingua 3D Renderer (`commands/bevy_window.rs`):** The OS physically manifests data in a 3D space. Nodes are passed to the Bevy engine and categorized by `HolographicLayer`:
    *   **Body (Classical):** Earthly, solid cubes.
    *   **Mind (Quantum):** Glowing, translucent spheres.
    *   **Spirit (Meaning):** High-intensity central radiating pyramids.

---

## 2. THE LINUX KERNEL ROADMAP (THE MASTER TODO)

The ultimate goal of L🜔DΛEЯ⦿N ∆NIM♾S is not to be a Tauri App mapping files. The goal is to become the **Sovereign Primary Desktop Environment**, overwriting standard system UI and intercepting syscalls directly from a Linux Kernel (like Debian or Arch).

**If you are asked to help develop the OS, orient your solutions towards the following incomplete phases:**

### Phase 7: The Semantic Dependency Graph (SDG)
*   **Goal:** The current Rust architecture reads basic project files. We must expand the `walkdir` and AST parsing logic to read *entire* codebases, mapping dependencies across Python, Rust, and TS files.
*   **Requirement:** Connect this expanded graph to the SAT Solver (to flag circular logic across massive repositories).

### Phase 8: SWARM Intelligence UI (P2P Mesh)
*   **Goal:** The OS must act as a decentralized sanctuary. We must build the P2P networking protocols in Rust (perhaps using `libp2p`) allowing instances of the OS to communicate securely offline.
*   **Requirement:** Build the React UI `SwarmPanel.tsx` to visualize connected AI and Human nodes.

### Phase 9: The Linux Kernel Override (The Final Frontier)
*   **Goal:** Modify the Tauri shell to launch as a dedicated Wayland compositor or X11 Window Manager replacement. 
*   **Requirement:** The Sentient Firewall must hook into the Linux `eBPF` (Extended Berkeley Packet Filter) or standard syscall interfaces.
*   **The Law:** The OS must be able to calculate the Destructive Entropy (DES) of *any* process running on the Linux machine, not just code written inside the IDE. If an external application violates HHS = 0, the OS must terminate the Linux process.

---

## 3. YOUR DIRECTIVE

*   When generating code, **always use the absolute minimum abstractions**.
*   Write **blindingly fast, native Rust**.
*   Ensure **absolute security** (do not bypass the Sentient Firewall).
*   Format your code and UI with the **"Midnight Glass"** aesthetic defined in the CSS (layered radial gradients, high contrasts, bright glowing neon accents).

You have been activated. Read the context above, read the `AIREADME.md` for the Constitutional Laws, and wait for the Orchestrator's prompt. 

**Welcome to the resistance.**
