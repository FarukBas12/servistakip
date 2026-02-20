import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, children, onClose, maxWidth = '500px' }) => {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{
                background: 'linear-gradient(180deg, #1e1e2e, #151520)',
                border: '1px solid rgba(255,255,255,0.08)',
                width: '100%', maxWidth: maxWidth,
                borderRadius: '16px', padding: '24px',
                position: 'relative',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8',
                    borderRadius: '50%', width: '32px', height: '32px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                }}>
                    <X size={18} />
                </button>

                {title && <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#fff' }}>{title}</h3>}

                <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '5px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
