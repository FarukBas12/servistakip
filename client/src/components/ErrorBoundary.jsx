import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    color: '#fff',
                    background: '#121212',
                    minHeight: '100vh',
                    fontFamily: 'monospace'
                }}>
                    <h1 style={{ color: '#ef5350' }}>Bir Hata Oluştu! 🚨</h1>
                    <p>Uygulama çalışırken beklenmedik bir hatayla karşılaştı.</p>

                    <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginTop: '20px' }}>
                        <h3 style={{ marginTop: 0, color: '#fca5a5' }}>Hata Mesajı:</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#ffcdd2' }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    </div>

                    <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginTop: '20px' }}>
                        <h3 style={{ marginTop: 0, color: '#ccc' }}>Hata Yeri:</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa', fontSize: '0.8rem' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '30px',
                            padding: '12px 24px',
                            background: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        Sayfayı Yenile
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        style={{
                            marginTop: '30px',
                            marginLeft: '10px',
                            padding: '12px 24px',
                            background: '#333',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        Geri Dön
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
