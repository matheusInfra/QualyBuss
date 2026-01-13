
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 'light', 'dark', 'system'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        const removeOldTheme = () => {
            root.classList.remove('dark');
            root.classList.remove('light');
        };

        const applyTheme = (targetTheme) => {
            removeOldTheme();
            if (targetTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.add('light'); // Optional, mainly for specific CSS rules if needed
            }
        };

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            applyTheme(systemTheme);
        } else {
            applyTheme(theme);
        }

        localStorage.setItem('theme', theme);

    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
