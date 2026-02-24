import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, BellOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const NotificationBell = ({ placement = 'bottom-right' }) => {
    const { isDarkMode } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const audioRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

    const playSound = () => {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                const newUnreadCount = data.filter(n => !n.is_read).length;

                setUnreadCount(prevCount => {
                    if (newUnreadCount > prevCount) {
                        playSound();
                    }
                    return newUnreadCount;
                });

                setNotifications(data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // 10s polling
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const getDropdownStyle = () => {
        const baseStyle = {
            position: 'absolute',
            width: 'min(350px, calc(100vw - 24px))',
            maxHeight: '450px',
            backgroundColor: isDarkMode ? 'rgba(13, 19, 33, 0.97)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            borderRadius: '16px',
            zIndex: 11000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
            animation: 'slideIn 0.2s ease-out'
        };

        if (placement === 'right-start') {
            return { ...baseStyle, top: '0', left: '100%', marginLeft: '10px' };
        }
        // Default (bottom-right): anchor to right edge, clamp so it doesn't go off-screen left
        return { ...baseStyle, top: 'calc(100% + 10px)', right: '0' };
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="icon-btn"
                style={{
                    position: 'relative',
                    padding: '8px',
                    borderRadius: '50%'
                }}
            >
                <Bell size={22} color={unreadCount > 0 ? '#fbbf24' : 'currentColor'} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: '#ef4444',
                        color: 'var(--text-primary)',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        border: isDarkMode ? '2px solid #0d1321' : '2px solid white',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={getDropdownStyle()}>
                    <div style={{
                        padding: '18px',
                        borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Bildirimler</h4>
                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                                {unreadCount} Yeni
                            </span>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#818cf8',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Tümünü Oku
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', maxHeight: '350px' }} className="scrollbar-hidden">
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.5 }}>
                                <BellOff size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
                                <p style={{ fontSize: '0.9rem' }}>Henüz bildiriminiz yok.</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} style={{
                                    padding: '15px 18px',
                                    borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
                                    backgroundColor: n.is_read ? 'transparent' : (isDarkMode ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)'),
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: '12px',
                                    transition: 'all 0.2s',
                                    cursor: 'default'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'}
                                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : (isDarkMode ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)')}
                                >
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', lineHeight: '1.4', fontWeight: n.is_read ? 400 : 500 }}>
                                            {n.message}
                                        </p>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                            {new Date(n.created_at).toLocaleString('tr-TR')}
                                        </span>
                                    </div>
                                    {!n.is_read && (
                                        <button
                                            onClick={(e) => markAsRead(n.id, e)}
                                            className="icon-btn"
                                            style={{ padding: '6px', color: '#818cf8' }}
                                            title="Okundu olarak işaretle"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <Link to="/admin" onClick={() => setIsOpen(false)} style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        color: '#818cf8',
                        borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)',
                        textDecoration: 'none',
                        fontWeight: 500
                    }}>
                        Tümünü Gör
                    </Link>
                </div>
            )}
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .scrollbar-hidden::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default NotificationBell;
