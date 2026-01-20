import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    const menuItems = [
        { path: '/admin', icon: '🏠', label: 'İşler', exact: true },
        { path: '/admin/pool', icon: '📥', label: 'Havuz' },
        { path: '/admin/map', icon: '🗺️', label: 'Harita' },
        { path: '/admin/materials', icon: '🧱', label: 'Malzemeler' },
        { path: '/admin/reports', icon: '📊', label: 'Raporlar' },
        { path: '/admin/create-user', icon: '👥', label: 'Personel' },
    ];

    return (
        <div style={{
            width: '80px',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '20px',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 1000,
            transition: 'width 0.3s ease'
        }}
            className="sidebar"
        >
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '40px' }} />
            </div>

            <nav style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '60px',
                            height: '60px',
                            textDecoration: 'none',
                            color: 'white',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <button
                onClick={logout}
                style={{
                    marginBottom: '20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    padding: '10px'
                }}
                title="Çıkış Yap"
            >
                🚪
            </button>

            <style>{`
                .sidebar:hover {
                    width: 100px;
                }
                .sidebar-link:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }
                .sidebar-link.active {
                    background: rgba(33, 150, 243, 0.4);
                    border: 1px solid rgba(33, 150, 243, 0.6);
                    box-shadow: 0 0 15px rgba(33, 150, 243, 0.3);
                }
            `}</style>
        </div>
    );
};

export default Sidebar;
