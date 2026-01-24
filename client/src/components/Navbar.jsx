import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { List } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="glass-panel" style={{ margin: '1rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '40px', marginRight: '15px' }} />
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
                                    color: isActive ? '#4facfe' : '#aaa',
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
            <div>
                <span style={{ marginRight: '1rem', opacity: 0.8 }}>{user.role}</span>
                <NotificationBell />
                <span style={{ margin: '0 10px' }}></span>
                <button onClick={handleLogout} className="glass-btn" style={{ background: 'rgba(255, 107, 107, 0.3)', borderColor: 'rgba(255,107,107,0.5)' }}>Çıkış</button>
            </div>
        </nav >
    );
};

export default Navbar;
