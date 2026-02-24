import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { aiGateway } from '../../services/aiGateway';

export const ProfessorAInstein: React.FC = () => {
    const { aiContextLoading, aiContextText, setAiContextLoading, setAiContextText, runState, activeFile } = useAppStore();
    const [question, setQuestion] = useState('');
    const [open, setOpen] = useState(false);
    const [gatewayStatus, setGatewayStatus] = useState<boolean>(false);

    useEffect(() => {
        aiGateway.onStatusChange((status) => {
            setGatewayStatus(status);
        });
        aiGateway.connect();
    }, []);

    const handleAsk = async () => {
        if (!question.trim()) return;

        setAiContextLoading(true);
        setAiContextText('');

        // Build context
        const context = `RunState: ${runState} | ActiveFile: ${activeFile || 'None'}`;

        const response = await aiGateway.askProfessor(context, question);
        setAiContextText(response);
        setAiContextLoading(false);
    };

    return (
        <div style={{
            position: 'absolute',
            right: 20,
            bottom: 20,
            width: open ? 350 : 50,
            height: open ? 400 : 50,
            backgroundColor: '#1e1e1e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: open ? 12 : 25,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1000
        }}>
            {/* Header Button */}
            <div
                onClick={() => setOpen(!open)}
                style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(90deg, #2a2a2a, #1a1a1a)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: gatewayStatus ? '#28a745' : '#dc3545',
                        boxShadow: `0 0 10px ${gatewayStatus ? '#28a745' : '#dc3545'}`
                    }} />
                    {open && <span style={{ fontWeight: 600, color: '#e0e0e0', fontSize: 13 }}>Professor AInstein</span>}
                </div>
                {!open && <span style={{ color: '#fff' }}>🤖</span>}
            </div>

            {/* Body */}
            {open && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 16 }}>
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, fontSize: 13, color: '#ccc', lineHeight: 1.5 }}>
                        {!gatewayStatus && (
                            <div style={{ color: '#ffaaaa', marginBottom: 10, fontSize: 12, padding: 8, background: 'rgba(255,0,0,0.1)', borderRadius: 4 }}>
                                ⚠️ OpenClaw Daemon offline. Start with <code>openclaw --dev gateway</code>.
                            </div>
                        )}

                        <p><strong>System:</strong> I am a read-only architectural teaching guide. I cannot write code, but I can read your graph topology and execution runs.</p>

                        {aiContextLoading && (
                            <div style={{ color: '#007acc', marginTop: 10, fontStyle: 'italic' }}>
                                Professor AInstein is analyzing the graph...
                            </div>
                        )}

                        {aiContextText && (
                            <div style={{ marginTop: 10, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, borderLeft: '3px solid #007acc' }}>
                                {aiContextText}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                            placeholder="Ask about the architecture..."
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: '#111',
                                color: '#fff',
                                outline: 'none',
                                fontSize: 12
                            }}
                        />
                        <button
                            onClick={handleAsk}
                            disabled={aiContextLoading || !gatewayStatus}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#007acc',
                                color: '#fff',
                                cursor: (aiContextLoading || !gatewayStatus) ? 'not-allowed' : 'pointer',
                                opacity: (aiContextLoading || !gatewayStatus) ? 0.5 : 1,
                                fontSize: 12,
                                fontWeight: 600
                            }}
                        >
                            Ask
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
