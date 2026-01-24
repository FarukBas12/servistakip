import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const role = await login(formData.username, formData.password);
            // ...
            if (role === 'admin') navigate('/admin');
            else if (role === 'depocu') navigate('/admin/stocks');
            else navigate('/tech');
        } catch (err) {
            console.error(err);
            if (!err.response) {
                setError('Sunucuya Bağlanılamadı! (Network Error)');
            } else if (err.response.status === 401 || err.response.status === 400) {
                setError('Hatalı Kullanıcı Adı veya Şifre');
            } else {
                setError(`Giriş Hatası: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="glass-panel login-form">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/logo.png" alt="App Logo" className="app-logo" style={{ width: '160px', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }} />
                    <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Giriş Yap</h2>
                </div>
                {error && <p className="error" style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}
                <input
                    className="glass-input"
                    type="text"
                    placeholder="Kullanıcı Adı"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
                <input
                    className="glass-input"
                    type="password"
                    placeholder="Şifre"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <button disabled={loading} type="submit" className="glass-btn" style={{ marginTop: '10px' }}>
                    {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
            </form>
        </div>
    );
};

export default Login;
