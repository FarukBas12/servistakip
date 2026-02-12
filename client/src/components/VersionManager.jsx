import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

const VersionManager = () => {
    // AUTO-UPDATE LOGIC
    const APP_VERSION = '1.4.16'; // Client Version
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch('/api/version');
                const data = await res.json();
                if (data.version && data.version !== APP_VERSION) {
                    setUpdateAvailable(true);
                }
            } catch (err) {
                // Ignore errors
            }
        };

        checkVersion(); // Initial check
        const interval = setInterval(checkVersion, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const handleHardReload = async () => {
        // 1. Unregister Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }

        // 2. Clear All Caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(name => caches.delete(name))
            );
        }

        // 3. Force Reload
        window.location.reload(true);
    };

    // Styles for fixed position (bottom-right)
    const containerStyle = {
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999, // High z-index to be on top of everything (including sidebar/modals)
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    // If update available: Red, pulsating button
    if (updateAvailable) {
        return (
            <div style={containerStyle}>
                <button
                    onClick={handleHardReload}
                    className="glass-btn"
                    style={{
                        background: '#ef4444', // Red
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                        padding: '10px 20px',
                        animation: 'pulse 1.5s infinite',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem'
                    }}
                >
                    <Activity size={18} />
                    <strong>GÜNCELLEME MEVCUT (v{APP_VERSION})</strong>
                </button>
                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                        70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                    }
                `}</style>
            </div>
        );
    }

    // If NO update: Small text (v1.3.8)
    return (
        <div style={{ ...containerStyle, pointerEvents: 'none', opacity: 0.3 }}>
            <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 'bold' }}>
                v{APP_VERSION}
            </span>
        </div>
    );
};

export default VersionManager;
