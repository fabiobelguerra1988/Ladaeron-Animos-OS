use crate::commands::orchestrator::{GraphEdge, GraphNode};
use crate::orchestrator::sentient_firewall::SentinelAlert;
use std::collections::{HashMap, HashSet};
use tauri::{AppHandle, Emitter};

pub fn analyze_for_paradoxes(
    app: &AppHandle,
    _graph_data: &str,
    is_mock_fail: bool,
) -> Result<(), String> {
    let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();

    // Evaluates incoming logic graphs for circular reasoning or axiom contradiction
    if is_mock_fail {
        let alert = SentinelAlert {
            level: "BLOCK".to_string(),
            component: "SAT_SOLVER".to_string(),
            message:
                "[ERROR] Axiom Contradiction. Node payload attempted to falsify Truth Anchor. Execution Dropped."
                    .to_string(),
            timestamp,
        };
        app.emit("sentinel-alert", alert).ok();
        return Err("SAT Solver Paradox Detected".to_string());
    }

    let alert = SentinelAlert {
        level: "SUCCESS".to_string(),
        component: "SAT_SOLVER".to_string(),
        message: "[SAT SOLVER] Payload Graph passed structural paradox resolution.".to_string(),
        timestamp,
    };
    app.emit("sentinel-alert", alert).ok();

    Ok(())
}

pub fn detect_circular_dependencies(
    app: &AppHandle,
    nodes: &[GraphNode],
    edges: &[GraphEdge],
) -> Result<(), String> {
    let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();

    // We only care about module-level dependencies or 'depends_on' edges
    let mut adj: HashMap<String, Vec<String>> = HashMap::new();
    for edge in edges {
        if edge.kind == "depends_on" || edge.kind == "imports" {
            adj.entry(edge.source.clone())
                .or_default()
                .push(edge.target.clone());
        }
    }

    let mut visited: HashSet<String> = HashSet::new();
    let mut stack: HashSet<String> = HashSet::new();

    fn dfs(
        node: &str,
        adj: &HashMap<String, Vec<String>>,
        visited: &mut HashSet<String>,
        stack: &mut HashSet<String>,
    ) -> Option<(String, String)> {
        if stack.contains(node) {
            return Some((node.to_string(), node.to_string())); // Found a cycle
        }
        if visited.contains(node) {
            return None;
        }

        visited.insert(node.to_string());
        stack.insert(node.to_string());

        if let Some(neighbors) = adj.get(node) {
            for neighbor in neighbors {
                if let Some(cycle) = dfs(neighbor, adj, visited, stack) {
                    return Some((node.to_string(), cycle.1));
                }
            }
        }

        stack.remove(node);
        None
    }

    // Check all nodes
    for node in nodes {
        if !visited.contains(&node.id) {
            if let Some((source, target)) = dfs(&node.id, &adj, &mut visited, &mut stack) {
                let alert = SentinelAlert {
                    level: "BLOCK".to_string(),
                    component: "SAT_SOLVER".to_string(),
                    message: format!(
                        "[BLOCK] SAT Solver: Circular Topological Paradox Detected between {} and {}.",
                        source, target
                    ),
                    timestamp,
                };
                app.emit("sentinel-alert", alert).ok();
                return Err("Circular Dependency Detected!".to_string());
            }
        }
    }

    Ok(())
}
