import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ThemeName } from '../themes';

type ThemeContextType = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): ThemeName => {
    try {
        const storedTheme = window.localStorage.getItem('ytoskos-groove-theme');
        return (storedTheme as ThemeName) || 'indigo';
    } catch (e) {
        console.error("Could not read theme from localStorage", e);
        return 'indigo';
    }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    try {
        window.localStorage.setItem('ytoskos-groove-theme', theme);
        document.body.dataset.theme = theme;
    } catch (e) {
        console.error("Could not save theme to localStorage", e);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};