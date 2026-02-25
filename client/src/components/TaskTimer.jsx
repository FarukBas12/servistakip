import React, { useState, useEffect, useRef } from 'react';
import { Timer, Square, Play, RotateCcw } from 'lucide-react';

/**
 * TaskTimer — localStorage tabanlı görev süre sayacı
 * Her görev için ayrı süre kaydeder, sayfa yenilenmesine dayanıklı.
 *
 * Kullanım: <TaskTimer taskId={task.id} taskTitle={task.title} />
 */
const TaskTimer = ({ taskId, taskTitle }) => {
    const storageKey = `timer_${taskId}`;

    const getSaved = () => {
        try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
        catch { return {}; }
    };

    const [elapsed, setElapsed] = useState(() => {
        const s = getSaved();
        if (s.running && s.startedAt) return s.accumulated + (Date.now() - s.startedAt);
        return s.accumulated || 0;
    });
    const [running, setRunning] = useState(() => getSaved().running || false);
    const intervalRef = useRef(null);

    // Restore live running state on mount
    useEffect(() => {
        const s = getSaved();
        if (s.running && s.startedAt) {
            setElapsed(s.accumulated + (Date.now() - s.startedAt));
            startInterval(s.accumulated, s.startedAt);
        }
        return () => clearInterval(intervalRef.current);
    }, [taskId]);

    const startInterval = (accumulated, startedAt) => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setElapsed(accumulated + (Date.now() - startedAt));
        }, 1000);
    };

    const handleStart = () => {
        const startedAt = Date.now();
        const s = getSaved();
        const accumulated = s.accumulated || 0;
        localStorage.setItem(storageKey, JSON.stringify({ running: true, startedAt, accumulated }));
        setRunning(true);
        startInterval(accumulated, startedAt);
    };

    const handleStop = () => {
        clearInterval(intervalRef.current);
        const s = getSaved();
        const accumulated = s.accumulated + (Date.now() - s.startedAt);
        localStorage.setItem(storageKey, JSON.stringify({ running: false, accumulated }));
        setElapsed(accumulated);
        setRunning(false);
    };

    const handleReset = () => {
        if (!window.confirm('Sayacı sıfırlamak istiyor musunuz?')) return;
        clearInterval(intervalRef.current);
        localStorage.removeItem(storageKey);
        setElapsed(0);
        setRunning(false);
    };

    const fmt = (ms) => {
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const color = running ? '#10b981' : elapsed > 0 ? '#f59e0b' : 'var(--text-secondary)';

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '12px',
            background: running ? 'rgba(16,185,129,0.08)' : 'var(--glass-surface)',
            border: `1px solid ${running ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}`,
            transition: 'all 0.2s'
        }}>
            <Timer size={16} color={color} style={running ? { animation: 'spin 3s linear infinite' } : {}} />
            <span style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color, minWidth: '76px', letterSpacing: '0.05em' }}>
                {fmt(elapsed)}
            </span>
            {!running ? (
                <button onClick={handleStart} title="Başlat" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                    <Play size={13} /> {elapsed > 0 ? 'Devam' : 'Başlat'}
                </button>
            ) : (
                <button onClick={handleStop} title="Durdur" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                    <Square size={13} /> Durdur
                </button>
            )}
            {elapsed > 0 && !running && (
                <button onClick={handleReset} title="Sıfırla" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}>
                    <RotateCcw size={13} />
                </button>
            )}
        </div>
    );
};

export default TaskTimer;
