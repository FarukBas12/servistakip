import React, { useState } from 'react';
import { MapPin, Clock, MessageCircle, UserPlus, MoreVertical, Eye, Edit2, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { getInitials, stringToColor } from '../../utils/helpers';

const TaskCard = ({ task, isSahada, onAssign, onEdit, onView, onDelete, onVerify, onWhatsApp }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className={`tp-card ${isSahada ? 'tp-card--active' : 'tp-card--waiting'}`} style={{ zIndex: menuOpen ? 100 : 1 }}>
            {/* LEFT CONTENT */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span className={`tp-status ${isSahada ? 'tp-status--active' : 'tp-status--waiting'}`}>
                        {isSahada ? 'SAHADA' : 'BEKLİYOR'}
                    </span>

                    {task.region && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={11} /> {task.region}
                        </span>
                    )}

                    {task.source === 'email' && !task.verified_by && (
                        <span className="tp-verify-badge">
                            <AlertTriangle size={12} /> KONTROL BEKLİYOR
                        </span>
                    )}
                </div>

                <h3 style={{ margin: '0 0 3px 0', fontSize: '1rem', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.3px', background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'unset' }}>
                    {task.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.82rem' }}>
                    <MapPin size={12} color="#475569" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>{task.address}</span>
                </div>
            </div>

            {/* RIGHT SIDE: Assignees + Date + Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    {task.assigned_users && task.assigned_users.length > 0 ? (
                        <div className="tp-avatar-stack" title={task.assigned_users.map(u => u?.username).join(', ')}>
                            {task.assigned_users.map(u => {
                                if (!u) return null;
                                return u.photo_url ?
                                    <img key={u.id} src={u.photo_url} alt={u.username} /> :
                                    <div key={u.id} className="tp-initials" style={{ backgroundColor: stringToColor(u.username || '?') }}>{getInitials(u.username)}</div>;
                            })}
                        </div>
                    ) : (
                        <span style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>Atama Yok</span>
                    )}

                    {task.due_date && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> {new Date(task.due_date).toLocaleDateString('tr-TR')}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', flexShrink: 0 }}>
                    <button
                        className="tp-action-btn tp-action-btn--whatsapp"
                        onClick={(e) => { e.stopPropagation(); onWhatsApp(task); }}
                        title="WhatsApp"
                    >
                        <MessageCircle size={16} strokeWidth={2.5} />
                    </button>

                    <button
                        className="tp-action-btn tp-action-btn--assign"
                        onClick={(e) => { e.stopPropagation(); onAssign(task); }}
                        title="Personel Ata"
                    >
                        <UserPlus size={16} strokeWidth={2.5} />
                    </button>

                    <div style={{ position: 'relative' }}>
                        <button
                            className="tp-action-btn tp-action-btn--menu"
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        >
                            <MoreVertical size={16} />
                        </button>

                        {menuOpen && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)}></div>
                                <div className="tp-dropdown" style={{ zIndex: 100 }}>
                                    <button onClick={() => { setMenuOpen(false); onView(task); }}>
                                        <Eye size={15} /> Görüntüle
                                    </button>
                                    <button onClick={() => { setMenuOpen(false); onEdit(task); }}>
                                        <Edit2 size={15} /> Düzenle
                                    </button>
                                    {task.source === 'email' && !task.verified_by && (
                                        <button className="success" onClick={() => { setMenuOpen(false); onVerify(task.id); }}>
                                            <CheckCircle size={15} /> Onayla
                                        </button>
                                    )}
                                    <button className="danger" onClick={() => { setMenuOpen(false); onDelete(task.id); }}>
                                        <Trash2 size={15} /> Sil
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
