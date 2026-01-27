import React from 'react';

const LoadingSpinner = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            background: 'rgba(0,0,0,0.8)', // Dark overlay
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="spinner" style={{
                width: '50px',
                height: '50px',
                border: '5px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                borderTop: '5px solid #4facfe',
                animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
