import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Inbox, Map, FileBarChart, Users, LogOut, Activity, FolderArchive, Wallet, Database, Shield, FolderOpen, Package } from 'lucide-react'; // Added Package
import NotificationBell from './NotificationBell';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const isTech = user?.role === 'technician';

    // AUTO-UPDATE LOGIC
    const APP_VERSION = '1.3.3'; // MUST MATCH SERVER
    const [updateAvailable, setUpdateAvailable] = React.useState(false);

    React.useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch('/api/version');
                const data = await res.json();
                if (data.version && data.version !== APP_VERSION) {
                    setUpdateAvailable(true);
                }
            } catch (err) {
                // Ignore errors (offline etc)
            }
        };

        checkVersion(); // Initial check
        const interval = setInterval(checkVersion, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        { path: '/admin', icon: <LayoutDashboard size={24} />, label: 'Panel', exact: true },
        { path: '/admin/pool', icon: <Inbox size={24} />, label: 'Havuz' },
        { path: '/admin/subs', icon: <Users size={24} />, label: 'Taşeronlar' },
        // Hide Projects for Technicians
        ...(!isTech ? [{ path: '/admin/projects', icon: <FolderOpen size={24} />, label: 'Projeler' }] : []),
        { path: '/admin/stocks', icon: <Package size={24} />, label: 'Stok' },
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
            <div style={{ marginBottom: '40px', opacity: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '56px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} />
                <div style={{ color: 'white' }}>
                    <NotificationBell placement="right-start" />
                </div>
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
                    background: updateAvailable ? '#ef4444' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: updateAvailable ? 'white' : '#e0e0e0',
                    opacity: updateAvailable ? 1 : 0.5,
                    padding: '10px',
                    borderRadius: updateAvailable ? '10px' : '0',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    animation: updateAvailable ? 'pulse 2s infinite' : 'none'
                }}
                title={updateAvailable ? "YENİ GÜNCELLEME MEVCUT! TIKLA" : "Güncellemeleri Kontrol Et (Yenile)"}
            >
                <Activity size={20} />
                <span style={{ fontSize: '0.6rem', fontWeight: updateAvailable ? 'bold' : 'normal' }}>
                    {updateAvailable ? 'GÜNCELLE' : 'Yenile'}
                </span>
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
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </div>
    );
};

export default Sidebar;
