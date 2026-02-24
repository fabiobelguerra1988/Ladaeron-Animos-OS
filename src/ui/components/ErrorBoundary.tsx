import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div style={{ padding: 20, background: '#440000', color: '#ffaaaa', borderRadius: 8, margin: 20 }}>
                    <h2>Component Crash (Isolated)</h2>
                    <p>The ANIMA Universal Node renderer caught a topological error.</p>
                    <pre style={{ fontSize: 11, opacity: 0.8 }}>{this.state.error?.toString()}</pre>
                    <button onClick={() => this.setState({ hasError: false })} style={{ padding: '5px 10px', marginTop: 10 }}>Retry Render</button>
                </div>
            );
        }

        return this.props.children;
    }
}
