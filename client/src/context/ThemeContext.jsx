import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Predefined accent color palette
export const ACCENT_COLORS = [
    { id: 'indigo', label: 'İndigo', primary: '#6366f1', secondary: '#a78bfa' },
    { id: 'blue', label: 'Mavi', primary: '#3b82f6', secondary: '#60a5fa' },
    { id: 'violet', label: 'Mor', primary: '#8b5cf6', secondary: '#c084fc' },
    { id: 'emerald', label: 'Yeşil', primary: '#10b981', secondary: '#34d399' },
    { id: 'rose', label: 'Pembe', primary: '#f43f5e', secondary: '#fb7185' },
    { id: 'amber', label: 'Sarı', primary: '#f59e0b', secondary: '#fbbf24' },
    { id: 'cyan', label: 'Camgöbeği', primary: '#06b6d4', secondary: '#22d3ee' },
    { id: 'orange', label: 'Turuncu', primary: '#f97316', secondary: '#fb923c' },
];

const applyAccentColor = (color) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', color.primary);
    root.style.setProperty('--secondary', color.secondary);
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'light' ? false : true;
    });

    const [accentColor, setAccentColorState] = useState(() => {
        const saved = localStorage.getItem('accentColor');
        return saved ? JSON.parse(saved) : ACCENT_COLORS[0];
    });

    const [companyLogo, setCompanyLogoState] = useState(() => {
        return localStorage.getItem('companyLogo') || null;
    });

    const [companyName, setCompanyNameState] = useState(() => {
        return localStorage.getItem('companyName') || 'M-Tech';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    useEffect(() => {
        applyAccentColor(accentColor);
    }, [accentColor]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const setAccentColor = (color) => {
        setAccentColorState(color);
        localStorage.setItem('accentColor', JSON.stringify(color));
        applyAccentColor(color);
    };

    const setCompanyLogo = (dataUrl) => {
        setCompanyLogoState(dataUrl);
        if (dataUrl) localStorage.setItem('companyLogo', dataUrl);
        else localStorage.removeItem('companyLogo');
    };

    const setCompanyName = (name) => {
        setCompanyNameState(name);
        localStorage.setItem('companyName', name);
    };

    return (
        <ThemeContext.Provider value={{
            isDarkMode, toggleTheme,
            accentColor, setAccentColor,
            companyLogo, setCompanyLogo,
            companyName, setCompanyName,
            ACCENT_COLORS
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
