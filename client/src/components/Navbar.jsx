import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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
                <strong style={{ fontSize: '1.2rem', marginRight: '20px' }}>APPnov</strong>
                <span style={{ marginLeft: '20px' }}>
                    {user.role === 'admin' ? (
                        <>
                            <Link to="/admin" style={{ color: 'white', marginRight: '15px' }}>Panel</Link>
                            <Link to="/admin/pool" style={{ color: 'white', marginRight: '15px' }}>İş Havuzu</Link>
                            <Link to="/admin/map" style={{ color: 'white', marginRight: '15px' }}>Harita</Link>
                            <Link to="/admin/reports" style={{ color: 'white', marginRight: '15px' }}>Raporlar</Link>
                            <Link to="/admin/create-user" style={{ color: 'white' }}>Personel Ekle</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/tech" style={{ color: 'white', marginRight: '15px' }}>Görevlerim</Link>
                        </>
                    )}
                </span>
            </div>
            <div>
                <span style={{ marginRight: '1rem', opacity: 0.8 }}>{user.role}</span>
                <button onClick={handleLogout} className="glass-btn" style={{ background: 'rgba(255, 107, 107, 0.3)', borderColor: 'rgba(255,107,107,0.5)' }}>Çıkış</button>
            </div>
        </nav>
    );
};

export default Navbar;
