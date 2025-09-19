import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Verificar si la app está instalada
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // Escuchar cambios en el modo de display
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkIfInstalled);

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escuchar el evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Escuchar cambios en el estado de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar permisos de notificación
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    return () => {
      mediaQuery.removeEventListener('change', checkIfInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Función para instalar la PWA
  const installPWA = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
        setIsInstalled(true);
      } else {
        console.log('Usuario rechazó instalar la PWA');
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error instalando PWA:', error);
      return false;
    }
  };

  // Función para solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
      return false;
    }
  };

  // Función para enviar notificación de prueba
  const sendTestNotification = () => {
    if (notificationPermission !== 'granted') {
      console.warn('No hay permisos para enviar notificaciones');
      return;
    }

    const notification = new Notification('Twenty One Pilots', {
      body: '¡Notificación de prueba! Tu PWA está funcionando correctamente.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'test-notification'
    });

    // Cerrar automáticamente después de 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);
  };

  // Función para registrar el service worker
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado:', registration);

        // Escuchar actualizaciones del service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible
                console.log('Nueva versión del Service Worker disponible');
                // Aquí podrías mostrar un mensaje al usuario para recargar
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('Error registrando Service Worker:', error);
        return null;
      }
    } else {
      console.warn('Service Workers no soportados en este navegador');
      return null;
    }
  };

  // Función para verificar si hay actualizaciones disponibles
  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    notificationPermission,
    installPWA,
    requestNotificationPermission,
    sendTestNotification,
    registerServiceWorker,
    checkForUpdates
  };
};

export default usePWA;