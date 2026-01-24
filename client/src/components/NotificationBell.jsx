import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';

const NotificationBell = ({ placement = 'bottom-right' }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
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

    // Calculate Position styles
    const getDropdownStyle = () => {
        const baseStyle = {
            position: 'absolute',
            width: '320px',
            maxHeight: '400px',
            backgroundColor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: '12px',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #eee'
        };

        if (placement === 'right-start') {
            return { ...baseStyle, top: '0', left: '100%', marginLeft: '10px' };
        }
        // Default: bottom-right
        return { ...baseStyle, top: '100%', right: '0', marginTop: '10px' };
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px'
                }}
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        border: '2px solid white'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={getDropdownStyle()}>
                    <div style={{
                        padding: '15px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#f9fafb'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>Bildirimler</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#2563eb',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                                Hiç bildirim yok.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} style={{
                                    padding: '12px 15px',
                                    borderBottom: '1px solid #f0f0f0',
                                    backgroundColor: n.is_read ? 'white' : '#f0f9ff',
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: '10px',
                                    transition: 'background 0.2s'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#333', lineHeight: '1.4' }}>
                                            {n.message}
                                        </p>
                                        <span style={{ fontSize: '11px', color: '#999' }}>
                                            {new Date(n.created_at).toLocaleString('tr-TR')}
                                        </span>
                                    </div>
                                    {!n.is_read && (
                                        <button
                                            onClick={(e) => markAsRead(n.id, e)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#2563eb',
                                                padding: '4px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="Okundu olarak işaretle"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
