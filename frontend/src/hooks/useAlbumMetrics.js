import { useState, useCallback } from 'react';

export function useAlbumMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener métricas de un álbum específico
  const fetchAlbumMetrics = useCallback(async (albumId, options = {}) => {
    const {
      metric = 'popularity',
      startDate,
      endDate,
      source,
      limit = 100
    } = options;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        metric,
        limit: limit.toString()
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (source) params.append('source', source);

      const response = await fetch(`/api/albums/${albumId}/metrics?${params}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Error al obtener métricas');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener métricas de múltiples álbumes para comparación
  const fetchMultipleAlbumsMetrics = useCallback(async (albumIds, options = {}) => {
    const {
      metric = 'popularity',
      startDate,
      endDate,
      source,
      limit = 50
    } = options;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        albumIds: albumIds.join(','),
        metric,
        limit: limit.toString()
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (source) params.append('source', source);

      const response = await fetch(`/api/albums/metrics/compare?${params}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data.albums);
        return data.data;
      } else {
        throw new Error(data.message || 'Error al obtener métricas');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener métricas actuales de un álbum
  const fetchCurrentAlbumMetrics = useCallback(async (albumId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/albums/${albumId}/metrics/current`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Error al obtener métricas actuales');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estadísticas de crecimiento
  const fetchAlbumStats = useCallback(async (albumId, days = 30) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/albums/${albumId}/metrics/stats?days=${days}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Error al obtener estadísticas');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    metrics,
    loading,
    error,
    fetchAlbumMetrics,
    fetchMultipleAlbumsMetrics,
    fetchCurrentAlbumMetrics,
    fetchAlbumStats,
    clearError: () => setError(null)
  };
}