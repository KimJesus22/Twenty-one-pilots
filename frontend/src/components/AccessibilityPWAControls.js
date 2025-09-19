import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityNew,
  OfflineBolt,
  Wifi,
  WifiOff,
  GetApp,
  Notifications,
  Settings
} from '@mui/icons-material';
import {
  Fab,
  Tooltip,
  Badge,
  Snackbar,
  Alert,
  Box
} from '@mui/material';
import AccessibilityPanel from './AccessibilityPanel';
import PWAPanel from './PWAPanel';
import usePWA from '../hooks/usePWA';
import useAccessibility from '../hooks/useAccessibility';

const AccessibilityPWAControls = () => {
  const { t } = useTranslation();
  const {
    isInstallable,
    isInstalled,
    isOnline,
    notificationPermission
  } = usePWA();

  const { renderSkipLinks } = useAccessibility();

  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [showPWAPanel, setShowPWAPanel] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Mostrar notificación cuando se pierde la conexión
  useEffect(() => {
    if (!isOnline) {
      setSnackbar({
        open: true,
        message: 'Conexión perdida. Modo offline activado.',
        severity: 'warning'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Conexión restablecida.',
        severity: 'success'
      });
    }
  }, [isOnline]);

  // Mostrar prompt de instalación cuando esté disponible
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      setSnackbar({
        open: true,
        message: '¡Puedes instalar esta app! Haz clic en el botón de accesibilidad.',
        severity: 'info'
      });
    }
  }, [isInstallable, isInstalled]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAccessibilityClick = () => {
    setShowAccessibilityPanel(true);
  };

  const handlePWAClick = () => {
    setShowPWAPanel(true);
  };

  return (
    <>
      {/* Skip Links */}
      {renderSkipLinks()}

      {/* Indicador de conexión offline */}
      {!isOnline && (
        <div className="offline-indicator" role="status" aria-live="polite">
          <WifiOff fontSize="small" aria-hidden="true" />
          <span>Sin conexión</span>
        </div>
      )}

      {/* Controles flotantes */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
        role="region"
        aria-label="Controles de accesibilidad y PWA"
      >
        {/* Botón de PWA */}
        <Tooltip title="Funciones PWA y notificaciones" placement="left">
          <Fab
            color="primary"
            size="medium"
            onClick={handlePWAClick}
            aria-label="Abrir panel de Progressive Web App"
            sx={{
              backgroundColor: '#ff0000',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#cc0000',
              },
              '&:focus': {
                outline: '2px solid #ffffff',
                outlineOffset: '2px',
              }
            }}
          >
            <Badge
              color="secondary"
              variant="dot"
              invisible={!isInstallable || isInstalled}
              aria-label={isInstallable && !isInstalled ? 'Instalación disponible' : ''}
            >
              <OfflineBolt />
            </Badge>
          </Fab>
        </Tooltip>

        {/* Botón de Accesibilidad */}
        <Tooltip title="Configuración de accesibilidad" placement="left">
          <Fab
            color="secondary"
            size="medium"
            onClick={handleAccessibilityClick}
            aria-label="Abrir panel de accesibilidad"
            sx={{
              backgroundColor: '#ffffff',
              color: '#000000',
              '&:hover': {
                backgroundColor: '#cccccc',
              },
              '&:focus': {
                outline: '2px solid #ff0000',
                outlineOffset: '2px',
              }
            }}
          >
            <AccessibilityNew />
          </Fab>
        </Tooltip>
      </Box>

      {/* Paneles */}
      <AccessibilityPanel
        open={showAccessibilityPanel}
        onClose={() => setShowAccessibilityPanel(false)}
      />

      <PWAPanel
        open={showPWAPanel}
        onClose={() => setShowPWAPanel(false)}
      />

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          role="status"
          aria-live="polite"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AccessibilityPWAControls;