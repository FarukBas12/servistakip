import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const role = await login(formData.username, formData.password);
            if (role === 'admin') navigate('/admin');
            else navigate('/tech');
        } catch (err) {
            setError('Invalid Credentials');
        }
    };

    return (
        <div className="login-container" style={{ background: 'var(--bg-color)' }}>
            <div className="glass-panel login-form">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/logo.png" alt="App Logo" style={{ width: '80px', marginBottom: '1rem' }} />
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
                <button type="submit" className="glass-btn" style={{ marginTop: '10px' }}>Giriş Yap</button>
            </form>
        </div>
    );
};

export default Login;
