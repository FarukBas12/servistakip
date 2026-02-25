import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { List, Sun, Moon, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme, companyLogo, companyName } = useTheme();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);

    // Global Ctrl+K shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <>
            {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

            <nav className="glass-panel" style={{ margin: '1rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {companyLogo
                        ? <img src={companyLogo} alt={companyName} style={{ height: '38px', marginRight: '12px', borderRadius: '8px', objectFit: 'contain' }} />
                        : <img src="/logo.svg" alt="M-Tech Logo" style={{ height: '44px', marginRight: '15px', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.4))' }} />
                    }
                    <strong style={{ fontSize: '1.1rem', marginRight: '20px', whiteSpace: 'nowrap' }}>{companyName}</strong>
                    <span style={{ marginLeft: '10px' }}>
                        {user.role === 'admin' ? (
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <Link to="/admin" className="nav-link">İşler</Link>
                                <Link to="/admin/pool" className="nav-link">İş Havuzu</Link>
                                <Link to="/admin/map" className="nav-link">Harita</Link>
                                <Link to="/admin/reports" className="nav-link">Raporlar</Link>
                                <Link to="/admin/create-user" className="nav-link">Personel Ekle</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <NavLink
                                    to="/tech"
                                    end
                                    style={({ isActive }) => ({
                                        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                        textDecoration: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        padding: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    })}
                                >
                                    <List size={20} style={{ marginBottom: '4px' }} />
                                    Görevlerim
                                </NavLink>
                            </div>
                        )}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Global Search Button */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '7px 12px', borderRadius: '10px',
                            background: 'var(--glass-surface)', border: 'var(--glass-border)',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                            fontSize: '0.82rem', transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                        title="Ara (Ctrl+K)"
                    >
                        <Search size={15} />
                        <span style={{ opacity: 0.7 }}>Ara...</span>
                        <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.7rem' }}>⌃K</kbd>
                    </button>

                    <span style={{ opacity: 0.7, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{user.role}</span>

                    <button
                        onClick={toggleTheme}
                        className="icon-btn"
                        title={isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
                        style={{ padding: '8px', borderRadius: '50%' }}
                    >
                        {isDarkMode ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color="#6366f1" />}
                    </button>

                    <NotificationBell />
                    <button onClick={handleLogout} className="glass-btn" style={{ background: 'rgba(255, 107, 107, 0.2)', borderColor: 'rgba(255,107,107,0.3)', padding: '8px 16px' }}>Çıkış</button>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
