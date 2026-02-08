import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const role = await login(formData.username, formData.password);
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
        <div className="login-page-container">
            {/* Animated Background Particles */}
            <div className="particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        '--delay': `${Math.random() * 5}s`,
                        '--duration': `${15 + Math.random() * 10}s`,
                        '--x': `${Math.random() * 100}%`,
                        '--size': `${2 + Math.random() * 4}px`
                    }} />
                ))}
            </div>

            {/* Glowing Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            <div className="login-card">
                {/* Header */}
                <div className="login-header">
                    <div className="vector-logo-wrapper">
                        <img src="/logo.svg" alt="M-Tech Logo" className="login-logo" />
                    </div>
                    <h1>M-Tech</h1>
                    <p>Saha Servis Yönetim Sistemi</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Kullanıcı Adı</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                className="premium-input"
                                type="text"
                                placeholder="Kullanıcı adınızı girin"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Şifre</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                className="premium-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Şifrenizi girin"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className={`submit-btn ${loading ? 'loading' : ''}`}
                    >
                        {loading ? (
                            <div className="btn-content">
                                <div className="spinner"></div>
                                <span>Giriş Yapılıyor...</span>
                            </div>
                        ) : (
                            <div className="btn-content">
                                <span>Giriş Yap</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </div>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <div className="security-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>Güvenli Bağlantı</span>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <p className="copyright">© 2024 M-Tech. Tüm hakları saklıdır.</p>
        </div>
    );
};

export default Login;
