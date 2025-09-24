/**
 * Controlador de videos para la aplicación Twenty One Pilots
 * Maneja todas las operaciones relacionadas con videos de YouTube
 *
 * @author KimJesus21
 * @version 2.0.0
 * @since 2025-09-20
 */

const youtubeService = require('../services/youtubeService');
const Video = require('../models/Video');
const logger = require('../utils/logger');

/**
 * Buscar videos con filtros avanzados
 */
const searchVideos = async (req, res) => {
  try {
    const { q = 'Twenty One Pilots', maxResults = 10, type, genre, artist, year } = req.query;

    logger.info('🔍 Buscando videos', { query: q, maxResults, type, genre, artist, year });

    // Si hay filtros avanzados, buscar en base de datos local
    if (type || genre || artist || year) {
      const filters = {};
      if (type) filters.type = type;
      if (genre) filters.genre = genre;
      if (artist) filters.artist = artist;
      if (year) filters.year = parseInt(year);

      const videos = await Video.findByFilters(filters, parseInt(maxResults));

      res.json({
        success: true,
        data: videos,
        source: 'database',
        filters: filters
      });
    } else {
      // Buscar en YouTube
      const result = await youtubeService.searchVideos(q, { maxResults: parseInt(maxResults) });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          source: 'youtube',
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
 * Obtener recomendaciones personalizadas
 */
const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    logger.info('🎯 Obteniendo recomendaciones', { userId, limit });

    const recommendations = await Video.getRecommendations(userId, parseInt(limit));

    res.json({
      success: true,
      data: recommendations,
      source: 'recommendations'
    });
  } catch (error) {
    logger.error('❌ Error en getRecommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Agregar video a favoritos
 */
const addToFavorites = async (req, res) => {
  try {
    const { userId, videoId } = req.params;

    logger.info('❤️ Agregando video a favoritos', { userId, videoId });

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.addToFavorites(videoId);

    res.json({
      success: true,
      message: 'Video agregado a favoritos'
    });
  } catch (error) {
    logger.error('❌ Error en addToFavorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Quitar video de favoritos
 */
const removeFromFavorites = async (req, res) => {
  try {
    const { userId, videoId } = req.params;

    logger.info('💔 Quitando video de favoritos', { userId, videoId });

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.removeFromFavorites(videoId);

    res.json({
      success: true,
      message: 'Video quitado de favoritos'
    });
  } catch (error) {
    logger.error('❌ Error en removeFromFavorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener videos favoritos del usuario
 */
const getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    logger.info('⭐ Obteniendo favoritos del usuario', { userId, page, limit });

    const User = require('../models/User');
    const user = await User.findById(userId).populate({
      path: 'favoriteVideos',
      options: {
        skip: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit)
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user.favoriteVideos,
      pagination: {
        currentPage: parseInt(page),
        totalItems: user.favoriteVideos.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('❌ Error en getUserFavorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar si un video está en favoritos
 */
const checkFavoriteStatus = async (req, res) => {
  try {
    const { userId, videoId } = req.params;

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const isFavorite = user.isFavorite(videoId);

    res.json({
      success: true,
      isFavorite
    });
  } catch (error) {
    logger.error('❌ Error en checkFavoriteStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear lista personalizada
 */
const createCustomList = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, description, isPublic } = req.body;

    logger.info('📝 Creando lista personalizada', { userId, name });

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.createCustomList(name, description, isPublic);

    res.json({
      success: true,
      message: 'Lista personalizada creada exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error en createCustomList:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Agregar video a lista personalizada
 */
const addToCustomList = async (req, res) => {
  try {
    const { userId, listIndex, videoId } = req.params;

    logger.info('➕ Agregando video a lista personalizada', { userId, listIndex, videoId });

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.customLists[listIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    await user.addToCustomList(listIndex, videoId);

    res.json({
      success: true,
      message: 'Video agregado a lista personalizada'
    });
  } catch (error) {
    logger.error('❌ Error en addToCustomList:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Quitar video de lista personalizada
 */
const removeFromCustomList = async (req, res) => {
  try {
    const { userId, listIndex, videoId } = req.params;

    logger.info('➖ Quitando video de lista personalizada', { userId, listIndex, videoId });

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.customLists[listIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    await user.removeFromCustomList(listIndex, videoId);

    res.json({
      success: true,
      message: 'Video quitado de lista personalizada'
    });
  } catch (error) {
    logger.error('❌ Error en removeFromCustomList:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener listas personalizadas del usuario
 */
const getUserCustomLists = async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info('📋 Obteniendo listas personalizadas', { userId });

    const User = require('../models/User');
    const user = await User.findById(userId).populate('customLists.videos');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user.customLists
    });
  } catch (error) {
    logger.error('❌ Error en getUserCustomLists:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar lista personalizada
 */
const deleteCustomList = async (req, res) => {
  try {
    const { userId, listIndex } = req.params;

    logger.info('🗑️ Eliminando lista personalizada', { userId, listIndex });

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.customLists[listIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    await user.deleteCustomList(listIndex);

    res.json({
      success: true,
      message: 'Lista personalizada eliminada'
    });
  } catch (error) {
    logger.error('❌ Error en deleteCustomList:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Registrar visualización de video en historial
 */
const addToWatchHistory = async (req, res) => {
  try {
    const { userId, videoId } = req.params;
    const { watchDuration = 0 } = req.body;

    logger.info('📺 Agregando a historial', { userId, videoId, watchDuration });

    const User = require('../models/User');

    // Remover entrada anterior si existe
    await User.updateOne(
      { _id: userId },
      { $pull: { watchHistory: { video: videoId } } }
    );

    // Agregar nueva entrada
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          watchHistory: {
            video: videoId,
            watchedAt: new Date(),
            watchDuration: parseInt(watchDuration)
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'Video agregado al historial'
    });
  } catch (error) {
    logger.error('❌ Error en addToWatchHistory:', error);
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

/**
 * Obtener comentarios de un video
 */
const getVideoComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const VideoComment = require('../models/VideoComment');

    const comments = await VideoComment.getVideoComments(videoId, page, limit);
    const totalComments = await VideoComment.countVideoComments(videoId);

    res.json({
      success: true,
      data: comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalItems: totalComments,
        itemsPerPage: limit,
        hasNextPage: page * limit < totalComments,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('❌ Error en getVideoComments:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear comentario en un video
 */
const createVideoComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user?.id; // Asumiendo que viene del middleware de auth

    const VideoComment = require('../models/VideoComment');

    const comment = new VideoComment({
      content,
      author: userId,
      video: videoId,
      parentComment: parentCommentId || null
    });

    await comment.save();
    await comment.populate('author', 'username');

    logger.info('💬 Nuevo comentario creado:', {
      commentId: comment._id,
      videoId,
      userId
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comentario creado exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error en createVideoComment:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar comentario
 */
const updateVideoComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    const VideoComment = require('../models/VideoComment');

    const comment = await VideoComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    // Verificar que el usuario sea el autor
    if (comment.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para editar este comentario'
      });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate('author', 'username');

    logger.info('✏️ Comentario actualizado:', {
      commentId,
      userId
    });

    res.json({
      success: true,
      data: comment,
      message: 'Comentario actualizado exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error en updateVideoComment:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar comentario
 */
const deleteVideoComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    const VideoComment = require('../models/VideoComment');

    const comment = await VideoComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    // Verificar que el usuario sea el autor o admin
    if (comment.author.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar este comentario'
      });
    }

    await VideoComment.findByIdAndDelete(commentId);

    logger.info('🗑️ Comentario eliminado:', {
      commentId,
      userId
    });

    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error en deleteVideoComment:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Votar en comentario
 */
const voteVideoComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType } = req.body;
    const userId = req.user?.id;

    const VideoComment = require('../models/VideoComment');

    const comment = await VideoComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    await comment.addVote(userId, voteType);
    await comment.populate('author', 'username');

    res.json({
      success: true,
      data: comment,
      message: 'Voto registrado exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error en voteVideoComment:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener respuestas de un comentario
 */
const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const VideoComment = require('../models/VideoComment');

    const replies = await VideoComment.getCommentReplies(commentId, page, limit);

    res.json({
      success: true,
      data: replies,
      pagination: {
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error('❌ Error en getCommentReplies:', error);
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
  getRecommendations,
  addToWatchHistory,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  checkFavoriteStatus,
  createCustomList,
  addToCustomList,
  removeFromCustomList,
  getUserCustomLists,
  deleteCustomList,
  getVideoComments,
  createVideoComment,
  updateVideoComment,
  deleteVideoComment,
  voteVideoComment,
  getCommentReplies,
  validateApiKey,
  getServiceStats,
  associateVideoWithSong,
  associateVideoWithAlbum
};