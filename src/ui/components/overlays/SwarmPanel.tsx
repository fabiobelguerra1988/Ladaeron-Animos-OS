import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/useAppStore';

export const SwarmPanel: React.FC = () => {
    const { rootDir, swarmAgents } = useAppStore();
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState('Refactor the selected directory to use Zustand.');

    const agentsList = Object.values(swarmAgents);

    const handleDispatch = async () => {
        if (!rootDir || !prompt.trim()) return;

        const jobId = `swarm-${Date.now()}`;

        try {
            await invoke('dispatch_swarm_job', {
                jobId,
                prompt,
                contextDir: rootDir,
                model: 'oss' // Use local open-source models by default
            });
            setPrompt('');
        } catch (e) {
            console.error("Swarm Dispatch Error:", e);
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: 'absolute',
                    left: 20,
                    bottom: 20,
                    background: '#ff5e00',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 8,
                    boxShadow: '0 4px 15px rgba(255, 94, 0, 0.4)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 1000
                }}
            >
                🐝 Codex AI Swarm
            </button>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            left: 20,
            bottom: 20,
            width: 450,
            maxHeight: 600,
            background: '#1a1a1a',
            border: '1px solid #ff5e00',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            zIndex: 1000,
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '12px 16px',
                background: 'linear-gradient(90deg, #ff5e00, #b34200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold'
            }}>
                <span>🐝 Codex Local AI Swarm Dispatch</span>
                <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#ccc' }}>
                    Dispatch token-heavy tasks to your local <code>codex</code> CLI terminal model. The agent will run isolated outside the main thread.
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Instruct the swarm..."
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: '#111',
                            color: '#fff'
                        }}
                    />
                    <button
                        onClick={handleDispatch}
                        disabled={!rootDir}
                        style={{
                            background: '#ff5e00',
                            border: 'none',
                            padding: '0 16px',
                            borderRadius: 6,
                            color: '#fff',
                            fontWeight: 'bold',
                            cursor: rootDir ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Dispatch
                    </button>
                </div>

                <div style={{ marginTop: 10, borderTop: '1px solid #333', paddingTop: 10 }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: 13 }}>Active Sub-Agents ({agentsList.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                        {agentsList.length === 0 && <div className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>No active swarm agents</div>}

                        {agentsList.map(agent => (
                            <div key={agent.job_id} style={{
                                background: '#222',
                                padding: 10,
                                borderRadius: 8,
                                borderLeft: `3px solid ${agent.status === 'COMPLETED' ? '#28a745' : agent.status === 'FAILED' ? '#dc3545' : '#00aaff'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                    <strong style={{ fontFamily: 'monospace' }}>{agent.job_id.split('-')[1]}</strong>
                                    <span style={{
                                        color: agent.status === 'COMPLETED' ? '#28a745' : agent.status === 'FAILED' ? '#dc3545' : '#00aaff',
                                        fontWeight: 'bold'
                                    }}>{agent.status}</span>
                                </div>
                                <div style={{
                                    background: '#111',
                                    padding: 8,
                                    borderRadius: 4,
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                    color: '#aaa',
                                    maxHeight: 80,
                                    overflowY: 'auto'
                                }}>
                                    {agent.log[agent.log.length - 1] || 'Initializing...'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
