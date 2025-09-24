import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import wishlistAPI from '../api/wishlist';

export function useWishlist() {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  // Cargar wishlist cuando el usuario cambie
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWishlist();
      loadStats();
      loadRecommendations();
    } else {
      setWishlist([]);
      setStats({});
      setRecommendations([]);
    }
  }, [user, isAuthenticated]);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await wishlistAPI.getUserWishlist(user._id);
      if (response.success) {
        setWishlist(response.data);
      } else {
        throw new Error(response.message || 'Error al cargar wishlist');
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadStats = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await wishlistAPI.getWishlistStats(user._id);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading wishlist stats:', err);
    }
  }, [isAuthenticated, user]);

  const loadRecommendations = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await wishlistAPI.getWishlistRecommendations(user._id);
      if (response.success) {
        setRecommendations(response.data);
      }
    } catch (err) {
      console.error('Error loading wishlist recommendations:', err);
    }
  }, [isAuthenticated, user]);

  const addToWishlist = useCallback(async (productId, notes = '') => {
    if (!isAuthenticated || !user) {
      throw new Error('Debes iniciar sesión para agregar a la wishlist');
    }

    try {
      setError(null);
      const response = await wishlistAPI.addToWishlist(user._id, productId, notes);

      if (response.success) {
        // Actualizar la lista local
        setWishlist(prev => [...prev, response.data]);
        // Recargar estadísticas
        loadStats();
        return response.data;
      } else {
        throw new Error(response.message || 'Error al agregar a la wishlist');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, user, loadStats]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Debes iniciar sesión para remover de la wishlist');
    }

    try {
      setError(null);
      const response = await wishlistAPI.removeFromWishlist(user._id, productId);

      if (response.success) {
        // Actualizar la lista local
        setWishlist(prev => prev.filter(item => item.product._id !== productId));
        // Recargar estadísticas
        loadStats();
        return true;
      } else {
        throw new Error(response.message || 'Error al remover de la wishlist');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, user, loadStats]);

  const checkWishlistStatus = useCallback(async (productId) => {
    if (!isAuthenticated || !user) return { isInWishlist: false };

    try {
      const response = await wishlistAPI.checkWishlistStatus(user._id, productId);
      return response.success ? response.data : { isInWishlist: false };
    } catch (err) {
      console.error('Error checking wishlist status:', err);
      return { isInWishlist: false };
    }
  }, [isAuthenticated, user]);

  const toggleWishlist = useCallback(async (productId, notes = '') => {
    if (!isAuthenticated || !user) {
      throw new Error('Debes iniciar sesión para gestionar la wishlist');
    }

    try {
      setError(null);
      const response = await wishlistAPI.toggleWishlist(user._id, productId, notes);

      if (response.success) {
        const { action } = response.data;

        if (action === 'added') {
          // Agregado: recargar la lista completa para obtener el item con populate
          await loadWishlist();
        } else if (action === 'removed') {
          // Removido: actualizar lista local
          setWishlist(prev => prev.filter(item => item.product._id !== productId));
        }

        // Recargar estadísticas
        loadStats();
        return { action };
      } else {
        throw new Error(response.message || 'Error al cambiar estado de wishlist');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, user, loadStats, loadWishlist]);

  const updateWishlistNotes = useCallback(async (productId, notes) => {
    if (!isAuthenticated || !user) {
      throw new Error('Debes iniciar sesión para actualizar notas');
    }

    try {
      setError(null);
      const response = await wishlistAPI.updateWishlistNotes(user._id, productId, notes);

      if (response.success) {
        // Actualizar la lista local
        setWishlist(prev => prev.map(item =>
          item.product._id === productId ? { ...item, notes } : item
        ));
        return true;
      } else {
        throw new Error(response.message || 'Error al actualizar notas');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, user]);

  const clearWishlist = useCallback(async () => {
    if (!isAuthenticated || !user) {
      throw new Error('Debes iniciar sesión para limpiar la wishlist');
    }

    try {
      setError(null);
      const response = await wishlistAPI.clearWishlist(user._id);

      if (response.success) {
        // Limpiar lista local
        setWishlist([]);
        // Recargar estadísticas
        loadStats();
        return true;
      } else {
        throw new Error(response.message || 'Error al limpiar wishlist');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, user, loadStats]);

  const applyFilters = useCallback((wishlistItems) => {
    if (!wishlistItems) return [];

    let filtered = [...wishlistItems];

    // Filtrar por precio
    filtered = filtered.filter(item =>
      item.product.price >= filters.minPrice && item.product.price <= filters.maxPrice
    );

    // Filtrar por categoría
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.product.category === filters.category);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'price':
          aValue = a.product.price;
          bValue = b.product.price;
          break;
        case 'addedAt':
          aValue = new Date(a.addedAt);
          bValue = new Date(b.addedAt);
          break;
        case 'name':
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
          break;
        case 'popularity':
          aValue = a.product.popularity || 0;
          bValue = b.product.popularity || 0;
          break;
        default:
          aValue = new Date(a.addedAt);
          bValue = new Date(b.addedAt);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Funciones de utilidad
  const getWishlistItem = useCallback((productId) => {
    return wishlist.find(item => item.product._id === productId);
  }, [wishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => item.product._id === productId);
  }, [wishlist]);

  const getWishlistCount = useCallback(() => {
    return wishlist.length;
  }, [wishlist]);

  const getWishlistValue = useCallback(() => {
    return wishlist.reduce((total, item) => {
      return total + (item.product?.price || 0);
    }, 0);
  }, [wishlist]);

  const getWishlistByCategory = useCallback((category) => {
    return wishlist.filter(item => item.product?.category === category);
  }, [wishlist]);

  return {
    // Estado
    wishlist,
    loading,
    error,
    stats,
    filters,
    recommendations,

    // Acciones
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus,
    toggleWishlist,
    updateWishlistNotes,
    clearWishlist,
    loadWishlist,
    loadStats,
    loadRecommendations,
    updateFilters,

    // Utilidades
    getWishlistItem,
    isInWishlist,
    getWishlistCount,
    getWishlistValue,
    getWishlistByCategory,
    applyFilters
  };
}