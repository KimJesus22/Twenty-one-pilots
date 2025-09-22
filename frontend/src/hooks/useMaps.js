import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from './useFavorites';
import { useNotifications } from './useNotifications';
import mapsAPI from '../api/maps';

export function useMaps() {
  const { user, isAuthenticated } = useAuth();
  const { addToFavorites: addToFavoritesGeneral, hasFavorite } = useFavorites();
  const { createNotification } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [topLocations, setTopLocations] = useState({});
  const [routes, setRoutes] = useState([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [stats, setStats] = useState({});
  const [notificationPreferences, setNotificationPreferences] = useState({});

  // Obtener ubicación del usuario al iniciar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([longitude, latitude]);
        },
        (error) => {
          console.warn('Error getting user location:', error);
        }
      );
    }
  }, []);

  // Cargar ubicaciones de TOP al iniciar
  useEffect(() => {
    loadTOPLocations();
  }, []);

  const loadTOPLocations = useCallback(async () => {
    try {
      const response = await mapsAPI.getTOPLocations();
      if (response.success) {
        setTopLocations(response.data.locations);
      }
    } catch (err) {
      console.error('Error loading TOP locations:', err);
    }
  }, []);

  const geocodeAddress = useCallback(async (address) => {
    try {
      setLoading(true);
      setError(null);

      const response = await mapsAPI.geocodeAddress(address);

      if (response.success) {
        return response.data.geocoding;
      } else {
        throw new Error(response.message || 'Error geocodificando dirección');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (coordinates) => {
    try {
      setLoading(true);
      setError(null);

      const response = await mapsAPI.reverseGeocode(coordinates);

      if (response.success) {
        return response.data.reverseGeocoding;
      } else {
        throw new Error(response.message || 'Error en reverse geocoding');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoute = useCallback(async (origin, destination, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await mapsAPI.getRoute(origin, destination, options);

      if (response.success) {
        const route = response.data.route;
        setRoutes(prev => [...prev, route]);
        return route;
      } else {
        throw new Error(response.message || 'Error calculando ruta');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNearbyPlaces = useCallback(async (coordinates, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await mapsAPI.getNearbyPlaces(coordinates, options);

      if (response.success) {
        setNearbyPlaces(response.data.places);
        return response.data;
      } else {
        throw new Error(response.message || 'Error obteniendo lugares cercanos');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNearbyEvents = useCallback(async (coordinates, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para ver eventos cercanos');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await mapsAPI.getNearbyEvents(coordinates, options);

      if (response.success) {
        setNearbyEvents(response.data.events);

        // Enviar notificaciones para eventos muy cercanos
        const veryCloseEvents = response.data.events.filter(event => event.distance < 10000);
        if (veryCloseEvents.length > 0) {
          veryCloseEvents.forEach(event => {
            createNotification({
              type: 'event_reminder',
              title: `🎵 ¡Concierto cercano!`,
              message: `${event.name} en ${event.venue} - ${Math.round(event.distance / 1000)}km`,
              data: {
                itemId: event.id,
                itemType: 'concert',
                coordinates: event.coordinates,
                distance: event.distance
              },
              channels: ['in_app', 'push'],
              priority: 'high'
            });
          });
        }

        return response.data;
      } else {
        throw new Error(response.message || 'Error obteniendo eventos cercanos');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, createNotification]);

  const createCustomMap = useCallback(async (mapConfig) => {
    try {
      setLoading(true);
      setError(null);

      const response = await mapsAPI.createCustomMap(mapConfig);

      if (response.success) {
        return response.data.mapConfig;
      } else {
        throw new Error(response.message || 'Error creando mapa personalizado');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addLocationToFavorites = useCallback(async (locationData) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para agregar ubicaciones a favoritos');
    }

    try {
      setError(null);

      const response = await mapsAPI.addLocationToFavorites(locationData);

      if (response.success) {
        // También agregar al sistema general de favoritos
        await addToFavoritesGeneral('location', locationData.locationId, {
          name: locationData.name,
          coordinates: locationData.coordinates,
          type: locationData.type,
          description: locationData.description
        });

        return response.data.favorite;
      } else {
        throw new Error(response.message || 'Error agregando ubicación a favoritos');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, addToFavoritesGeneral]);

  const checkLocationFavorite = useCallback(async (locationId) => {
    if (!isAuthenticated) return false;

    try {
      const response = await mapsAPI.checkLocationFavorite(locationId);
      return response.success ? response.data.isFavorite : false;
    } catch (err) {
      console.error('Error checking location favorite:', err);
      return false;
    }
  }, [isAuthenticated]);

  const getFavoriteLocations = useCallback(async (filters = {}) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para ver ubicaciones favoritas');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await mapsAPI.getFavoriteLocations(filters);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error obteniendo ubicaciones favoritas');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getAutocompleteSuggestions = useCallback(async (query, options = {}) => {
    if (!query) return [];

    try {
      const response = await mapsAPI.getAutocompleteSuggestions(query, options);
      const suggestions = response.success ? response.data.suggestions : [];
      setAutocompleteSuggestions(suggestions);
      return suggestions;
    } catch (err) {
      console.error('Error getting autocomplete suggestions:', err);
      return [];
    }
  }, []);

  const checkMapboxStatus = useCallback(async () => {
    try {
      const response = await mapsAPI.checkMapboxStatus();
      return response.success ? response.data.mapboxStatus : { enabled: false };
    } catch (err) {
      console.error('Error checking Mapbox status:', err);
      return { enabled: false, status: 'error' };
    }
  }, []);

  const getMapsStats = useCallback(async () => {
    if (!isAuthenticated) return {};

    try {
      const response = await mapsAPI.getMapsStats();
      if (response.success) {
        setStats(response.data.stats);
        return response.data.stats;
      }
    } catch (err) {
      console.error('Error getting maps stats:', err);
    }
    return {};
  }, [isAuthenticated]);

  const configureLocationNotifications = useCallback(async (preferences) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para configurar notificaciones');
    }

    try {
      setError(null);

      const response = await mapsAPI.configureLocationNotifications(preferences);

      if (response.success) {
        setNotificationPreferences(response.data.preferences);
        return response.data.preferences;
      } else {
        throw new Error(response.message || 'Error configurando notificaciones');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const getLocationNotificationPreferences = useCallback(async () => {
    if (!isAuthenticated) return {};

    try {
      const response = await mapsAPI.getLocationNotificationPreferences();
      if (response.success) {
        setNotificationPreferences(response.data.preferences);
        return response.data.preferences;
      }
    } catch (err) {
      console.error('Error getting notification preferences:', err);
    }
    return {};
  }, [isAuthenticated]);

  // Funciones de utilidad
  const clearRoutes = useCallback(() => {
    setRoutes([]);
  }, []);

  const clearNearbyPlaces = useCallback(() => {
    setNearbyPlaces([]);
  }, []);

  const clearNearbyEvents = useCallback(() => {
    setNearbyEvents([]);
  }, []);

  const isLocationFavorite = useCallback((locationId) => {
    return hasFavorite('location', locationId);
  }, [hasFavorite]);

  const getDistance = useCallback((coord1, coord2) => {
    // Implementación simple de distancia (puedes usar una librería más precisa)
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return 6371 * c; // Distancia en km
  }, []);

  const clearAutocompleteSuggestions = useCallback(() => {
    setAutocompleteSuggestions([]);
  }, []);

  return {
    // Estado
    loading,
    error,
    currentLocation,
    nearbyPlaces,
    nearbyEvents,
    topLocations,
    routes,
    autocompleteSuggestions,
    stats,
    notificationPreferences,

    // Acciones
    geocodeAddress,
    reverseGeocode,
    getRoute,
    getNearbyPlaces,
    getNearbyEvents,
    createCustomMap,
    addLocationToFavorites,
    checkLocationFavorite,
    getFavoriteLocations,
    getAutocompleteSuggestions,
    checkMapboxStatus,
    getMapsStats,
    configureLocationNotifications,
    getLocationNotificationPreferences,

    // Utilidades
    clearRoutes,
    clearNearbyPlaces,
    clearNearbyEvents,
    clearAutocompleteSuggestions,
    isLocationFavorite,
    getDistance
  };
}