import React, { useState, useEffect } from 'react';
import { getInitials, stringToColor } from '../../utils/helpers';
import Modal from '../Modal';

const TaskAssignModal = ({ task, users, onAssign, onClose }) => {
    const [selectedAssignees, setSelectedAssignees] = useState([]);

    useEffect(() => {
        if (task && task.assigned_users) {
            setSelectedAssignees(task.assigned_users.map(u => u.id));
        } else {
            setSelectedAssignees([]);
        }
    }, [task]);

    const handleCheckboxChange = (userId) => {
        if (selectedAssignees.includes(userId)) {
            setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
        } else {
            setSelectedAssignees([...selectedAssignees, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onAssign(task.id, selectedAssignees);
    };

    return (
        <Modal title="Personel Yönetimi" onClose={onClose} maxWidth="500px">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ color: '#94a3b8', margin: '0 0 4px 0' }}>Görevlendirilecek personelleri seçiniz:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                    {users.map(u => (
                        <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', background: selectedAssignees.includes(u.id) ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer', border: selectedAssignees.includes(u.id) ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                            <input type="checkbox" checked={selectedAssignees.includes(u.id)} onChange={() => handleCheckboxChange(u.id)} style={{ transform: 'scale(1.2)', accentColor: 'var(--primary)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {u.photo_url ? <img src={u.photo_url} style={{ width: '34px', height: '34px', borderRadius: '50%' }} /> : <div className="tp-initials" style={{ width: '34px', height: '34px', borderRadius: '50%', background: stringToColor(u.username) }}>{getInitials(u.username)}</div>}
                                <span style={{ fontWeight: selectedAssignees.includes(u.id) ? '600' : '400', color: selectedAssignees.includes(u.id) ? '#fff' : '#94a3b8' }}>{u.username}</span>
                            </div>
                        </label>
                    ))}
                </div>
                <button type="submit" className="glass-btn glass-btn-primary" style={{ padding: '14px', fontWeight: '600', marginTop: '8px' }}>Atamayı Tamamla</button>
            </form>
        </Modal>
    );
};

export default TaskAssignModal;
