import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarWidget = ({ currentDate, prevMonth, nextMonth, renderCalendar }) => {
    return (
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>📅 Takvim</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={prevMonth} className="icon-btn"><ChevronLeft size={20} /></button>
                    <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'center' }}>
                        {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="icon-btn"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                {renderCalendar()}
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '15px', opacity: 0.7 }}>Not eklemek için bir güne tıklayın.</p>
        </div>
    );
};

export default CalendarWidget;
