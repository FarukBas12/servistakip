import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Inbox, Map, FileBarChart, Users, LogOut, Activity, FolderArchive, Wallet, Database, Shield, FolderOpen } from 'lucide-react'; // Added Wallet

const Sidebar = () => {
    const { user, logout } = useAuth();
    const isTech = user?.role === 'technician';

    const menuItems = [
        { path: '/admin', icon: <LayoutDashboard size={24} />, label: 'Panel', exact: true },
        { path: '/admin/pool', icon: <Inbox size={24} />, label: 'Havuz' },
        { path: '/admin/subs', icon: <Users size={24} />, label: 'Taşeronlar' },
        // Hide Projects for Technicians
        ...(!isTech ? [{ path: '/admin/projects', icon: <FolderOpen size={24} />, label: 'Projeler' }] : []),
        { path: '/admin/settings', icon: <Shield size={24} />, label: 'Ayarlar' },
    ];

    return (
        <div style={{
            width: '80px',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '30px',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 1000,
            transition: 'width 0.3s ease'
        }}
            className="sidebar"
        >
            <div style={{ marginBottom: '40px', opacity: 0.8 }}>
                <img src="/logo.png" alt="Logo" style={{ width: '56px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} />
            </div>

            <nav style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
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
                            width: '50px',
                            height: '50px',
                            textDecoration: 'none',
                            color: '#e0e0e0',
                            borderRadius: '10px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ marginBottom: '4px', opacity: 0.8 }}>{item.icon}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.5px' }}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <button
                onClick={() => window.location.reload(true)}
                style={{
                    marginBottom: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#e0e0e0',
                    opacity: 0.5,
                    padding: '10px',
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                }}
                title="Güncellemeleri Kontrol Et (Yenile)"
            >
                <Activity size={20} />
                <span style={{ fontSize: '0.6rem' }}>Yenile</span>
            </button>

            <button
                onClick={logout}
                style={{
                    marginBottom: '30px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    opacity: 0.5,
                    padding: '10px',
                    transition: 'opacity 0.2s'
                }}
                title="Çıkış Yap"
            >
                <LogOut size={24} />
            </button>

            <style>{`
                .sidebar:hover {
                    background: rgba(255, 255, 255, 0.04);
                }
                .sidebar-link:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: white;
                }
                .sidebar-link.active {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
                }
                button:hover {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default Sidebar;
