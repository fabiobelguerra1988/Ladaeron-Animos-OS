import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Bot, Terminal, ShieldAlert } from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'jarvis';
    content: string;
}

export function JarvisTerminal() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Listen for streaming token chunks from the Rust LLM Bridge
        const unlisten = listen<string>('jarvis-stream', (event) => {
            setIsTyping(false);

            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];

                // If the last message was already from JARVIS, append the token stream
                if (lastMsg && lastMsg.role === 'jarvis') {
                    return [
                        ...prev.slice(0, prev.length - 1),
                        { ...lastMsg, content: lastMsg.content + event.payload }
                    ];
                } else {
                    // Otherwise, start a new JARVIS response block
                    return [
                        ...prev,
                        { id: Math.random().toString(36).substring(7), role: 'jarvis', content: event.payload }
                    ];
                }
            });
        });

        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            role: 'user',
            content: input
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Dispatch payload to Rust -> Ollama on localhost:11434
            await invoke('ask_jarvis_oracle', {
                prompt: userMsg.content,
                model: 'llama3' // Default fallback model per JARVIS spec
            });
        } catch (error) {
            console.error("JARVIS Offline Link Failed:", error);
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                { id: Math.random().toString(), role: 'jarvis', content: '[SYSTEM_ERROR] Sentinel Firewall blocked standard LLM query or localhost:11434 is unreachable.' }
            ]);
        }
    };

    return (
        <article className="dashboard-card" style={{ gridColumn: 'span 2', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div className="dashboard-card-title" style={{ color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} />
                <span>JARVIS Code Oracle (Local LLM)</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#00ffcc' }}>OLLAMA: ACTIVE</span>
                    <ShieldAlert size={14} color="#00ffcc" />
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '5px',
                border: '1px solid rgba(0, 240, 255, 0.1)'
            }}>
                {messages.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                        JARVIS is offline. Awaiting Orchestrator prompt via Localhost bridge...
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            background: msg.role === 'user' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${msg.role === 'user' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                            padding: '10px 15px',
                            borderRadius: '8px',
                            maxWidth: '85%',
                            color: msg.role === 'user' ? '#00f0ff' : '#e0e0e0',
                            fontFamily: msg.role === 'jarvis' ? 'monospace' : 'inherit',
                            whiteSpace: 'pre-wrap',
                            fontSize: '13px'
                        }}>
                            {msg.role === 'jarvis' && <strong style={{ color: '#b366ff', display: 'block', marginBottom: '5px', fontSize: '10px' }}>JARVIS // ORACLE</strong>}
                            {msg.content}
                        </div>
                    ))
                )}
                {isTyping && (
                    <div style={{ alignSelf: 'flex-start', color: '#00f0ff', fontStyle: 'italic', fontSize: '12px', opacity: 0.7 }}>
                        JARVIS is synthesizing response via localhost...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Query the local JARVIS LLM..."
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        color: '#fff',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        outline: 'none',
                        fontFamily: 'monospace'
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        border: '1px solid #00f0ff',
                        color: '#00f0ff',
                        padding: '0 20px',
                        borderRadius: '5px',
                        cursor: input.trim() ? 'pointer' : 'not-allowed',
                        opacity: input.trim() ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Terminal size={14} /> DXL
                </button>
            </div>
        </article>
    );
}
