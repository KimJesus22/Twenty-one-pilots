import { createTheme } from '@mui/material/styles';

// Tema personalizado Twenty One Pilots - Minimalista negro/rojo
export const twentyOnePilotsTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff0000',
      light: '#ff3333',
      dark: '#cc0000',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ffffff',
      light: '#ffffff',
      dark: '#cccccc',
      contrastText: '#000000',
    },
    background: {
      default: '#000000',
      paper: '#111111',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ffaa00',
    },
    info: {
      main: '#00aaff',
    },
    success: {
      main: '#00ff00',
    },
  },
  typography: {
    fontFamily: '"Arial", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '2px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'uppercase',
      letterSpacing: '1px',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 0, // Bordes cuadrados para diseño minimalista
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 500,
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(255, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '1px solid #333333',
          backgroundColor: '#111111',
          '&:hover': {
            borderColor: '#ff0000',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            backgroundColor: '#000000',
            '& fieldset': {
              borderColor: '#333333',
            },
            '&:hover fieldset': {
              borderColor: '#ff0000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ff0000',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderBottom: '1px solid #333333',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111111',
          borderRight: '1px solid #333333',
        },
      },
    },
  },
});

// Tema alternativo claro (opcional)
export const lightTheme = createTheme({
  ...twentyOnePilotsTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#ff0000',
      light: '#ff3333',
      dark: '#cc0000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
  },
});