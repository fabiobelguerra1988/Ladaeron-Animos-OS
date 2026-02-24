import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from '@dagrejs/dagre';
import { invoke } from '@tauri-apps/api/core';
import { AnimaNode } from '../components/graph/AnimaNode';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAppStore } from '../store/useAppStore';

type GraphData = {
  nodes: { id: string; label: string; kind: string }[];
  edges: { id: string; source: string; target: string; kind: string }[]
};

const nodeTypes = {
  anima: AnimaNode,
};

const DAGRE_NODE_WIDTH = 260;
const DAGRE_NODE_HEIGHT = 90;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.width ?? DAGRE_NODE_WIDTH,
      height: node.height ?? DAGRE_NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      position: {
        x: nodeWithPosition.x - (node.width ?? DAGRE_NODE_WIDTH) / 2,
        y: nodeWithPosition.y - (node.height ?? DAGRE_NODE_HEIGHT) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function GraphTab(props: {
  rootDir: string;
  onLog: (s: string) => void;
  onSelectFile: (p: string) => void;
  onRun: () => void;
}) {
  const { rootDir, onLog, onSelectFile, onRun } = props;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [menu, setMenu] = useState<{ x: number, y: number, nodeId?: string, kind?: string, label?: string } | null>(null);
  const [focusNode, setFocusNode] = useState<string | null>(null);
  const [contextLock, setContextLock] = useState(false);
  const { activeFile, setActiveFile, layers, setLayers, edgeFilter, setEdgeFilter } = useAppStore();

  const exitFocusMode = useCallback(() => {
    setFocusNode(null);
    setContextLock(false);
    setActiveFile(null);
    onLog('Focus mode cleared');
  }, [onLog, setActiveFile]);

  const isFocusMode = !!(focusNode || contextLock || activeFile);

  useEffect(() => {
    (async () => {
      if (!rootDir) return;
      try {
        const g = await invoke<GraphData>('cargo_graph', { root: rootDir });

        const rfNodes: Node[] = g.nodes.map((n, i) => ({
          id: n.id,
          type: 'anima',
          position: { x: (i % 6) * 300, y: Math.floor(i / 6) * 150 },
          data: { label: n.label, kind: n.kind },
        }));

        const rfEdges: Edge[] = g.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1.5 },
          label: e.kind,
          labelStyle: { fill: '#888', fontSize: 10 }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rfNodes, rfEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        onLog(`Graph: loaded ${g.nodes.length} nodes (L0)`);
      } catch (e: any) {
        onLog(`Graph error: ${String(e)}`);
      }
    })();
  }, [rootDir]);

  const onMoveEnd = useCallback((event: any, viewport: any) => {
    setZoomLevel(viewport.zoom);
  }, []);

  const onNodeClick = useCallback((event: any, node: Node) => {
    setFocusNode(node.id === focusNode ? null : node.id);
  }, [focusNode]);

  const onNodeDoubleClick = useCallback((event: any, node: Node) => {
    if (node.data.kind === 'module') {
      const parts = node.id.split(':');
      if (parts.length > 1) {
        onSelectFile(`${rootDir}/src/${parts[1]}`);
      }
    }
  }, [rootDir, onSelectFile]);

  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    // Check if we right-clicked on a node
    const target = event.target as HTMLElement;
    const nodeEl = target.closest('.react-flow__node');
    let nodeId: string | undefined;
    if (nodeEl) {
      nodeId = (nodeEl as any).getAttribute('data-id');
    }

    setMenu({ x: event.clientX, y: event.clientY, nodeId });
    onLog(`Interaction: Radial Menu opened ${nodeId ? `for ${nodeId}` : ''}`);
  }, [onLog]);

  const closeMenu = () => setMenu(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFocusMode) {
        exitFocusMode();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [exitFocusMode, isFocusMode]);

  // Dynamic Visibility & Focus Filtering
  const visibleNodes = useMemo(() => {
    return nodes.map(n => {
      const isModule = n.data.kind === 'module' || n.data.kind === 'crate';
      const isSymbol = n.data.kind === 'symbol';
      const isJob = n.data.kind === 'job';

      const hidden =
        (isModule && (!layers.code || zoomLevel < 0.6 && n.data.kind !== 'crate')) ||
        (isSymbol && (!layers.symbols || zoomLevel < 1.3)) ||
        (isJob && (!layers.runs || zoomLevel < 1.8));

      let opacity = 1;
      if (focusNode) {
        const isFocus = n.id === focusNode;
        const isNeighbor = edges.some(e => (e.source === focusNode && e.target === n.id) || (e.target === focusNode && e.source === n.id));
        opacity = (isFocus || isNeighbor) ? 1 : 0.2;
      }

      return { ...n, hidden, style: { ...n.style, opacity, transition: 'opacity 0.3s' } };
    });
  }, [nodes, zoomLevel, focusNode, edges, layers]);

  const visibleEdges = useMemo(() => {
    return edges.filter(e => {
      if (!edgeFilter.connections && e.label !== 'call') return false;
      if (!edgeFilter.calls && e.label === 'call') return false;
      return true;
    }).map(e => {
      let opacity = 1;
      if (focusNode) {
        opacity = (e.source === focusNode || e.target === focusNode) ? 1 : 0.1;
      }
      return { ...e, style: { ...e.style, opacity, transition: 'opacity 0.3s' } };
    });
  }, [edges, focusNode, edgeFilter]);

  return (
    <div style={{ height: '100%', position: 'relative' }} onContextMenu={onContextMenu}>
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6,
        padding: '8px 12px', background: 'rgba(15,15,15,0.85)', backdropFilter: 'blur(10px)',
        borderRadius: 8, fontSize: 11, border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div>Zoom: {zoomLevel.toFixed(2)}</div>
          <div style={{ borderLeft: '1px solid #555', paddingLeft: 10 }}>
            Layer: {zoomLevel < 0.6 ? 'L0 (Overview)' : zoomLevel < 1.3 ? 'L1 (Modules)' : zoomLevel < 1.8 ? 'L2 (Symbols)' : 'L3 (Jobs)'}
          </div>
          <div style={{ borderLeft: '1px solid #555', paddingLeft: 10 }}>
            <label style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={contextLock} onChange={e => setContextLock(e.target.checked)} /> Lock Selection
            </label>
          </div>
          {focusNode && (
            <div style={{ borderLeft: '1px solid #555', paddingLeft: 10, color: '#007acc' }}>
              Focus: {focusNode} <button onClick={exitFocusMode} style={{ background: 'transparent', border: 'none', color: '#ffaaaa', padding: '0 4px', fontSize: 10, cursor: 'pointer' }}>✕</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 15, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
          <div style={{ display: 'flex', gap: 8, color: '#aaa' }}>
            <b>Overlays:</b>
            <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={layers.code} onChange={e => setLayers({ ...layers, code: e.target.checked })} /> Code</label>
            <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={layers.symbols} onChange={e => setLayers({ ...layers, symbols: e.target.checked })} /> Symbols</label>
            <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={layers.runs} onChange={e => setLayers({ ...layers, runs: e.target.checked })} /> Runs</label>
            <button
              onClick={() => setLayers({ ...layers, timeLens: !layers.timeLens })}
              style={{
                cursor: 'pointer',
                borderRadius: 999,
                border: `1px solid ${layers.timeLens ? '#9d74ff' : 'rgba(255,255,255,0.2)'}`,
                background: layers.timeLens ? 'rgba(128, 86, 255, 0.25)' : 'rgba(255,255,255,0.04)',
                color: layers.timeLens ? '#d6c6ff' : '#c7c7c7',
                fontSize: 11,
                lineHeight: 1,
                padding: '5px 10px',
              }}
              title="Toggle temporal history overlay"
              type="button"
            >
              ⏱ Time Lens
            </button>
            <button
              onClick={() => setLayers({ ...layers, heatLens: !layers.heatLens })}
              style={{
                cursor: 'pointer',
                borderRadius: 999,
                border: `1px solid ${layers.heatLens ? '#ff7a29' : 'rgba(255,255,255,0.2)'}`,
                background: layers.heatLens ? 'rgba(255, 92, 26, 0.24)' : 'rgba(255,255,255,0.04)',
                color: layers.heatLens ? '#ffd2b3' : '#c7c7c7',
                fontSize: 11,
                lineHeight: 1,
                padding: '5px 10px',
              }}
              title="Toggle complexity heat overlay"
              type="button"
            >
              🔥 Heat Map
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, color: '#aaa', borderLeft: '1px solid #555', paddingLeft: 15 }}>
            <b>Edges:</b>
            <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={edgeFilter.connections} onChange={e => setEdgeFilter({ ...edgeFilter, connections: e.target.checked })} /> Structural</label>
            <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={edgeFilter.calls} onChange={e => setEdgeFilter({ ...edgeFilter, calls: e.target.checked })} /> Calls</label>
          </div>
        </div>
      </div>

      <ErrorBoundary>
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onMoveEnd={onMoveEnd}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={!contextLock}
          nodesConnectable={false}
          zoomOnScroll={!contextLock}
          panOnDrag={!contextLock}
          onlyRenderVisibleElements={true}
          style={{ background: '#0f0f0f' }}
        >
          <Background variant={BackgroundVariant.Lines} color="#222" gap={40} />
          <Controls />
        </ReactFlow>
      </ErrorBoundary>

      {isFocusMode && (
        <button
          onClick={exitFocusMode}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            zIndex: 20,
            padding: '10px 14px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(25, 25, 25, 0.9)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)'
          }}
          title="Exit focus mode (Esc)"
        >
          Exit Focus (Esc)
        </button>
      )}

      {menu && (
        <div
          onClick={closeMenu}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000
          }}
        >
          <div style={{
            position: 'absolute', top: menu.y - 60, left: menu.x - 60,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(20, 20, 20, 0.9)', backdropFilter: 'blur(10px)',
            border: '1px solid #333', boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10, textAlign: 'center' }}>
              <button
                onClick={() => { onRun(); closeMenu(); }}
                style={{ fontSize: 9, cursor: 'pointer' }}
              >
                Run {menu.nodeId ? 'Target' : 'All'}
              </button>
              <button
                onClick={() => {
                  if (menu.nodeId) {
                    const parts = menu.nodeId.split(':');
                    if (parts.length > 1) onSelectFile(`${rootDir}/src/${parts[1]}`);
                  }
                  closeMenu();
                }}
                disabled={!menu.nodeId}
                style={{ fontSize: 9, cursor: menu.nodeId ? 'pointer' : 'default' }}
              >
                Edit
              </button>
              <button onClick={closeMenu} style={{ fontSize: 9, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
