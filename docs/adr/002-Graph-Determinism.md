# ADR 002: Deterministic Graph Rendering & Topological Semantics

## Status
Accepted

## Context
When displaying over 500+ interconnected logic nodes, a physics-based, manual graph layout (e.g., d3-force or freeform ReactFlow dragging) devolves into a chaotic "hairball". Users and AI agents cannot decipher logic hierarchies if node placement is subjective and variable between sessions.

## Decision
We enforce **Absolute Topological Determinism**:
1. **Dagre Layout Engine**: Integrated `@dagrejs/dagre` with a strict Top-to-Bottom (`TB`) hierarchical rank calculation. Node position is derived entirely as a mathematical formula of edges and dependencies, stripping all manual coordinate noise.
2. **Viewport Culling**: ReactFlow is instructed to aggressively unmount DOM elements when they exit the visual canvas viewport (`onlyRenderVisibleElements`), protecting the rendering loop from memory saturation.
3. **Semantic Glassmorphism**: Node types (`crate`, `module`, `enum`, `trait`, `struct`, `function`) explicitly dictate icon taxonomy and exact box-shadow glow gradients (e.g., Red for Heat Lens, Purple for Time Lens). This removes reliance on text parsing, allowing the user/AI to process the graph biologically via visual grouping.

## Consequences
**Positive**: 
1. Guaranteed visual representation scaling infinitely.
2. Faster navigation; predictable tree structure prevents the user from "losing" their workspace.
3. Heatmap and Temporal overlays can modify CSS visual weight dynamically without forcing Dagre to recalculate geometry.

**Negative**:
1. The user loses the ability to "visually cluster" nodes manually for ad-hoc organization. If they wish to organize nodes, they must refactor the actual code module. (In a coding IDE, this is an acceptable and encouraged tradeoff).
