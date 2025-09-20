import axios from 'axios';
import { normalizeVideo } from '../utils/videoShape';

// Re-export para conveniencia
export { normalizeVideo };

// Configuración base de Axios para la API de videos
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);

    // Manejar diferentes tipos de errores
    if (error.code === 'ECONNABORTED') {
      throw new Error('La solicitud tardó demasiado tiempo. Inténtalo de nuevo.');
    }

    if (error.response) {
      // Error del servidor
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data.message || 'Datos de entrada inválidos');
        case 401:
          throw new Error('No autorizado. Inicia sesión nuevamente.');
        case 403:
          throw new Error('Acceso denegado');
        case 404:
          throw new Error('Recurso no encontrado');
        case 429:
          throw new Error('Demasiadas solicitudes. Espera un momento.');
        case 500:
          throw new Error('Error interno del servidor. Inténtalo más tarde.');
        default:
          throw new Error(data.message || `Error del servidor: ${status}`);
      }
    } else if (error.request) {
      // Error de red
      throw new Error('Error de conexión. Verifica tu conexión a internet.');
    } else {
      // Otro tipo de error
      throw new Error(error.message || 'Ha ocurrido un error inesperado');
    }
  }
);

/**
 * Buscar videos usando la API del backend
 * @param {string} query - Término de búsqueda
 * @param {Object} options - Opciones adicionales
 * @param {number} options.limit - Número máximo de resultados (default: 20)
 * @param {string} options.pageToken - Token para paginación
 * @param {string} options.sortBy - Campo para ordenar (default: 'relevance')
 * @returns {Promise<Object>} Resultados de búsqueda con paginación
 */
export const searchVideos = async (query, options = {}) => {
  try {
    const params = {
      q: query || 'Twenty One Pilots',
      limit: options.limit || 20,
      ...(options.pageToken && { pageToken: options.pageToken }),
      ...(options.sortBy && { sortBy: options.sortBy }),
    };

    console.log('🔍 Buscando videos:', { query, params });

    const response = await apiClient.get('/videos/search', { params });

    // Formatear los datos de respuesta
    const formattedData = {
      ...response.data,
      data: response.data.data?.map(formatVideoData) || [],
    };

    console.log('✅ Videos encontrados:', formattedData.data.length);

    return formattedData;
  } catch (error) {
    console.error('❌ Error buscando videos:', error.message);
    throw error;
  }
};

/**
 * Obtener detalles de un video específico
 * @param {string} videoId - ID del video de YouTube
 * @returns {Promise<Object>} Detalles del video
 */
export const getVideoDetails = async (videoId) => {
  try {
    if (!videoId) {
      throw new Error('ID de video requerido');
    }

    console.log('🎥 Obteniendo detalles del video:', videoId);

    const response = await apiClient.get(`/videos/${videoId}`);

    const formattedVideo = formatVideoData(response.data);

    console.log('✅ Detalles del video obtenidos:', formattedVideo.snippet?.title);

    return formattedVideo;
  } catch (error) {
    console.error('❌ Error obteniendo detalles del video:', error.message);
    throw error;
  }
};

/**
 * Obtener videos populares/trending
 * @param {Object} options - Opciones de filtrado
 * @param {number} options.limit - Número de videos (default: 10)
 * @param {string} options.regionCode - Código de región (default: 'US')
 * @returns {Promise<Object>} Videos populares
 */
export const getPopularVideos = async (options = {}) => {
  try {
    const params = {
      chart: 'mostPopular',
      limit: options.limit || 10,
      regionCode: options.regionCode || 'US',
    };

    console.log('📈 Obteniendo videos populares:', params);

    const response = await apiClient.get('/videos/search', { params });

    const formattedData = {
      ...response.data,
      data: response.data.data?.map(formatVideoData) || [],
    };

    return formattedData;
  } catch (error) {
    console.error('❌ Error obteniendo videos populares:', error.message);
    throw error;
  }
};

/**
 * Obtener videos relacionados a un video específico
 * @param {string} videoId - ID del video base
 * @param {number} limit - Número de videos relacionados (default: 10)
 * @returns {Promise<Object>} Videos relacionados
 */
export const getRelatedVideos = async (videoId, limit = 10) => {
  try {
    if (!videoId) {
      throw new Error('ID de video requerido');
    }

    console.log('🔗 Obteniendo videos relacionados:', videoId);

    const response = await apiClient.get(`/videos/${videoId}/related`, {
      params: { limit }
    });

    const formattedData = {
      ...response.data,
      data: response.data.data?.map(formatVideoData) || [],
    };

    return formattedData;
  } catch (error) {
    console.error('❌ Error obteniendo videos relacionados:', error.message);
    throw error;
  }
};

/**
 * Formatear datos de video para consistencia en el frontend
 * @param {Object|string} video - Datos del video desde la API o ID del video
 * @returns {Object} Video formateado
 */
const formatVideoData = (video) => {
  if (!video) return null;

  // Primero normalizar la forma básica
  const normalized = normalizeVideo(video);

  // Luego agregar propiedades adicionales para display
  return {
    ...normalized,
    snippet: {
      ...normalized,
      title: normalized.title,
      description: normalized.description || 'Sin descripción',
      channelTitle: normalized.channelTitle || 'Canal desconocido',
      publishedAt: normalized.publishedAt || new Date().toISOString(),
      thumbnails: {
        default: { url: normalized.thumbnail || '/placeholder-video.png' },
        medium: { url: normalized.thumbnail || '/placeholder-video.png' },
        high: { url: normalized.thumbnail || '/placeholder-video.png' },
      },
    },
    statistics: {
      viewCount: formatViewCount(video.statistics?.viewCount),
      likeCount: formatViewCount(video.statistics?.likeCount),
      commentCount: formatViewCount(video.statistics?.commentCount),
      rawViewCount: video.statistics?.viewCount || '0',
      rawLikeCount: video.statistics?.likeCount || '0',
    },
    formattedDate: formatPublishedDate(normalized.publishedAt),
  };
};

/**
 * Formatear conteo de vistas/likes para display
 * @param {string|number} count - Número a formatear
 * @returns {string} Número formateado
 */
export const formatViewCount = (count) => {
  if (!count || count === '0') return '0';

  const num = typeof count === 'string' ? parseInt(count, 10) : count;

  if (isNaN(num)) return '0';

  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }

  return num.toString();
};

/**
 * Formatear fecha de publicación
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export const formatPublishedDate = (dateString) => {
  if (!dateString) return 'Fecha desconocida';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';

    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formateando fecha:', error);
    return 'Fecha desconocida';
  }
};

/**
 * Crear un cliente API con estado para componentes React
 * Nota: Este no es un hook, es una función que retorna un objeto con estado
 * Para usar en componentes React, considera crear un hook personalizado en el componente
 */
export const createVideosApiClient = () => {
  return {
    // Funciones de API
    searchVideos,
    getVideoDetails,
    getPopularVideos,
    getRelatedVideos,

    // Utilidades de formateo
    formatViewCount,
    formatPublishedDate,
    normalizeVideo,
  };
};

// Exportar funciones individuales
export default {
  searchVideos,
  getVideoDetails,
  getPopularVideos,
  getRelatedVideos,
  formatViewCount,
  formatPublishedDate,
  createVideosApiClient,
  normalizeVideo,
};