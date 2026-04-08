import React from 'react';

const StatCard = ({ icon: Icon, title, value, color, gradient, pulse }) => {
    return (
        <div className={`glass-panel ${pulse ? 'pulse-card' : ''}`} style={{
            padding: '20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            background: `linear-gradient(135deg, ${gradient[0] || 'rgba(255,255,255,0.05)'}, ${gradient[1] || 'rgba(0,0,0,0)'})`,
            border: `1px solid ${pulse ? color : (gradient[2] || 'rgba(255,255,255,0.1)')}`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <style>{`
                @keyframes pulse-animation {
                    0% { box-shadow: 0 0 0 0px ${color}44; }
                    70% { box-shadow: 0 0 0 10px ${color}00; }
                    100% { box-shadow: 0 0 0 0px ${color}00; }
                }
                .pulse-card {
                    animation: pulse-animation 2s infinite;
                    border-color: ${color} !important;
                }
            `}</style>
            <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: gradient[3] || 'rgba(255,255,255,0.05)',
                color: color
            }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{value}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{title}</div>
            </div>
        </div>
    );
};

export default StatCard;
