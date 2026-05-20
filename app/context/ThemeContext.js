import React, { createContext, useContext, useState, useMemo } from 'react';

const lightTheme = {
  colors: {
    primary: '#1E40AF', accent: '#F59E0B', background: '#F0F4FF',
    card: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B',
    border: '#CBD5E1', success: '#10B981', error: '#EF4444', warning: '#F59E0B'
  },
  dark: false
};

const darkTheme = {
  colors: {
    primary: '#3B82F6', accent: '#FBBF24', background: '#0F172A',
    card: '#1E293B', textPrimary: '#F1F5F9', textSecondary: '#94A3B8',
    border: '#334155', success: '#34D399', error: '#F87171', warning: '#FBBF24'
  },
  dark: true
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);