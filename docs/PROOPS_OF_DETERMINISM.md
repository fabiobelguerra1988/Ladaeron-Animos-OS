# Proof of Determinism: Contract-Driven Orchestration

The ANIMA Graph IDE implements a multi-agent orchestration system based on **Immutable Job Contracts**. This ensures that every operation is verifiable, reproducible, and deterministic.

## 1. Traceability via UID-Gated Emission
Every action (run, build, test) is uniquely identified by a `job_id` and emitted as a versioned JSON contract in `.agent/contracts/`.

## 2. Pre-Execution Formal Validation
Before the orchestrator initializes, the job contract is evaluated by the `validate_job.py` engine.
- **Schema Gating**: Enforces strict adherence to the Unified Agent Job Schema.
- **Dependency Isolation**: Validates that all workspace paths are within the container or project root.

## 3. Immutable Execution Contexts
The Rust backend creates an isolated `run_root` for every job. This provides:
- **Snapshots**: Prior state is recorded in `.anima_snapshots` before any write operation.
- **Audit Logs**: Every stdout/stderr stream is archived alongside the specific contract that generated it.

## 4. Graph-to-State Synchronization
The IDE's L3 layer visualizes Job nodes directly from the contract repository, allowing for direct inspection of any past state through the visual engine.
