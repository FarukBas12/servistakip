import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { List, Sun, Moon } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="glass-panel" style={{ margin: '1rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/logo.svg" alt="M-Tech Logo" style={{ height: '44px', marginRight: '15px', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.4))' }} />
                <strong style={{ fontSize: '1.2rem', marginRight: '20px' }}>Servis Takip</strong>
                <span style={{ marginLeft: '20px' }}>
                    {user.role === 'admin' ? (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <Link to="/admin" className="nav-link">İşler</Link>
                            <Link to="/admin/pool" className="nav-link">İş Havuzu</Link>
                            <Link to="/admin/map" className="nav-link">Harita</Link>
                            <Link to="/admin/reports" className="nav-link">Raporlar</Link>
                            <Link to="/admin/create-user" className="nav-link">Personel Ekle</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '15px' }}> {/* Added div for flex layout */}
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
                            {/* PROJECT LINK REMOVED AS PER REQUEST */}
                        </div>
                    )}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>{user.role}</span>

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
        </nav >
    );
};

export default Navbar;
