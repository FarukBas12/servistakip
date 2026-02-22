import React from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';

const WeatherWidget = ({ weather, cityName }) => {
    const getWeatherIcon = (code) => {
        if (code === 0) return <Sun size={24} color="#fbbf24" />;
        if (code >= 1 && code <= 3) return <Cloud size={24} color="#94a3b8" />;
        if (code >= 51) return <CloudRain size={24} color="#60a5fa" />;
        return <Cloud size={24} color="#94a3b8" />;
    };

    return (
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>🌤️ Hava Durumu ({cityName})</h3>
            {weather ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    {weather.time.map((t, i) => (
                        <div key={t} style={{ flex: 1, textAlign: 'center', padding: '15px 5px', background: 'var(--glass-surface)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{new Date(t).toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
                            {getWeatherIcon(weather.weather_code[i])}
                            <div style={{ marginTop: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {Math.round(weather.temperature_2m_max[i])}° <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{Math.round(weather.temperature_2m_min[i])}°</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p>Yükleniyor...</p>}
        </div>
    );
};

export default WeatherWidget;
