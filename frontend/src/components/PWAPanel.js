import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GetApp,
  Notifications,
  OfflineBolt,
  Refresh,
  Close,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import usePWA from '../hooks/usePWA';

const PWAPanel = ({ open, onClose }) => {
  const { t } = useTranslation();
  const {
    isInstallable,
    isInstalled,
    isOnline,
    notificationPermission,
    installPWA,
    requestNotificationPermission,
    sendTestNotification,
    registerServiceWorker,
    checkForUpdates
  } = usePWA();

  const [installStatus, setInstallStatus] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [swStatus, setSwStatus] = useState(null);

  const handleInstall = async () => {
    try {
      const success = await installPWA();
      setInstallStatus(success ? 'success' : 'error');
    } catch (error) {
      console.error('Error installing PWA:', error);
      setInstallStatus('error');
    }
  };

  const handleRequestNotifications = async () => {
    try {
      const granted = await requestNotificationPermission();
      setNotificationStatus(granted ? 'success' : 'denied');
    } catch (error) {
      console.error('Error requesting notifications:', error);
      setNotificationStatus('error');
    }
  };

  const handleTestNotification = () => {
    sendTestNotification();
  };

  const handleRegisterSW = async () => {
    try {
      const registration = await registerServiceWorker();
      setSwStatus(registration ? 'success' : 'error');
    } catch (error) {
      console.error('Error registering SW:', error);
      setSwStatus('error');
    }
  };

  const handleCheckUpdates = async () => {
    try {
      await checkForUpdates();
      setSwStatus('updated');
    } catch (error) {
      console.error('Error checking updates:', error);
      setSwStatus('error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'updated':
        return <Refresh color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'success':
        return 'Operación exitosa';
      case 'error':
        return 'Error en la operación';
      case 'updated':
        return 'Actualización verificada';
      case 'denied':
        return 'Permiso denegado';
      default:
        return '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="pwa-dialog-title"
      aria-describedby="pwa-dialog-description"
    >
      <DialogTitle id="pwa-dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          <OfflineBolt />
          <Typography variant="h6" component="span">
            Progressive Web App (PWA)
          </Typography>
        </Box>
        <IconButton
          aria-label="Cerrar panel PWA"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent id="pwa-dialog-description">
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            Esta aplicación es una PWA completa con funcionalidades offline,
            instalación nativa y notificaciones push.
          </Typography>

          {/* Estado de Conexión */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de Conexión
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={isOnline ? 'En línea' : 'Sin conexión'}
                  color={isOnline ? 'success' : 'warning'}
                  size="small"
                />
                {isOnline ? (
                  <Typography variant="body2" color="text.secondary">
                    Conectado a internet
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Modo offline activado
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Estado de Instalación */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instalación PWA
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  label={isInstalled ? 'Instalada' : isInstallable ? 'Disponible' : 'No disponible'}
                  color={isInstalled ? 'success' : isInstallable ? 'primary' : 'default'}
                  size="small"
                />
                {installStatus && (
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(installStatus)}
                    <Typography variant="body2">
                      {getStatusMessage(installStatus)}
                    </Typography>
                  </Box>
                )}
              </Box>
              {isInstallable && !isInstalled && (
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={handleInstall}
                  aria-label="Instalar aplicación PWA"
                >
                  Instalar App
                </Button>
              )}
              {isInstalled && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  ¡La aplicación está instalada! Puedes acceder desde tu menú de aplicaciones.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notificaciones Push
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  label={
                    notificationPermission === 'granted' ? 'Permitidas' :
                    notificationPermission === 'denied' ? 'Bloqueadas' :
                    'Pendiente'
                  }
                  color={
                    notificationPermission === 'granted' ? 'success' :
                    notificationPermission === 'denied' ? 'error' :
                    'warning'
                  }
                  size="small"
                />
                {notificationStatus && (
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(notificationStatus)}
                    <Typography variant="body2">
                      {getStatusMessage(notificationStatus)}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {notificationPermission !== 'granted' && (
                  <Button
                    variant="outlined"
                    startIcon={<Notifications />}
                    onClick={handleRequestNotifications}
                    aria-label="Solicitar permisos de notificación"
                  >
                    Permitir Notificaciones
                  </Button>
                )}
                {notificationPermission === 'granted' && (
                  <Button
                    variant="outlined"
                    startIcon={<Notifications />}
                    onClick={handleTestNotification}
                    aria-label="Enviar notificación de prueba"
                  >
                    Probar Notificación
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Service Worker */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Worker
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {swStatus && (
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(swStatus)}
                    <Typography variant="body2">
                      {getStatusMessage(swStatus)}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRegisterSW}
                  aria-label="Registrar service worker"
                >
                  Registrar SW
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleCheckUpdates}
                  aria-label="Verificar actualizaciones"
                >
                  Verificar Actualizaciones
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Características PWA */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Características PWA Incluidas
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <OfflineBolt fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Modo Offline"
                    secondary="Funciona sin conexión a internet"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GetApp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Instalación Nativa"
                    secondary="Instalable como aplicación móvil"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Notifications fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Notificaciones Push"
                    secondary="Recibe actualizaciones importantes"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Refresh fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Actualizaciones Automáticas"
                    secondary="Se actualiza sin intervención del usuario"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          aria-label="Cerrar panel PWA"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PWAPanel;