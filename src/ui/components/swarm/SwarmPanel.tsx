import React, { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

export interface SwarmPeerPayload {
    node_id: string;
    node_type: string;
    status: string;
    heartbeat: number;
}

export function SwarmPanel() {
    const [peers, setPeers] = useState<Record<string, SwarmPeerPayload>>({});

    useEffect(() => {
        const unlisten = listen<SwarmPeerPayload>('swarm-peer-update', (event) => {
            setPeers(prev => ({
                ...prev,
                [event.payload.node_id]: event.payload
            }));
        });

        // Sub-loop to clean up dead peers (no heartbeat in 10 seconds)
        const cleanup = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            setPeers(prev => {
                const next = { ...prev };
                let changed = false;
                for (const [id, peer] of Object.entries(next)) {
                    if (now - peer.heartbeat > 10) {
                        delete next[id];
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, 5000);

        return () => {
            unlisten.then(f => f());
            clearInterval(cleanup);
        };
    }, []);

    const peerList = Object.values(peers);

    return (
        <article className="dashboard-card" style={{ borderTop: '2px solid #00f0ff' }}>
            <div className="dashboard-card-title" style={{ color: '#00f0ff', display: 'flex', justifyContent: 'space-between' }}>
                <span>SWARM Intelligence Mesh (Offline P2P)</span>
                <span style={{ fontSize: '10px', background: 'rgba(0, 240, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {peerList.length} Nodes Active
                </span>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {peerList.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', fontSize: '12px' }}>Scanning Local Subnet (224.0.0.123) for L🜔DΛEЯ⦿N Nodes...</div>
                ) : (
                    peerList.map(peer => (
                        <div key={peer.node_id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '8px',
                            borderLeft: peer.node_type === 'AI Agent' ? '2px solid #a64dff' : '2px solid #00ffcc',
                            borderRadius: '2px'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{peer.node_id}</span>
                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Type: {peer.node_type}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ffcc', boxShadow: '0 0 5px #00ffcc' }} />
                                <span style={{ fontSize: '9px', color: '#00ffcc' }}>{peer.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="dashboard-subtle-line" style={{ marginTop: '12px' }}>
                *UDP IPv4 Multicast enables decentralized, server-less orchestration among sovereign entities.
            </div>
        </article>
    );
}
