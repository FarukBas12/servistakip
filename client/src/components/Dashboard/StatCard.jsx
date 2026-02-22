import React from 'react';

const StatCard = ({ icon: Icon, title, value, color, gradient }) => {
    return (
        <div className="glass-panel" style={{
            padding: '20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            border: `1px solid ${gradient[2]}`
        }}>
            <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: gradient[3],
                color: color
            }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{value}</div>
                <div style={{ color: '#888', fontSize: '0.9rem' }}>{title}</div>
            </div>
        </div>
    );
};

export default StatCard;
