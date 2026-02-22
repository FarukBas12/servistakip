import React from 'react';
import {
    Sun, Cloud, CloudRain, CloudLightning, CloudSnow,
    Droplets, Wind, CloudFog, CloudDrizzle, CloudSun
} from 'lucide-react';

const WeatherWidget = ({ weather, cityName }) => {
    const getWeatherDetails = (code) => {
        // WMO Weather interpretation codes (WW)
        const codes = {
            0: { icon: Sun, label: 'Açık Gökyüzü', color: '#fbbf24', bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0) 100%)' },
            1: { icon: CloudSun, label: 'Az Bulutlu', color: '#fbbf24', bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(148, 163, 184, 0.1) 100%)' },
            2: { icon: CloudSun, label: 'Parçalı Bulutlu', color: '#94a3b8', bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.05) 100%)' },
            3: { icon: Cloud, label: 'Bulutlu', color: '#94a3b8', bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.2) 0%, rgba(148, 163, 184, 0.05) 100%)' },
            45: { icon: CloudFog, label: 'Sisli', color: '#94a3b8', bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.2) 0%, rgba(148, 163, 184, 0.05) 100%)' },
            48: { icon: CloudFog, label: 'Kırağılı Sis', color: '#94a3b8', bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.2) 0%, rgba(148, 163, 184, 0.05) 100%)' },
            51: { icon: CloudDrizzle, label: 'Hafif Çiseleme', color: '#60a5fa', bg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0) 100%)' },
            53: { icon: CloudDrizzle, label: 'Çiseleme', color: '#60a5fa', bg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0) 100%)' },
            55: { icon: CloudDrizzle, label: 'Yoğun Çiseleme', color: '#3b82f6', bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 100%)' },
            61: { icon: CloudRain, label: 'Hafif Yağmurlu', color: '#60a5fa', bg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0) 100%)' },
            63: { icon: CloudRain, label: 'Yağmurlu', color: '#3b82f6', bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 100%)' },
            65: { icon: CloudRain, label: 'Şiddetli Yağmurlu', color: '#2563eb', bg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0) 100%)' },
            71: { icon: CloudSnow, label: 'Hafif Kar Yağışlı', color: '#93c5fd', bg: 'linear-gradient(135deg, rgba(147, 197, 253, 0.2) 0%, rgba(147, 197, 253, 0) 100%)' },
            73: { icon: CloudSnow, label: 'Kar Yağışlı', color: '#93c5fd', bg: 'linear-gradient(135deg, rgba(147, 197, 253, 0.25) 0%, rgba(147, 197, 253, 0.05) 100%)' },
            75: { icon: CloudSnow, label: 'Yoğun Kar Yağışlı', color: '#bfdbfe', bg: 'linear-gradient(135deg, rgba(191, 219, 254, 0.3) 0%, rgba(191, 219, 254, 0.1) 100%)' },
            80: { icon: CloudRain, label: 'Hafif Sağanak', color: '#60a5fa', bg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0) 100%)' },
            81: { icon: CloudRain, label: 'Sağanak Yağış', color: '#3b82f6', bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0) 100%)' },
            82: { icon: CloudRain, label: 'Şiddetli Sağanak', color: '#2563eb', bg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(37, 99, 235, 0) 100%)' },
            95: { icon: CloudLightning, label: 'Fırtına', color: '#f59e0b', bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0) 100%)' },
        };

        const config = codes[code] || { icon: Cloud, label: 'Bulutlu', color: '#94a3b8', bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0) 100%)' };
        return config;
    };

    if (!weather) {
        return (
            <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="pulse" style={{ width: '40px', height: '40px', margin: '0 auto 15px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.5 }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Hava durumu yükleniyor...</p>
                </div>
            </div>
        );
    }

    const currentDetails = getWeatherDetails(weather.current.weathercode);
    const WeatherIcon = currentDetails.icon;

    return (
        <div className="glass-panel" style={{
            padding: '0',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'var(--glass-bg)',
            position: 'relative'
        }}>
            {/* Background Effect */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '140px',
                background: currentDetails.bg,
                zIndex: 0,
                opacity: 0.6
            }}></div>

            <div style={{ padding: '25px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                    <div>
                        <h3 style={{ margin: '0', fontSize: '1.4rem' }}>{cityName}</h3>
                        <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ background: 'var(--glass-surface)', padding: '6px 10px', borderRadius: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Droplets size={14} color="#60a5fa" /> {weather.humidity}%
                        </div>
                        <div style={{ background: 'var(--glass-surface)', padding: '6px 10px', borderRadius: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Wind size={14} color="#94a3b8" /> {weather.wind}km/h
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                    <div style={{
                        padding: '15px',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
                    }}>
                        <WeatherIcon size={48} color={currentDetails.color} style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1', display: 'flex', alignItems: 'flex-start' }}>
                            {Math.round(weather.current.temperature)}
                            <span style={{ fontSize: '1.5rem', marginTop: '5px' }}>°C</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontWeight: '500', marginTop: '5px' }}>
                            {currentDetails.label}
                        </div>
                    </div>
                </div>

                {/* Forecast List */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--glass-border)',
                }}>
                    {weather.daily.time.slice(1, 4).map((t, i) => {
                        const dayDetails = getWeatherDetails(weather.daily.weather_code[i + 1]);
                        const DayIcon = dayDetails.icon;
                        return (
                            <div key={t} style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '12px 5px',
                                background: 'var(--glass-surface)',
                                borderRadius: '12px',
                                transition: 'transform 0.2s',
                                cursor: 'default'
                            }}
                                className="weather-forecast-item">
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                    {new Date(t).toLocaleDateString('tr-TR', { weekday: 'short' })}
                                </div>
                                <DayIcon size={20} color={dayDetails.color} style={{ margin: '0 auto' }} />
                                <div style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                    {Math.round(weather.daily.temperature_2m_max[i + 1])}°
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
