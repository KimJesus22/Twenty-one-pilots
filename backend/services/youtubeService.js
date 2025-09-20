/**
 * Servicio robusto para integración con YouTube Data API v3
 * Incluye rate limiting, caching, logging avanzado y manejo de errores
 *
 * @author KimJesus21
 * @version 2.0.0
 * @since 2025-09-20
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Cache simple en memoria para optimizar performance
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    this.defaultMaxResults = 10;
    this.requestQueue = [];
    this.isProcessingQueue = false;

    // Configuración de rate limiting (YouTube API permite 10,000 unidades por día)
    this.dailyQuota = 10000;
    this.dailyUsage = 0;
    this.lastResetDate = new Date().toDateString();

    // Costos de unidades por endpoint (según YouTube API)
    this.apiCosts = {
      search: 100,
      videos: 1,
      channels: 1,
      playlistItems: 1,
      playlists: 1
    };

    logger.info('🎥 YouTube Service inicializado', {
      apiKeyConfigured: !!this.apiKey,
      cacheEnabled: true,
      rateLimitingEnabled: true
    });
  }

  /**
   * Verifica y actualiza el uso diario de la API
   * @private
   */
  _checkQuota() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyUsage = 0;
      this.lastResetDate = today;
      logger.info('🔄 Cuota diaria de YouTube API reiniciada');
    }

    const usagePercent = (this.dailyUsage / this.dailyQuota) * 100;
    if (usagePercent > 90) {
      logger.warn('⚠️ Cuota de YouTube API casi agotada', {
        usage: this.dailyUsage,
        quota: this.dailyQuota,
        percent: usagePercent.toFixed(2)
      });
    }

    return this.dailyUsage < this.dailyQuota;
  }

  /**
   * Actualiza el contador de uso de la API
   * @private
   * @param {string} endpoint - Nombre del endpoint usado
   */
  _updateQuota(endpoint) {
    const cost = this.apiCosts[endpoint] || 1;
    this.dailyUsage += cost;

    logger.debug('📊 Uso de YouTube API actualizado', {
      endpoint,
      cost,
      dailyUsage: this.dailyUsage,
      remaining: this.dailyQuota - this.dailyUsage
    });
  }

  /**
   * Obtiene datos del cache si están disponibles y válidos
   * @private
   * @param {string} key - Clave del cache
   * @returns {any|null} - Datos cacheados o null si no existen/vencidos
   */
  _getFromCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('✅ Datos obtenidos del cache', { key });
      return cached.data;
    }

    if (cached) {
      cache.delete(key);
      logger.debug('🗑️ Cache expirado eliminado', { key });
    }

    return null;
  }

  /**
   * Almacena datos en el cache
   * @private
   * @param {string} key - Clave del cache
   * @param {any} data - Datos a almacenar
   */
  _setCache(key, data) {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    logger.debug('💾 Datos almacenados en cache', { key });
  }

  /**
   * Realiza una petición HTTP con manejo de errores mejorado
   * @private
   * @param {string} url - URL de la petición
   * @param {object} config - Configuración de axios
   * @returns {Promise} - Respuesta de la API
   */
  async _makeRequest(url, config) {
    try {
      const response = await axios.get(url, {
        ...config,
        timeout: 15000, // 15 segundos timeout
        headers: {
          'User-Agent': 'TwentyOnePilots-API/2.0.0',
          ...config.headers
        }
      });

      return response;
    } catch (error) {
      // Manejo específico de errores de YouTube API
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data?.error;

        switch (status) {
          case 403:
            if (errorData?.errors?.[0]?.reason === 'quotaExceeded') {
              logger.error('🚫 Cuota de YouTube API excedida', {
                dailyUsage: this.dailyUsage,
                quota: this.dailyQuota
              });
              throw new Error('Cuota de YouTube API excedida. Intente mañana.');
            }
            if (errorData?.errors?.[0]?.reason === 'forbidden') {
              logger.error('🚫 Acceso denegado a YouTube API', { error: errorData });
              throw new Error('API key de YouTube inválida o sin permisos.');
            }
            break;

          case 400:
            logger.warn('⚠️ Petición inválida a YouTube API', { error: errorData });
            throw new Error('Parámetros de búsqueda inválidos.');

          case 404:
            logger.warn('⚠️ Recurso no encontrado en YouTube API', { url });
            throw new Error('Video o recurso no encontrado.');

          default:
            logger.error('❌ Error de YouTube API', {
              status,
              error: errorData,
              url
            });
        }
      } else if (error.code === 'ECONNABORTED') {
        logger.error('⏰ Timeout en petición a YouTube API', { url });
        throw new Error('Timeout al conectar con YouTube API.');
      } else {
        logger.error('❌ Error de conexión con YouTube API', {
          error: error.message,
          url
        });
        throw new Error('Error de conexión con YouTube API.');
      }

      throw error;
    }
  }

  /**
   * Busca videos en YouTube por consulta
   * @param {string} query - Término de búsqueda
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - Resultados de búsqueda
   */
  async searchVideos(query = 'Twenty One Pilots', options = {}) {
    const startTime = Date.now();
    const cacheKey = `search_${query}_${JSON.stringify(options)}`;

    try {
      logger.info('🔍 Iniciando búsqueda de videos', { query, options });

      // Verificar API key
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      // Verificar cuota
      if (!this._checkQuota()) {
        throw new Error('Cuota diaria de YouTube API agotada');
      }

      // Intentar obtener del cache
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        logger.info('✅ Resultados obtenidos del cache', {
          query,
          count: cachedResult.data?.length || 0,
          duration: Date.now() - startTime
        });
        return cachedResult;
      }

      const {
        maxResults = this.defaultMaxResults,
        order = 'relevance',
        publishedAfter,
        publishedBefore,
        regionCode = 'US'
      } = options;

      const response = await this._makeRequest(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          key: this.apiKey,
          maxResults: Math.min(maxResults, 50), // Máximo 50 por YouTube
          order,
          safeSearch: 'moderate',
          regionCode,
          publishedAfter,
          publishedBefore
        }
      });

      // Actualizar cuota
      this._updateQuota('search');

      // Transformar respuesta
      const videos = response.data.items?.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
      })) || [];

      const result = {
        success: true,
        data: videos,
        totalResults: response.data.pageInfo?.totalResults || 0,
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken,
        query,
        searchTime: Date.now() - startTime
      };

      // Almacenar en cache
      this._setCache(cacheKey, result);

      logger.info('✅ Búsqueda de videos completada', {
        query,
        resultsCount: videos.length,
        totalResults: result.totalResults,
        duration: result.searchTime
      });

      return result;

    } catch (error) {
      logger.error('❌ Error en búsqueda de videos', {
        query,
        error: error.message,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: error.message,
        data: [],
        query,
        searchTime: Date.now() - startTime
      };
    }
  }

  /**
   * Obtiene detalles completos de un video específico
   * @param {string} videoId - ID del video de YouTube
   * @returns {Promise<object>} - Detalles completos del video
   */
  async getVideoDetails(videoId) {
    const startTime = Date.now();
    const cacheKey = `video_${videoId}`;

    try {
      logger.info('🎬 Obteniendo detalles del video', { videoId });

      // Validar videoId
      if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
        throw new Error('ID de video inválido');
      }

      // Verificar API key
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      // Verificar cuota
      if (!this._checkQuota()) {
        throw new Error('Cuota diaria de YouTube API agotada');
      }

      // Intentar obtener del cache
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        logger.info('✅ Detalles del video obtenidos del cache', {
          videoId,
          duration: Date.now() - startTime
        });
        return cachedResult;
      }

      const response = await this._makeRequest(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,statistics,contentDetails,status',
          id: videoId,
          key: this.apiKey
        }
      });

      // Actualizar cuota
      this._updateQuota('videos');

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video no encontrado');
      }

      const video = response.data.items[0];

      // Verificar si el video está disponible
      if (video.status?.privacyStatus === 'private') {
        throw new Error('Este video es privado');
      }

      if (video.status?.uploadStatus !== 'processed') {
        logger.warn('Video no completamente procesado', {
          videoId,
          uploadStatus: video.status?.uploadStatus
        });
      }

      const details = {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.maxres?.url ||
                  video.snippet.thumbnails.high?.url ||
                  video.snippet.thumbnails.medium?.url ||
                  video.snippet.thumbnails.default?.url,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails?.duration,
        durationSeconds: this._parseDuration(video.contentDetails?.duration),
        viewCount: parseInt(video.statistics?.viewCount) || 0,
        likeCount: parseInt(video.statistics?.likeCount) || 0,
        commentCount: parseInt(video.statistics?.commentCount) || 0,
        favoriteCount: parseInt(video.statistics?.favoriteCount) || 0,
        tags: video.snippet.tags || [],
        categoryId: video.snippet.categoryId,
        liveBroadcastContent: video.snippet.liveBroadcastContent,
        defaultLanguage: video.snippet.defaultLanguage,
        defaultAudioLanguage: video.snippet.defaultAudioLanguage,
        privacyStatus: video.status?.privacyStatus,
        license: video.status?.license,
        embeddable: video.status?.embeddable,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        embedUrl: `https://www.youtube.com/embed/${video.id}`,
        shareUrl: `https://youtu.be/${video.id}`
      };

      const result = {
        success: true,
        data: details,
        fetchTime: Date.now() - startTime
      };

      // Almacenar en cache (videos pueden cambiar, pero cacheamos por tiempo limitado)
      this._setCache(cacheKey, result);

      logger.info('✅ Detalles del video obtenidos', {
        videoId,
        title: details.title.substring(0, 50),
        channel: details.channelTitle,
        viewCount: details.viewCount,
        duration: result.fetchTime
      });

      return result;

    } catch (error) {
      logger.error('❌ Error obteniendo detalles del video', {
        videoId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: error.message,
        videoId,
        fetchTime: Date.now() - startTime
      };
    }
  }

  /**
   * Parsea la duración ISO 8601 a segundos
   * @private
   * @param {string} duration - Duración en formato ISO 8601
   * @returns {number} - Duración en segundos
   */
  _parseDuration(duration) {
    if (!duration) return 0;

    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]?.replace('H', '')) || 0;
    const minutes = parseInt(match[2]?.replace('M', '')) || 0;
    const seconds = parseInt(match[3]?.replace('S', '')) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Obtiene videos de una playlist específica
   * @param {string} playlistId - ID de la playlist de YouTube
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - Videos de la playlist
   */
  async getPlaylistItems(playlistId, options = {}) {
    const startTime = Date.now();
    const cacheKey = `playlist_${playlistId}_${JSON.stringify(options)}`;

    try {
      logger.info('📋 Obteniendo items de playlist', { playlistId, options });

      // Validar playlistId
      if (!playlistId || typeof playlistId !== 'string') {
        throw new Error('ID de playlist inválido');
      }

      // Verificar API key
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      // Verificar cuota
      if (!this._checkQuota()) {
        throw new Error('Cuota diaria de YouTube API agotada');
      }

      // Intentar obtener del cache
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        logger.info('✅ Items de playlist obtenidos del cache', {
          playlistId,
          count: cachedResult.data?.length || 0,
          duration: Date.now() - startTime
        });
        return cachedResult;
      }

      const {
        maxResults = this.defaultMaxResults,
        pageToken
      } = options;

      const response = await this._makeRequest(`${this.baseUrl}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId,
          key: this.apiKey,
          maxResults: Math.min(maxResults, 50),
          pageToken
        }
      });

      // Actualizar cuota
      this._updateQuota('playlistItems');

      const videos = response.data.items?.map(item => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        position: item.snippet.position,
        videoOwnerChannelTitle: item.snippet.videoOwnerChannelTitle,
        videoOwnerChannelId: item.snippet.videoOwnerChannelId,
        playlistId: item.snippet.playlistId,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.snippet.resourceId.videoId}`
      })) || [];

      const result = {
        success: true,
        data: videos,
        totalResults: response.data.pageInfo?.totalResults || 0,
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken,
        playlistId,
        fetchTime: Date.now() - startTime
      };

      // Almacenar en cache
      this._setCache(cacheKey, result);

      logger.info('✅ Items de playlist obtenidos', {
        playlistId,
        resultsCount: videos.length,
        totalResults: result.totalResults,
        duration: result.fetchTime
      });

      return result;

    } catch (error) {
      logger.error('❌ Error obteniendo items de playlist', {
        playlistId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: error.message,
        data: [],
        playlistId,
        fetchTime: Date.now() - startTime
      };
    }
  }

  /**
   * Obtiene videos de un canal específico
   * @param {string} channelId - ID del canal de YouTube
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - Videos del canal
   */
  async getChannelVideos(channelId, options = {}) {
    const startTime = Date.now();
    const cacheKey = `channel_${channelId}_${JSON.stringify(options)}`;

    try {
      logger.info('📺 Obteniendo videos del canal', { channelId, options });

      // Validar channelId
      if (!channelId || typeof channelId !== 'string') {
        throw new Error('ID de canal inválido');
      }

      // Verificar API key
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      // Verificar cuota
      if (!this._checkQuota()) {
        throw new Error('Cuota diaria de YouTube API agotada');
      }

      // Intentar obtener del cache
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        logger.info('✅ Videos del canal obtenidos del cache', {
          channelId,
          count: cachedResult.data?.length || 0,
          duration: Date.now() - startTime
        });
        return cachedResult;
      }

      const { maxResults = this.defaultMaxResults } = options;

      // Primero obtener información del canal
      const channelResponse = await this._makeRequest(`${this.baseUrl}/channels`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: channelId,
          key: this.apiKey
        }
      });

      // Actualizar cuota
      this._updateQuota('channels');

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new Error('Canal no encontrado');
      }

      const channel = channelResponse.data.items[0];
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        throw new Error('Este canal no tiene videos públicos');
      }

      // Obtener videos de la playlist de uploads
      const videosResponse = await this._makeRequest(`${this.baseUrl}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          key: this.apiKey,
          maxResults: Math.min(maxResults, 50)
        }
      });

      // Actualizar cuota
      this._updateQuota('playlistItems');

      const videos = videosResponse.data.items?.map(item => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        position: item.snippet.position,
        url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.contentDetails.videoId}`
      })) || [];

      const result = {
        success: true,
        data: videos,
        totalResults: videosResponse.data.pageInfo?.totalResults || 0,
        channelInfo: {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnail: channel.snippet.thumbnails.medium?.url,
          subscriberCount: parseInt(channel.statistics?.subscriberCount) || 0,
          videoCount: parseInt(channel.statistics?.videoCount) || 0,
          viewCount: parseInt(channel.statistics?.viewCount) || 0
        },
        fetchTime: Date.now() - startTime
      };

      // Almacenar en cache
      this._setCache(cacheKey, result);

      logger.info('✅ Videos del canal obtenidos', {
        channelId,
        channelTitle: result.channelInfo.title,
        resultsCount: videos.length,
        totalResults: result.totalResults,
        duration: result.fetchTime
      });

      return result;

    } catch (error) {
      logger.error('❌ Error obteniendo videos del canal', {
        channelId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: error.message,
        data: [],
        channelId,
        fetchTime: Date.now() - startTime
      };
    }
  }

  /**
   * Obtiene información detallada de un canal
   * @param {string} channelId - ID del canal de YouTube
   * @returns {Promise<object>} - Información del canal
   */
  async getChannelInfo(channelId) {
    const startTime = Date.now();
    const cacheKey = `channel_info_${channelId}`;

    try {
      logger.info('📺 Obteniendo información del canal', { channelId });

      // Validar channelId
      if (!channelId || typeof channelId !== 'string') {
        throw new Error('ID de canal inválido');
      }

      // Verificar API key
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      // Verificar cuota
      if (!this._checkQuota()) {
        throw new Error('Cuota diaria de YouTube API agotada');
      }

      // Intentar obtener del cache
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        logger.info('✅ Información del canal obtenida del cache', {
          channelId,
          duration: Date.now() - startTime
        });
        return cachedResult;
      }

      const response = await this._makeRequest(`${this.baseUrl}/channels`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: channelId,
          key: this.apiKey
        }
      });

      // Actualizar cuota
      this._updateQuota('channels');

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Canal no encontrado');
      }

      const channel = response.data.items[0];
      const channelInfo = {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        publishedAt: channel.snippet.publishedAt,
        thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.medium?.url,
        banner: channel.snippet.bannerTvImageUrl || channel.snippet.bannerMobileImageUrl,
        country: channel.snippet.country,
        defaultLanguage: channel.snippet.defaultLanguage,
        subscriberCount: parseInt(channel.statistics?.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics?.videoCount) || 0,
        viewCount: parseInt(channel.statistics?.viewCount) || 0,
        hiddenSubscriberCount: channel.statistics?.hiddenSubscriberCount || false,
        uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
        customUrl: channel.snippet.customUrl,
        url: `https://www.youtube.com/channel/${channel.id}`
      };

      const result = {
        success: true,
        data: channelInfo,
        fetchTime: Date.now() - startTime
      };

      // Almacenar en cache
      this._setCache(cacheKey, result);

      logger.info('✅ Información del canal obtenida', {
        channelId,
        title: channelInfo.title,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        duration: result.fetchTime
      });

      return result;

    } catch (error) {
      logger.error('❌ Error obteniendo información del canal', {
        channelId,
        error: error.message,
        duration: Date.now() - startTime
      });

      return {
        success: false,
        error: error.message,
        channelId,
        fetchTime: Date.now() - startTime
      };
    }
  }

  /**
   * Valida la API key de YouTube
   * @returns {Promise<object>} - Resultado de validación
   */
  async validateApiKey() {
    try {
      logger.info('🔑 Validando API key de YouTube');

      if (!this.apiKey) {
        return { valid: false, error: 'API key no configurada' };
      }

      // Intentar una petición simple para validar
      await this._makeRequest(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet',
          id: 'dQw4w9WgXcQ', // Video de prueba (Rick Roll)
          key: this.apiKey
        }
      });

      logger.info('✅ API key de YouTube válida');
      return { valid: true };

    } catch (error) {
      logger.error('❌ API key de YouTube inválida', {
        error: error.message
      });

      return {
        valid: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Obtiene estadísticas de uso del servicio
   * @returns {object} - Estadísticas del servicio
   */
  getServiceStats() {
    return {
      apiKeyConfigured: !!this.apiKey,
      dailyQuota: this.dailyQuota,
      dailyUsage: this.dailyUsage,
      usagePercent: ((this.dailyUsage / this.dailyQuota) * 100).toFixed(2),
      cacheSize: cache.size,
      lastResetDate: this.lastResetDate,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      version: '2.0.0'
    };
  }

  /**
   * Limpia el cache manualmente
   * @param {string} pattern - Patrón para filtrar claves (opcional)
   * @returns {number} - Número de entradas eliminadas
   */
  clearCache(pattern = null) {
    let deletedCount = 0;

    if (pattern) {
      for (const [key, value] of cache.entries()) {
        if (key.includes(pattern)) {
          cache.delete(key);
          deletedCount++;
        }
      }
    } else {
      deletedCount = cache.size;
      cache.clear();
    }

    logger.info('🧹 Cache limpiado', {
      pattern: pattern || 'all',
      deletedCount
    });

    return deletedCount;
  }

  /**
   * Reinicia el contador de cuota diaria (solo para desarrollo/testing)
   */
  resetDailyQuota() {
    const oldUsage = this.dailyUsage;
    this.dailyUsage = 0;
    this.lastResetDate = new Date().toDateString();

    logger.info('🔄 Cuota diaria reiniciada', {
      oldUsage,
      newUsage: this.dailyUsage
    });
  }
}

/**
 * Exporta una instancia singleton del servicio YouTube
 * Uso recomendado:
 *
 * const youtubeService = require('./services/youtubeService');
 *
 * // Buscar videos
 * const results = await youtubeService.searchVideos('Twenty One Pilots');
 *
 * // Obtener detalles de video
 * const details = await youtubeService.getVideoDetails('VIDEO_ID');
 *
 * // Obtener items de playlist
 * const playlist = await youtubeService.getPlaylistItems('PLAYLIST_ID');
 *
 * // Obtener videos de canal
 * const channelVideos = await youtubeService.getChannelVideos('CHANNEL_ID');
 *
 * // Obtener información de canal
 * const channelInfo = await youtubeService.getChannelInfo('CHANNEL_ID');
 *
 * // Validar API key
 * const validation = await youtubeService.validateApiKey();
 *
 * // Obtener estadísticas del servicio
 * const stats = youtubeService.getServiceStats();
 *
 * // Limpiar cache
 * youtubeService.clearCache();
 */

module.exports = new YouTubeService();