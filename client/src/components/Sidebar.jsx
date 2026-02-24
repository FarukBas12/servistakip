import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, Inbox, Users, LogOut, FolderOpen, Package, Truck, Settings, Sun, Moon, Network } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const isTech = user?.role === 'technician';

    // mobile: true → Tab barında gösterilir | false → sadece masaüstünde
    const menuItems = [
        { path: '/admin', icon: <LayoutDashboard size={22} />, label: 'Panel', exact: true, mobile: true },
        { path: '/admin/pool', icon: <Inbox size={22} />, label: 'Servisler', mobile: true },
        { path: '/admin/users', icon: <Users size={22} />, label: 'Personeller', mobile: false },
        { path: '/admin/hierarchy', icon: <Network size={22} />, label: 'Hiyerarşi', mobile: false },
        { path: '/admin/suppliers', icon: <Truck size={22} />, label: 'Tedarikçiler', mobile: false },
        { path: '/admin/subs', icon: <Users size={22} />, label: 'Taşeronlar', mobile: false },
        ...(!isTech ? [{ path: '/admin/projects', icon: <FolderOpen size={22} />, label: 'Projeler', mobile: true }] : []),
        { path: '/admin/stocks', icon: <Package size={22} />, label: 'Stok', mobile: true },
    ].filter(item => {
        if (user?.role === 'depocu') {
            return item.path === '/admin/stocks';
        }
        return true;
    });

    return (
        <div className="sidebar sidebar-container">
            {/* Logo */}
            <div className="sidebar-logo-area">
                <img src="/logo.svg" alt="M-Tech" className="sidebar-logo" />
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''} ${!item.mobile ? 'mobile-secondary' : ''}`
                        }
                        title={item.label}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions: Settings + Theme + Logout */}
            <div className="sidebar-actions">
                <NavLink
                    to="/admin/settings"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    title="Ayarlar"
                >
                    <span className="sidebar-icon"><Settings size={22} /></span>
                    <span className="sidebar-label">Ayarlar</span>
                </NavLink>

                <button
                    className="sidebar-link"
                    onClick={toggleTheme}
                    title={isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
                    style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
                >
                    <span className="sidebar-icon">
                        {isDarkMode ? <Sun size={22} color="#fbbf24" /> : <Moon size={22} color="#6366f1" />}
                    </span>
                    <span className="sidebar-label">{isDarkMode ? 'Aydınlık' : 'Karanlık'}</span>
                </button>

                <button className="sidebar-logout" onClick={logout} title="Çıkış Yap">
                    <LogOut size={22} />
                    <span className="sidebar-label">Çıkış</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
