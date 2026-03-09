import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('App crashed:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f1f5f9',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h1 style={{ color: '#e11d48', fontSize: '1.5rem', marginBottom: '1rem' }}>
                        Something went wrong
                    </h1>
                    <pre style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1rem',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        maxWidth: '600px',
                        overflow: 'auto',
                        textAlign: 'left',
                        marginBottom: '1.5rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                    }}>
                        {this.state.error?.toString()}
                        {"\n\nStack Trace:\n"}
                        {this.state.error?.stack}
                    </pre>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            background: '#e11d48',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1rem'
                        }}
                    >
                        Go Back Home
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
