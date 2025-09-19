import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { twentyOnePilotsTheme, lightTheme } from './theme';

// Contexto para el tema
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Estado para el modo del tema (dark/light)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Cargar preferencia del usuario del localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('twentyOnePilots-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Guardar preferencia en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('twentyOnePilots-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Función para alternar entre modos
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Tema actual basado en el estado
  const theme = isDarkMode ? twentyOnePilotsTheme : lightTheme;

  const value = {
    isDarkMode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;