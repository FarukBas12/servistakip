import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Inbox, Users, LogOut, FolderOpen, Package, Truck, Settings } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const isTech = user?.role === 'technician';

    const menuItems = [
        { path: '/admin', icon: <LayoutDashboard size={22} />, label: 'Panel', exact: true },
        { path: '/admin/pool', icon: <Inbox size={22} />, label: 'Servisler' },
        { path: '/admin/suppliers', icon: <Truck size={22} />, label: 'Tedarikçiler' },
        { path: '/admin/subs', icon: <Users size={22} />, label: 'Taşeronlar' },
        ...(!isTech ? [{ path: '/admin/projects', icon: <FolderOpen size={22} />, label: 'Projeler' }] : []),
        { path: '/admin/stocks', icon: <Package size={22} />, label: 'Stok' },
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
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        title={item.label}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Settings */}
            <NavLink
                to="/admin/settings"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title="Ayarlar"
                style={{ marginTop: 'auto', marginBottom: '5px' }}
            >
                <span className="sidebar-icon"><Settings size={22} /></span>
                <span className="sidebar-label">Ayarlar</span>
            </NavLink>

            {/* Logout */}
            <button className="sidebar-logout" onClick={logout} title="Çıkış Yap">
                <LogOut size={22} />
            </button>
        </div>
    );
};

export default Sidebar;
