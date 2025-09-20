/**
 * Controlador de videos para la aplicación Twenty One Pilots
 * Maneja todas las operaciones relacionadas con videos de YouTube
 *
 * @author KimJesus21
 * @version 2.0.0
 * @since 2025-09-20
 */

const youtubeService = require('../services/youtubeService');
const logger = require('../utils/logger');

/**
 * Buscar videos en YouTube
 */
const searchVideos = async (req, res) => {
  try {
    const { q = 'Twenty One Pilots', maxResults = 10 } = req.query;

    logger.info('🔍 Buscando videos', { query: q, maxResults });

    const result = await youtubeService.searchVideos(q, { maxResults: parseInt(maxResults) });

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        pagination: {
          totalResults: result.totalResults,
          nextPageToken: result.nextPageToken,
          prevPageToken: result.prevPageToken
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Error al buscar videos'
      });
    }
  } catch (error) {
    logger.error('❌ Error en searchVideos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener detalles de un video específico
 */
const getVideoDetails = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('🎬 Obteniendo detalles del video', { videoId: id });

    const result = await youtubeService.getVideoDetails(id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error || 'Video no encontrado'
      });
    }
  } catch (error) {
    logger.error('❌ Error en getVideoDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener videos relacionados
 */
const getRelatedVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxResults = 5 } = req.query;

    logger.info('🔗 Obteniendo videos relacionados', { videoId: id, maxResults });

    // Usar la búsqueda con el título del video actual como query
    const videoDetails = await youtubeService.getVideoDetails(id);

    if (!videoDetails.success) {
      return res.status(404).json({
        success: false,
        message: 'Video no encontrado'
      });
    }

    const searchQuery = `${videoDetails.data.title} Twenty One Pilots`;
    const result = await youtubeService.searchVideos(searchQuery, {
      maxResults: parseInt(maxResults)
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data.filter(v => v.id !== id) // Excluir el video actual
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Error al obtener videos relacionados'
      });
    }
  } catch (error) {
    logger.error('❌ Error en getRelatedVideos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener videos de un canal específico
 */
const getChannelVideos = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { maxResults = 10 } = req.query;

    logger.info('📺 Obteniendo videos del canal', { channelId, maxResults });

    const result = await youtubeService.getChannelVideos(channelId, {
      maxResults: parseInt(maxResults)
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        channelInfo: result.channelInfo
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error || 'Canal no encontrado'
      });
    }
  } catch (error) {
    logger.error('❌ Error en getChannelVideos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener información de un canal
 */
const getChannelInfo = async (req, res) => {
  try {
    const { channelId } = req.params;

    logger.info('📺 Obteniendo información del canal', { channelId });

    const result = await youtubeService.getChannelInfo(channelId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error || 'Canal no encontrado'
      });
    }
  } catch (error) {
    logger.error('❌ Error en getChannelInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener videos populares (simulados desde la base de datos)
 */
const getPopularVideos = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    logger.info('⭐ Obteniendo videos populares', { limit, page });

    // Por ahora, devolver videos de Twenty One Pilots populares
    const result = await youtubeService.searchVideos('Twenty One Pilots official', {
      maxResults: parseInt(limit)
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalItems: result.data.length,
          itemsPerPage: parseInt(limit)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Error al obtener videos populares'
      });
    }
  } catch (error) {
    logger.error('❌ Error en getPopularVideos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener videos recientes (simulados)
 */
const getRecentVideos = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    logger.info('🆕 Obteniendo videos recientes', { limit, page });

    // Buscar videos recientes de Twenty One Pilots
    const result = await youtubeService.searchVideos('Twenty One Pilots', {
      maxResults: parseInt(limit),
      order: 'date'
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalItems: result.data.length,
          itemsPerPage: parseInt(limit)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Error al obtener videos recientes'
      });
    }
  } catch (error) {
    logger.error('❌ Error en getRecentVideos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Validar API key de YouTube
 */
const validateApiKey = async (req, res) => {
  try {
    logger.info('🔑 Validando API key de YouTube');

    const result = await youtubeService.validateApiKey();

    res.json({
      success: result.valid,
      message: result.valid ? 'API key válida' : result.error
    });
  } catch (error) {
    logger.error('❌ Error en validateApiKey:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener estadísticas del servicio
 */
const getServiceStats = async (req, res) => {
  try {
    logger.info('📊 Obteniendo estadísticas del servicio');

    const stats = youtubeService.getServiceStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Error en getServiceStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Asociar video con canción (placeholder)
 */
const associateVideoWithSong = async (req, res) => {
  try {
    const { videoId, songId } = req.params;

    logger.info('🔗 Asociando video con canción', { videoId, songId });

    // Placeholder - implementar cuando tengamos modelos de canciones
    res.json({
      success: true,
      message: 'Funcionalidad no implementada aún',
      videoId,
      songId
    });
  } catch (error) {
    logger.error('❌ Error en associateVideoWithSong:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Asociar video con álbum (placeholder)
 */
const associateVideoWithAlbum = async (req, res) => {
  try {
    const { videoId, albumId } = req.params;

    logger.info('🔗 Asociando video con álbum', { videoId, albumId });

    // Placeholder - implementar cuando tengamos modelos de álbumes
    res.json({
      success: true,
      message: 'Funcionalidad no implementada aún',
      videoId,
      albumId
    });
  } catch (error) {
    logger.error('❌ Error en associateVideoWithAlbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  searchVideos,
  getVideoDetails,
  getRelatedVideos,
  getChannelVideos,
  getChannelInfo,
  getPopularVideos,
  getRecentVideos,
  validateApiKey,
  getServiceStats,
  associateVideoWithSong,
  associateVideoWithAlbum
};