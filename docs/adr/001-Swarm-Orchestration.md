# ADR 001: Local Agentic Swarm Orchestration Strategy

## Status
Accepted

## Context
The L🜔DΛEЯ⦿N ∆NIM♾S requires the generation, refactoring, and validation of complex 3D logic topologies consisting of hundreds of files. If a single central autonomous agent is forced to ingest and maintain state for an entire repository while handling user UI state, it quickly saturates context windows and token limits, resulting in hallucination and catastrophic breakdown. 

## Decision
We implement a **Top Manager / Sub-Agent Swarm Topology**. 
- The central orchestrator ("Top Manager") retains continuous execution control but restricts itself solely to decision-making, planning, and task allocation.
- When file edits or feature creation are required, the Top Manager dynamically spawns a localized, non-interactive `codex CLI` (or Ollama/local LLM) subprocess bounded explicitly to a specific folder or file array. 
- The Swarm worker possesses "Full Discretion" to complete the AST edit without interacting with the UI.

## Consequences
**Positive**: 
1. Extreme thermodynamic and API efficiency. The Top Manager spends ~200 tokens delegating a task that would otherwise require 20,000 tokens to process inline.
2. Complete concurrency. Multiple Swarm jobs can process different DOM elements or Rust modules simultaneously.
3. Total physical separation of planning state from coding state.

**Negative**:
1. Requires immutable `.tar.gz` or Git checkpoints to prevent rogue Sub-Agents from destroying the repository before the Top Manager validates the output.
2. Sub-Agents lack the long-term context of the Top Manager. Commands dispatched must be excruciatingly precise and explicitly bounded.
