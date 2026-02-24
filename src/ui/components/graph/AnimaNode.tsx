import React from 'react';
import { Handle, Position } from 'reactflow';
import { useAppStore } from '../../store/useAppStore';
import { invoke } from '@tauri-apps/api/core';

/**
 * Universal Immutable Node Core
 * This node is the absolute minimum necessity required for logic to occur visually.
 * Depending on the 'kind' and 'layer', it can represent a Rust file, an OS Concept, or an AI Context.
 */
export const AnimaNode = ({ data, selected }: any) => {
    const kind = String(data?.kind ?? '').toLowerCase();
    const timeLens = useAppStore((s) => s.layers.timeLens);
    const heatLens = useAppStore((s) => s.layers.heatLens);
    const rootDir = useAppStore((s) => s.rootDir);

    const kindMeta: Record<string, { icon: string; color: string; tint: string; edge: string }> = {
        crate: { icon: '📦', color: '#6bb7ff', tint: 'rgba(107, 183, 255, 0.16)', edge: 'rgba(107, 183, 255, 0.75)' },
        module: { icon: '🧩', color: '#8fd3ff', tint: 'rgba(143, 211, 255, 0.16)', edge: 'rgba(143, 211, 255, 0.72)' },
        ts_module: { icon: '⚛️', color: '#61dafb', tint: 'rgba(97, 218, 251, 0.16)', edge: 'rgba(97, 218, 251, 0.72)' },
        python_module: { icon: '🐍', color: '#ffeb3b', tint: 'rgba(255, 235, 59, 0.16)', edge: 'rgba(255, 235, 59, 0.72)' },
        struct: { icon: '🏗️', color: '#66d9a6', tint: 'rgba(102, 217, 166, 0.16)', edge: 'rgba(102, 217, 166, 0.72)' },
        enum: { icon: '🔀', color: '#f7b267', tint: 'rgba(247, 178, 103, 0.16)', edge: 'rgba(247, 178, 103, 0.72)' },
        trait: { icon: '🧬', color: '#bd9bff', tint: 'rgba(189, 155, 255, 0.16)', edge: 'rgba(189, 155, 255, 0.72)' },
        function: { icon: 'λ', color: '#ffe082', tint: 'rgba(255, 224, 130, 0.16)', edge: 'rgba(255, 224, 130, 0.72)' },
        job: { icon: '⚙️', color: '#ff8f8f', tint: 'rgba(255, 143, 143, 0.16)', edge: 'rgba(255, 143, 143, 0.72)' },
    };

    const fallbackMeta = { icon: '●', color: '#b6bcc8', tint: 'rgba(182, 188, 200, 0.13)', edge: 'rgba(182, 188, 200, 0.6)' };
    const meta = kindMeta[kind] ?? fallbackMeta;
    const baseShadow = `0 10px 28px rgba(0, 0, 0, 0.34), 0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 0 24px ${meta.tint}`;
    const temporalOverlayShadow = '0 0 0 1px rgba(176, 132, 255, 0.55), 0 0 16px rgba(154, 102, 255, 0.55), 0 0 34px rgba(124, 58, 237, 0.45)';
    const heatOverlayShadow = '0 0 0 1px rgba(255, 112, 46, 0.55), 0 0 20px rgba(255, 76, 23, 0.6), 0 0 42px rgba(255, 154, 54, 0.45)';

    const isModule = kind.includes("module");

    const auditNode = async () => {
        try {
            await invoke('jarvis_audit_file', {
                root: rootDir,
                nodeId: data.id,
                model: "llama3.2" // JARVIS OS default
            });
        } catch (e) {
            console.error("JARVIS Audit Error:", e);
        }
    };

    return (
        <div
            className={timeLens ? 'temporal-overlay' : undefined}
            style={{
                padding: '13px 18px 12px',
                borderRadius: '24px',
                background: `linear-gradient(145deg, rgba(36, 40, 52, 0.84), rgba(23, 26, 36, 0.72)), ${meta.tint}`,
                backdropFilter: 'blur(14px) saturate(135%)',
                border: `1px solid ${selected ? '#00f0ff' : meta.edge}`,
                color: '#fff',
                boxShadow: [baseShadow, timeLens ? temporalOverlayShadow : null, heatLens ? heatOverlayShadow : null]
                    .filter(Boolean)
                    .join(', '),
                fontSize: '13px',
                fontWeight: 500,
                textAlign: 'center',
                minWidth: '130px',
                borderLeft: `4px solid ${meta.color}`
            }}>
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <div>{data.label}</div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: meta.color,
                    background: `linear-gradient(145deg, ${meta.tint}, rgba(255, 255, 255, 0.03))`,
                    border: `1px solid ${meta.edge}`,
                    boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.04) inset, 0 8px 18px rgba(0, 0, 0, 0.22), 0 0 16px ${meta.tint}`,
                }}>
                    <span style={{ fontSize: '12px', lineHeight: 1 }}>{meta.icon}</span>
                    <span>{kind || 'node'}</span>
                </div>

                {selected && isModule && (
                    <button
                        onClick={auditNode}
                        style={{
                            background: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid #00f0ff',
                            color: '#00f0ff',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '9px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                    >
                        Audit AST Node
                    </button>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
};
