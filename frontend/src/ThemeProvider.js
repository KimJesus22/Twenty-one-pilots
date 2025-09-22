import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      <div style={{
        backgroundColor: isDarkMode ? '#000000' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#000000',
        minHeight: '100vh'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;