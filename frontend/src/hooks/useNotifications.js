import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import notificationsAPI from '../api/notifications';

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    page: 1,
    limit: 20
  });

  // Cargar notificaciones cuando el usuario cambie
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, isAuthenticated, filters]);

  // Actualizar conteo de no leídas periódicamente
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response = await notificationsAPI.getUserNotifications(filters);
      if (response.success) {
        setNotifications(response.data.notifications);
      } else {
        throw new Error(response.message || 'Error al cargar notificaciones');
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters]);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationsAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!isAuthenticated) return;

    try {
      setError(null);
      const response = await notificationsAPI.markAsRead(notificationId);

      if (response.success) {
        // Actualizar lista local
        setNotifications(prev => prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, status: 'read', readAt: new Date() }
            : notif
        ));

        // Actualizar conteo
        setUnreadCount(prev => Math.max(0, prev - 1));

        return response.data.notification;
      } else {
        throw new Error(response.message || 'Error al marcar como leída');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setError(null);
      const response = await notificationsAPI.markAllAsRead();

      if (response.success) {
        // Actualizar lista local
        setNotifications(prev => prev.map(notif => ({
          ...notif,
          status: 'read',
          readAt: new Date()
        })));

        // Resetear conteo
        setUnreadCount(0);

        return response.data;
      } else {
        throw new Error(response.message || 'Error al marcar todas como leídas');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const deleteNotification = useCallback(async (notificationId) => {
    if (!isAuthenticated) return;

    try {
      setError(null);
      const response = await notificationsAPI.deleteNotification(notificationId);

      if (response.success) {
        // Actualizar lista local
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));

        // Actualizar conteo si era no leída
        const deletedNotif = notifications.find(n => n._id === notificationId);
        if (deletedNotif && deletedNotif.status !== 'read') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }

        return response.data.notification;
      } else {
        throw new Error(response.message || 'Error al eliminar notificación');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, notifications]);

  const createNotification = useCallback(async (notificationData) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para crear notificaciones');
    }

    try {
      setError(null);
      const response = await notificationsAPI.createNotification(notificationData);

      if (response.success) {
        // Agregar a lista local si es para el usuario actual
        setNotifications(prev => [response.data.notification, ...prev]);
        return response.data.notification;
      } else {
        throw new Error(response.message || 'Error al crear notificación');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const updatePreferences = useCallback(async (preferences) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para actualizar preferencias');
    }

    try {
      setError(null);
      const response = await notificationsAPI.updateNotificationPreferences(preferences);

      if (response.success) {
        return response.data.preferences;
      } else {
        throw new Error(response.message || 'Error al actualizar preferencias');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const getPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para obtener preferencias');
    }

    try {
      const response = await notificationsAPI.getNotificationPreferences();

      if (response.success) {
        return response.data.preferences;
      } else {
        throw new Error(response.message || 'Error al obtener preferencias');
      }
    } catch (err) {
      console.error('Error getting preferences:', err);
      // Retornar preferencias por defecto
      return {
        email: {
          new_concert: true,
          album_release: true,
          forum_reply: true,
          system_announcement: true
        },
        push: {
          new_concert: true,
          forum_reply: true,
          personal_message: true
        },
        in_app: {
          all: true
        }
      };
    }
  }, [isAuthenticated]);

  const testNotification = useCallback(async (channel = 'in_app', type = 'system_announcement') => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para probar notificaciones');
    }

    try {
      setError(null);
      const response = await notificationsAPI.testNotification(channel, type);

      if (response.success) {
        // Agregar a lista local
        setNotifications(prev => [response.data.notification, ...prev]);
        return response.data.notification;
      } else {
        throw new Error(response.message || 'Error al enviar notificación de prueba');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset page on filter change
  }, []);

  const changePage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Funciones de utilidad
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notif => notif.status !== 'read');
  }, [notifications]);

  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notif => notif.type === type);
  }, [notifications]);

  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(notif => notif.priority === priority);
  }, [notifications]);

  const hasUnreadNotifications = useCallback(() => {
    return unreadCount > 0;
  }, [unreadCount]);

  const getRecentNotifications = useCallback((limit = 5) => {
    return notifications.slice(0, limit);
  }, [notifications]);

  return {
    // Estado
    notifications,
    unreadCount,
    loading,
    error,
    filters,

    // Acciones
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    updatePreferences,
    getPreferences,
    testNotification,
    updateFilters,
    changePage,
    loadNotifications,
    loadUnreadCount,

    // Utilidades
    getUnreadNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    hasUnreadNotifications,
    getRecentNotifications
  };
}