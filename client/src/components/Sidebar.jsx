import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard, Inbox, Users, LogOut, FolderOpen, Package,
    Truck, Settings, Sun, Moon, Network, Menu, X, Home
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme, companyLogo, companyName } = useTheme();
    const isTech = user?.role === 'technician';
    const [drawerOpen, setDrawerOpen] = useState(false);

    const allMenuItems = [
        { path: '/admin', icon: <LayoutDashboard size={22} />, drawerIcon: <LayoutDashboard size={20} />, label: 'Panel', exact: true, primary: true },
        { path: '/admin/pool', icon: <Inbox size={22} />, drawerIcon: <Inbox size={20} />, label: 'Servisler', primary: true },
        { path: '/admin/users', icon: <Users size={22} />, drawerIcon: <Users size={20} />, label: 'Personeller' },
        { path: '/admin/hierarchy', icon: <Network size={22} />, drawerIcon: <Network size={20} />, label: 'Hiyerarşi' },
        { path: '/admin/suppliers', icon: <Truck size={22} />, drawerIcon: <Truck size={20} />, label: 'Tedarikçiler' },
        { path: '/admin/subs', icon: <Users size={22} />, drawerIcon: <Users size={20} />, label: 'Taşeronlar' },
        ...(!isTech ? [{ path: '/admin/projects', icon: <FolderOpen size={22} />, drawerIcon: <FolderOpen size={20} />, label: 'Projeler', primary: true }] : []),
        { path: '/admin/stocks', icon: <Package size={22} />, drawerIcon: <Package size={20} />, label: 'Stok', primary: true },
    ].filter(item => {
        if (user?.role === 'depocu') return item.path === '/admin/stocks';
        return true;
    });

    const primaryItems = allMenuItems.filter(i => i.primary);

    const closeDrawer = () => setDrawerOpen(false);

    return (
        <>
            {/* ═══════════════════════════════════════
                DESKTOP SIDEBAR (hidden on mobile)
            ═══════════════════════════════════════ */}
            <div className="sidebar sidebar-container">
                <div className="sidebar-logo-area" title={companyName}>
                    {companyLogo
                        ? <img src={companyLogo} alt={companyName} className="sidebar-logo" style={{ borderRadius: '8px', objectFit: 'contain' }} />
                        : <img src="/logo.svg" alt="M-Tech" className="sidebar-logo" />
                    }
                </div>
                <nav className="sidebar-nav">
                    {allMenuItems.map((item) => (
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
                <div className="sidebar-actions">
                    <NavLink to="/admin/settings"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        title="Ayarlar">
                        <span className="sidebar-icon"><Settings size={22} /></span>
                        <span className="sidebar-label">Ayarlar</span>
                    </NavLink>
                    <button className="sidebar-link" onClick={toggleTheme}
                        title={isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
                        style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}>
                        <span className="sidebar-icon">
                            {isDarkMode ? <Sun size={22} color="#fbbf24" /> : <Moon size={22} color="#6366f1" />}
                        </span>
                        <span className="sidebar-label">{isDarkMode ? 'Aydınlık' : 'Karanlık'}</span>
                    </button>
                    <button className="sidebar-logout" onClick={logout} title="Çıkış Yap">
                        <LogOut size={22} />
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════
                MOBILE BOTTOM TAB BAR
            ═══════════════════════════════════════ */}
            <nav className="mobile-bottom-bar">
                {primaryItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}
                    >
                        <span className="mobile-tab-icon">{item.icon}</span>
                        <span className="mobile-tab-label">{item.label}</span>
                    </NavLink>
                ))}
                <button className="mobile-tab mobile-menu-btn" onClick={() => setDrawerOpen(true)}>
                    <span className="mobile-tab-icon"><Menu size={22} /></span>
                    <span className="mobile-tab-label">Menü</span>
                </button>
            </nav>

            {/* ═══════════════════════════════════════
                MOBILE DRAWER OVERLAY
            ═══════════════════════════════════════ */}
            <div
                className={`mobile-drawer-overlay ${drawerOpen ? 'visible' : ''}`}
                onClick={closeDrawer}
            />

            {/* ═══════════════════════════════════════
                MOBILE SLIDE-IN DRAWER (Left)
            ═══════════════════════════════════════ */}
            <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
                {/* Drawer Header */}
                <div className="mobile-drawer-header">
                    <img src="/logo.svg" alt="M-Tech" style={{ width: 34, height: 34, filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.5))' }} />
                    <span className="mobile-drawer-title">M-Tech Servis</span>
                    <button className="mobile-drawer-close" onClick={closeDrawer}>
                        <X size={20} />
                    </button>
                </div>

                {/* All Nav Items */}
                <nav className="mobile-drawer-nav">
                    <p className="mobile-drawer-section-label">Navigasyon</p>
                    {allMenuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                            onClick={closeDrawer}
                        >
                            <span className="mobile-drawer-link-icon">{item.drawerIcon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer: Settings + Theme + Logout */}
                <div className="mobile-drawer-footer">
                    <p className="mobile-drawer-section-label">Genel</p>

                    <NavLink to="/admin/settings"
                        className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                        onClick={closeDrawer}>
                        <span className="mobile-drawer-link-icon"><Settings size={20} /></span>
                        <span>Ayarlar</span>
                    </NavLink>

                    <button className="mobile-drawer-link" onClick={toggleTheme}>
                        <span className="mobile-drawer-link-icon">
                            {isDarkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#6366f1" />}
                        </span>
                        <span>{isDarkMode ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}</span>
                    </button>

                    <button className="mobile-drawer-link danger" onClick={() => { logout(); closeDrawer(); }}>
                        <span className="mobile-drawer-link-icon"><LogOut size={20} /></span>
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
