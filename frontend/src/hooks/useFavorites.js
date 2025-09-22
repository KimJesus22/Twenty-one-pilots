import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import favoritesAPI from '../api/favorites';

export function useFavorites() {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    itemType: '',
    search: '',
    rating: '',
    tags: [],
    sortBy: 'addedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  });

  // Cargar favoritos cuando el usuario cambie
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFavorites();
      loadStats();
    } else {
      setFavorites([]);
      setStats({});
    }
  }, [user, isAuthenticated, filters]);

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response = await favoritesAPI.getUserFavorites(filters);
      if (response.success) {
        setFavorites(response.data.favorites);
      } else {
        throw new Error(response.message || 'Error al cargar favoritos');
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters]);

  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await favoritesAPI.getUserStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [isAuthenticated]);

  const addToFavorites = useCallback(async (itemType, itemId, itemData = {}, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para agregar favoritos');
    }

    try {
      setError(null);
      const response = await favoritesAPI.addToFavorites(itemType, itemId, itemData, options);

      if (response.success) {
        // Actualizar la lista local
        setFavorites(prev => [...prev, response.data.favorite]);
        // Recargar estadísticas
        loadStats();
        return response.data.favorite;
      } else {
        throw new Error(response.message || 'Error al agregar a favoritos');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, loadStats]);

  const removeFromFavorites = useCallback(async (itemType, itemId) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para remover favoritos');
    }

    try {
      setError(null);
      const response = await favoritesAPI.removeFromFavorites(itemType, itemId);

      if (response.success) {
        // Actualizar la lista local
        setFavorites(prev => prev.filter(fav =>
          !(fav.itemType === itemType && fav.itemId === itemId)
        ));
        // Recargar estadísticas
        loadStats();
        return response.data.favorite;
      } else {
        throw new Error(response.message || 'Error al remover de favoritos');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, loadStats]);

  const checkFavorite = useCallback(async (itemType, itemId) => {
    if (!isAuthenticated) return false;

    try {
      const response = await favoritesAPI.checkFavorite(itemType, itemId);
      return response.success ? response.data.isFavorite : false;
    } catch (err) {
      console.error('Error checking favorite:', err);
      return false;
    }
  }, [isAuthenticated]);

  const toggleFavorite = useCallback(async (itemType, itemId, itemData = {}, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para gestionar favoritos');
    }

    try {
      setError(null);
      const response = await favoritesAPI.toggleFavorite(itemType, itemId, itemData, options);

      if (response.success) {
        const { favorite, removed, isFavorite } = response.data;

        if (isFavorite) {
          // Agregado: actualizar lista local
          setFavorites(prev => [...prev, favorite]);
        } else {
          // Removido: actualizar lista local
          setFavorites(prev => prev.filter(fav =>
            !(fav.itemType === itemType && fav.itemId === itemId)
          ));
        }

        // Recargar estadísticas
        loadStats();
        return { favorite, removed, isFavorite };
      } else {
        throw new Error(response.message || 'Error al cambiar estado de favorito');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, loadStats]);

  const updateFavorite = useCallback(async (favoriteId, updates) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para actualizar favoritos');
    }

    try {
      setError(null);
      const response = await favoritesAPI.updateFavorite(favoriteId, updates);

      if (response.success) {
        // Actualizar la lista local
        setFavorites(prev => prev.map(fav =>
          fav._id === favoriteId ? response.data.favorite : fav
        ));
        return response.data.favorite;
      } else {
        throw new Error(response.message || 'Error al actualizar favorito');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const addTags = useCallback(async (favoriteId, tags) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para gestionar tags');
    }

    try {
      setError(null);
      const response = await favoritesAPI.addTags(favoriteId, tags);

      if (response.success) {
        // Actualizar la lista local
        setFavorites(prev => prev.map(fav =>
          fav._id === favoriteId ? response.data.favorite : fav
        ));
        return response.data.favorite;
      } else {
        throw new Error(response.message || 'Error al agregar tags');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const removeTags = useCallback(async (favoriteId, tags) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para gestionar tags');
    }

    try {
      setError(null);
      const response = await favoritesAPI.removeTags(favoriteId, tags);

      if (response.success) {
        // Actualizar la lista local
        setFavorites(prev => prev.map(fav =>
          fav._id === favoriteId ? response.data.favorite : fav
        ));
        return response.data.favorite;
      } else {
        throw new Error(response.message || 'Error al remover tags');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const searchFavorites = useCallback(async (query, searchFilters = {}) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para buscar favoritos');
    }

    try {
      setError(null);
      const response = await favoritesAPI.searchFavorites(query, searchFilters);

      if (response.success) {
        return response.data.favorites;
      } else {
        throw new Error(response.message || 'Error al buscar favoritos');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated]);

  const getPopularItems = useCallback(async (itemType, limit = 10) => {
    try {
      const response = await favoritesAPI.getPopularItems(itemType, limit);

      if (response.success) {
        return response.data.popularItems;
      } else {
        throw new Error(response.message || 'Error al obtener items populares');
      }
    } catch (err) {
      console.error('Error getting popular items:', err);
      return [];
    }
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset page on filter change
  }, []);

  const changePage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Funciones de utilidad
  const getFavoritesByType = useCallback((itemType) => {
    return favorites.filter(fav => fav.itemType === itemType);
  }, [favorites]);

  const getFavoriteCount = useCallback(() => {
    return favorites.length;
  }, [favorites]);

  const getFavoriteCountByType = useCallback((itemType) => {
    return favorites.filter(fav => fav.itemType === itemType).length;
  }, [favorites]);

  const hasFavorite = useCallback((itemType, itemId) => {
    return favorites.some(fav => fav.itemType === itemType && fav.itemId === itemId);
  }, [favorites]);

  return {
    // Estado
    favorites,
    loading,
    error,
    stats,
    filters,

    // Acciones
    addToFavorites,
    removeFromFavorites,
    checkFavorite,
    toggleFavorite,
    updateFavorite,
    addTags,
    removeTags,
    searchFavorites,
    getPopularItems,
    updateFilters,
    changePage,
    loadFavorites,
    loadStats,

    // Utilidades
    getFavoritesByType,
    getFavoriteCount,
    getFavoriteCountByType,
    hasFavorite
  };
}