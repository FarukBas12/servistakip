import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Inbox, Map, FileBarChart, Users, LogOut, Activity, FolderArchive, Wallet, Database, Shield, FolderOpen, Package } from 'lucide-react'; // Added Package
import NotificationBell from './NotificationBell';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const isTech = user?.role === 'technician';

    // AUTO-UPDATE LOGIC
    const APP_VERSION = '1.3.8'; // MUST MATCH SERVER
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

        { path: '/admin/pool', icon: <Inbox size={24} />, label: 'Servisler' },
        { path: '/admin/subs', icon: <Users size={24} />, label: 'Taşeronlar' },
        // Hide Projects for Technicians
        ...(!isTech ? [{ path: '/admin/projects', icon: <FolderOpen size={24} />, label: 'Projeler' }] : []),
        { path: '/admin/stocks', icon: <Package size={24} />, label: 'Stok' },
        { path: '/admin/settings', icon: <Shield size={24} />, label: 'Ayarlar' },
    ].filter(item => {
        if (user?.role === 'depocu') {
            // Warehouse Manager sees ONLY Stocks
            return item.path === '/admin/stocks';
        }
        return true;
    });

    return (
        <div className="sidebar sidebar-container">
            <div className="sidebar-header" style={{ marginBottom: '20px', opacity: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '48px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} />
            </div>

            <nav className="sidebar-nav" style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
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
                            // width/height handled by CSS class now
                            textDecoration: 'none',
                            color: '#e0e0e0',
                            borderRadius: '10px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ marginBottom: '4px', opacity: 0.8 }}>{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <button
                className="sidebar-update-btn"
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
                className="sidebar-update-btn"
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
        </div>
    );
};

export default Sidebar;
