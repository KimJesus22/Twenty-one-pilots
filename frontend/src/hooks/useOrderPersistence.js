import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para persistir datos de pedidos en localStorage
 * Útil para cache de datos y mejorar UX
 */
export function useOrderPersistence() {
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);

  // Verificar si localStorage está disponible
  useEffect(() => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      setIsStorageAvailable(true);
    } catch (e) {
      console.warn('localStorage no está disponible:', e);
      setIsStorageAvailable(false);
    }
  }, []);

  // Guardar datos de pedido en localStorage
  const saveOrderData = useCallback((orderId, data, ttl = 24 * 60 * 60 * 1000) => { // 24 horas por defecto
    if (!isStorageAvailable) return false;

    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl
      };

      localStorage.setItem(`order_${orderId}`, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.warn('Error guardando datos de pedido en localStorage:', error);
      return false;
    }
  }, [isStorageAvailable]);

  // Cargar datos de pedido desde localStorage
  const loadOrderData = useCallback((orderId) => {
    if (!isStorageAvailable) return null;

    try {
      const cached = localStorage.getItem(`order_${orderId}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);

      // Verificar si expiró
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(`order_${orderId}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Error cargando datos de pedido desde localStorage:', error);
      return null;
    }
  }, [isStorageAvailable]);

  // Guardar datos de seguimiento
  const saveTrackingData = useCallback((orderId, trackingData, ttl = 60 * 60 * 1000) => { // 1 hora por defecto
    if (!isStorageAvailable) return false;

    try {
      const cacheData = {
        data: trackingData,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl
      };

      localStorage.setItem(`orderTracking_${orderId}`, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.warn('Error guardando datos de seguimiento en localStorage:', error);
      return false;
    }
  }, [isStorageAvailable]);

  // Cargar datos de seguimiento
  const loadTrackingData = useCallback((orderId) => {
    if (!isStorageAvailable) return null;

    try {
      const cached = localStorage.getItem(`orderTracking_${orderId}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);

      // Verificar si expiró
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(`orderTracking_${orderId}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Error cargando datos de seguimiento desde localStorage:', error);
      return null;
    }
  }, [isStorageAvailable]);

  // Guardar estadísticas de usuario
  const saveUserStats = useCallback((userId, stats, ttl = 6 * 60 * 60 * 1000) => { // 6 horas
    if (!isStorageAvailable) return false;

    try {
      const cacheData = {
        data: stats,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl
      };

      localStorage.setItem(`userStats_${userId}`, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.warn('Error guardando estadísticas de usuario en localStorage:', error);
      return false;
    }
  }, [isStorageAvailable]);

  // Cargar estadísticas de usuario
  const loadUserStats = useCallback((userId) => {
    if (!isStorageAvailable) return null;

    try {
      const cached = localStorage.getItem(`userStats_${userId}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);

      // Verificar si expiró
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(`userStats_${userId}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Error cargando estadísticas de usuario desde localStorage:', error);
      return null;
    }
  }, [isStorageAvailable]);

  // Limpiar datos expirados
  const clearExpiredData = useCallback(() => {
    if (!isStorageAvailable) return;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith('order_') || key.startsWith('orderTracking_') || key.startsWith('userStats_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.expiresAt && now > data.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Si no se puede parsear, eliminar
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Error limpiando datos expirados:', error);
    }
  }, [isStorageAvailable]);

  // Limpiar todos los datos de pedidos
  const clearAllOrderData = useCallback(() => {
    if (!isStorageAvailable) return;

    try {
      const keys = Object.keys(localStorage);

      keys.forEach(key => {
        if (key.startsWith('order_') || key.startsWith('orderTracking_') || key.startsWith('userStats_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error limpiando datos de pedidos:', error);
    }
  }, [isStorageAvailable]);

  // Obtener información de cache
  const getCacheInfo = useCallback(() => {
    if (!isStorageAvailable) return { available: false };

    try {
      const keys = Object.keys(localStorage);
      const orderKeys = keys.filter(key => key.startsWith('order_'));
      const trackingKeys = keys.filter(key => key.startsWith('orderTracking_'));
      const statsKeys = keys.filter(key => key.startsWith('userStats_'));

      return {
        available: true,
        orderCache: orderKeys.length,
        trackingCache: trackingKeys.length,
        statsCache: statsKeys.length,
        totalCache: orderKeys.length + trackingKeys.length + statsKeys.length
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }, [isStorageAvailable]);

  return {
    isStorageAvailable,
    saveOrderData,
    loadOrderData,
    saveTrackingData,
    loadTrackingData,
    saveUserStats,
    loadUserStats,
    clearExpiredData,
    clearAllOrderData,
    getCacheInfo
  };
}