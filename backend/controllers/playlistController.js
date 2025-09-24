const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const crypto = require('crypto');
const realtimeService = require('../services/realtimeService');
const auditService = require('../services/auditService');

/**
 * Crear una nueva playlist
 */
exports.createPlaylist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { name, description, tags, category, isPublic, isCollaborative, rating, coverImage } = req.body;
    const userId = req.user._id;

    // Crear la playlist
    const playlist = new Playlist({
      name,
      description,
      user: userId,
      tags: tags || [],
      category: category || 'custom',
      isPublic: isPublic || false,
      isCollaborative: isCollaborative || false,
      rating,
      coverImage
    });

    await playlist.save();

    // Registrar en auditoría centralizada
    await auditService.logPlaylistEvent(
      'created',
      playlist._id,
      userId,
      { name, isPublic, category },
      req.ip,
      req.get('User-Agent')
    );

    await playlist.populate('user', 'username avatar');

    logger.info(`Playlist created: ${playlist.name} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Playlist creada exitosamente',
      data: playlist
    });

  } catch (error) {
    logger.error('Error creating playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la playlist'
    });
  }
};

/**
 * Obtener playlists del usuario
 */
exports.getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, category, sort = 'createdAt', order = 'desc' } = req.query;

    const query = { user: userId, status: 'active' };

    if (category && category !== 'all') {
      query.category = category;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sort]: order === 'desc' ? -1 : 1 },
      populate: [
        { path: 'user', select: 'username avatar' },
        { path: 'videos.video', select: 'title thumbnail duration' }
      ]
    };

    const playlists = await Playlist.paginate(query, options);

    res.json({
      success: true,
      data: {
        playlists: playlists.docs,
        pagination: {
          page: playlists.page,
          limit: playlists.limit,
          total: playlists.totalDocs,
          pages: playlists.totalPages
        }
      }
    });

  } catch (error) {
    logger.error('Error getting user playlists:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las playlists'
    });
  }
};

/**
 * Obtener playlist por ID
 */
exports.getPlaylistById = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user?._id;

    const playlist = await Playlist.findById(playlistId)
      .populate('user', 'username avatar')
      .populate('videos.video', 'title thumbnail duration artist album')
      .populate('collaborators.user', 'username avatar')
      .populate('likes', 'username avatar');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar permisos de visualización
    if (!playlist.canView(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta playlist'
      });
    }

    // Incrementar contador de vistas si no es el propietario
    if (userId && playlist.user._id.toString() !== userId.toString()) {
      playlist.viewCount += 1;
      await playlist.save();
    }

    res.json({
      success: true,
      data: playlist
    });

  } catch (error) {
    logger.error('Error getting playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la playlist'
    });
  }
};

/**
 * Actualizar playlist
 */
exports.updatePlaylist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { playlistId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar permisos de edición
    if (!playlist.canEdit(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta playlist'
      });
    }

    // Actualizar campos permitidos
    const allowedFields = ['name', 'description', 'tags', 'category', 'isPublic', 'isCollaborative', 'rating', 'coverImage'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        playlist[field] = updates[field];
      }
    });

    // Agregar entrada de auditoría
    playlist.auditLog.push({
      action: 'updated',
      user: userId,
      details: updates,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await playlist.save();
    await playlist.populate('user', 'username avatar');

    logger.info(`Playlist updated: ${playlist.name} by user ${userId}`);

    res.json({
      success: true,
      message: 'Playlist actualizada exitosamente',
      data: playlist
    });

  } catch (error) {
    logger.error('Error updating playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la playlist'
    });
  }
};

/**
 * Eliminar playlist
 */
exports.deletePlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Solo el propietario puede eliminar
    if (playlist.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede eliminar la playlist'
      });
    }

    // Marcar como eliminada en lugar de borrar físicamente
    playlist.status = 'deleted';
    playlist.updatedAt = new Date();

    // Registrar en auditoría centralizada
    await auditService.logPlaylistEvent(
      'deleted',
      playlistId,
      userId,
      { playlistId, name: playlist.name },
      req.ip,
      req.get('User-Agent')
    );

    await playlist.save();

    logger.info(`Playlist deleted: ${playlist.name} by user ${userId}`);

    res.json({
      success: true,
      message: 'Playlist eliminada exitosamente'
    });

  } catch (error) {
    logger.error('Error deleting playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la playlist'
    });
  }
};

/**
 * Agregar video a playlist
 */
exports.addVideoToPlaylist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { playlistId } = req.params;
    const { videoId } = req.body;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video no encontrado'
      });
    }

    // Verificar permisos de edición
    if (!playlist.canEdit(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta playlist'
      });
    }

    await playlist.addVideo(videoId, userId);

    // Notificar a observadores en tiempo real
    realtimeService.notifyPlaylistUpdate(
      playlistId,
      realtimeService.constructor.PLAYLIST_EVENTS.VIDEO_ADDED,
      { videoId, addedBy: userId },
      userId
    );

    logger.info(`Video ${videoId} added to playlist ${playlistId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Video agregado exitosamente',
      data: {
        videoCount: playlist.videos.length
      }
    });

  } catch (error) {
    logger.error('Error adding video to playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar el video'
    });
  }
};

/**
 * Quitar video de playlist
 */
exports.removeVideoFromPlaylist = async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar permisos de edición
    if (!playlist.canEdit(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta playlist'
      });
    }

    await playlist.removeVideo(videoId, userId);

    // Notificar a observadores en tiempo real
    realtimeService.notifyPlaylistUpdate(
      playlistId,
      realtimeService.constructor.PLAYLIST_EVENTS.VIDEO_REMOVED,
      { videoId, removedBy: userId },
      userId
    );

    logger.info(`Video ${videoId} removed from playlist ${playlistId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Video removido exitosamente',
      data: {
        videoCount: playlist.videos.length
      }
    });

  } catch (error) {
    logger.error('Error removing video from playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover el video'
    });
  }
};

/**
 * Reordenar videos en playlist
 */
exports.reorderPlaylistVideos = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { playlistId } = req.params;
    const { videoOrder } = req.body; // { "videoId": order, ... }
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar permisos de edición
    if (!playlist.canEdit(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta playlist'
      });
    }

    await playlist.reorderVideos(videoOrder, userId);

    // Notificar a observadores en tiempo real
    realtimeService.notifyPlaylistUpdate(
      playlistId,
      realtimeService.constructor.PLAYLIST_EVENTS.VIDEOS_REORDERED,
      { videoOrder, reorderedBy: userId },
      userId
    );

    logger.info(`Videos reordered in playlist ${playlistId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Videos reordenados exitosamente'
    });

  } catch (error) {
    logger.error('Error reordering playlist videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reordenar los videos'
    });
  }
};

/**
 * Dar/quitar like a playlist
 */
exports.togglePlaylistLike = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    const likeCount = await playlist.toggleLike(userId);

    // Notificar a observadores en tiempo real
    realtimeService.notifyPlaylistUpdate(
      playlistId,
      realtimeService.constructor.PLAYLIST_EVENTS.LIKED,
      { likedBy: userId, totalLikes: likeCount },
      userId
    );

    logger.info(`Like toggled on playlist ${playlistId} by user ${userId}`);

    res.json({
      success: true,
      data: {
        likes: likeCount,
        isLiked: playlist.likes.includes(userId)
      }
    });

  } catch (error) {
    logger.error('Error toggling playlist like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el like'
    });
  }
};

/**
 * Agregar colaborador a playlist
 */
exports.addCollaborator = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { playlistId } = req.params;
    const { userId: collaboratorId, role = 'viewer' } = req.body;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);
    const collaborator = await User.findById(collaboratorId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    if (!collaborator) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Solo el propietario puede agregar colaboradores
    if (playlist.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede gestionar colaboradores'
      });
    }

    await playlist.addCollaborator(collaboratorId, userId, role);

    // Notificar a observadores en tiempo real
    realtimeService.notifyPlaylistUpdate(
      playlistId,
      realtimeService.constructor.PLAYLIST_EVENTS.COLLABORATOR_ADDED,
      { collaboratorId, role, addedBy: userId },
      userId
    );

    logger.info(`Collaborator ${collaboratorId} added to playlist ${playlistId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Colaborador agregado exitosamente'
    });

  } catch (error) {
    logger.error('Error adding collaborator:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar colaborador'
    });
  }
};

/**
 * Actualizar configuración de compartir
 */
exports.updateShareSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { playlistId } = req.params;
    const settings = req.body;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar permisos de edición
    if (!playlist.canEdit(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta playlist'
      });
    }

    await playlist.updateShareSettings(settings, userId);

    logger.info(`Share settings updated for playlist ${playlistId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Configuración de compartir actualizada',
      data: playlist.shareSettings
    });

  } catch (error) {
    logger.error('Error updating share settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración de compartir'
    });
  }
};

/**
 * Obtener playlist por URL de compartir
 */
exports.getSharedPlaylist = async (req, res) => {
  try {
    const { shareUrl } = req.params;

    const playlist = await Playlist.findOne({
      shareUrl,
      'shareSettings.isEnabled': true,
      status: 'active'
    })
    .populate('user', 'username avatar')
    .populate('videos.video', 'title thumbnail duration artist album');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist compartida no encontrada'
      });
    }

    // Verificar expiración
    if (playlist.shareSettings.expiresAt && new Date() > playlist.shareSettings.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'El enlace de compartir ha expirado'
      });
    }

    // Verificar límite de vistas
    if (playlist.shareSettings.maxViews && playlist.shareSettings.currentViews >= playlist.shareSettings.maxViews) {
      return res.status(410).json({
        success: false,
        message: 'El límite de vistas ha sido alcanzado'
      });
    }

    // Incrementar contador de vistas
    playlist.shareSettings.currentViews += 1;
    await playlist.save();

    res.json({
      success: true,
      data: playlist
    });

  } catch (error) {
    logger.error('Error getting shared playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la playlist compartida'
    });
  }
};

/**
 * Obtener playlists públicas
 */
exports.getPublicPlaylists = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tags, sort = 'createdAt', order = 'desc' } = req.query;

    const query = {
      isPublic: true,
      status: 'active'
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sort]: order === 'desc' ? -1 : 1 },
      populate: [
        { path: 'user', select: 'username avatar' },
        { path: 'videos.video', select: 'title thumbnail duration' }
      ]
    };

    const playlists = await Playlist.paginate(query, options);

    res.json({
      success: true,
      data: {
        playlists: playlists.docs,
        pagination: {
          page: playlists.page,
          limit: playlists.limit,
          total: playlists.totalDocs,
          pages: playlists.totalPages
        }
      }
    });

  } catch (error) {
    logger.error('Error getting public playlists:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las playlists públicas'
    });
  }
};

/**
 * Moderar playlist (solo administradores)
 */
exports.moderatePlaylist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { playlistId } = req.params;
    const { status, reason } = req.body;
    const moderatorId = req.user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    await playlist.moderate(status, moderatorId, reason);

    logger.info(`Playlist ${playlistId} moderated to ${status} by moderator ${moderatorId}`);

    res.json({
      success: true,
      message: 'Playlist moderada exitosamente',
      data: { status: playlist.status }
    });

  } catch (error) {
    logger.error('Error moderating playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al moderar la playlist'
    });
  }
};

/**
 * Exportar playlist
 */
exports.exportPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { format = 'json' } = req.query;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId)
      .populate('videos.video', 'title artist album duration youtubeId spotifyId')
      .populate('user', 'username');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar permisos
    if (!playlist.canView(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para exportar esta playlist'
      });
    }

    const exportData = {
      name: playlist.name,
      description: playlist.description,
      category: playlist.category,
      tags: playlist.tags,
      rating: playlist.rating,
      createdAt: playlist.createdAt,
      videos: playlist.videos.map(pv => ({
        title: pv.video.title,
        artist: pv.video.artist,
        album: pv.video.album,
        duration: pv.video.duration,
        youtubeId: pv.video.youtubeId,
        spotifyId: pv.video.spotifyId,
        addedAt: pv.addedAt
      }))
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${playlist.name}.json"`);
      res.json(exportData);
    } else {
      // Para otros formatos, devolver JSON por ahora
      res.json(exportData);
    }

    // Agregar entrada de auditoría
    playlist.auditLog.push({
      action: 'exported',
      user: userId,
      details: { format },
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await playlist.save();

  } catch (error) {
    logger.error('Error exporting playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar la playlist'
    });
  }
};

/**
 * Importar playlist desde JSON
 */
exports.importPlaylist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { data } = req.body;
    const userId = req.user._id;

    // Crear la playlist
    const playlist = new Playlist({
      name: data.name,
      description: data.description,
      category: data.category || 'custom',
      tags: data.tags || [],
      rating: data.rating,
      user: userId
    });

    await playlist.save();

    // Agregar videos si existen
    if (data.videos && Array.isArray(data.videos)) {
      for (const videoData of data.videos) {
        // Buscar video por youtubeId o spotifyId
        let video = null;
        if (videoData.youtubeId) {
          video = await Video.findOne({ youtubeId: videoData.youtubeId });
        } else if (videoData.spotifyId) {
          video = await Video.findOne({ spotifyId: videoData.spotifyId });
        }

        if (video) {
          await playlist.addVideo(video._id, userId);
        }
      }
    }

    // Agregar entrada de auditoría
    playlist.auditLog.push({
      action: 'imported',
      user: userId,
      details: { source: 'json', videoCount: data.videos?.length || 0 },
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await playlist.save();
    await playlist.populate('user', 'username avatar');

    logger.info(`Playlist imported: ${playlist.name} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Playlist importada exitosamente',
      data: playlist
    });

  } catch (error) {
    logger.error('Error importing playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al importar la playlist'
    });
  }
};

/**
 * Obtener estadísticas de playlist
 */
exports.getPlaylistStats = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar permisos (solo propietario o colaboradores)
    if (!playlist.canEdit(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las estadísticas'
      });
    }

    const stats = {
      viewCount: playlist.viewCount,
      likeCount: playlist.likes.length,
      followerCount: playlist.followerCount,
      playCount: playlist.playCount,
      videoCount: playlist.videos.length,
      shareCount: playlist.shareSettings.currentViews || 0,
      lastPlayedAt: playlist.lastPlayedAt,
      createdAt: playlist.createdAt
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting playlist stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas'
    });
  }
};

/**
 * Obtener log de auditoría de playlist
 */
exports.getPlaylistAuditLog = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Solo el propietario puede ver el log de auditoría
    if (playlist.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede ver el log de auditoría'
      });
    }

    const auditLog = playlist.auditLog
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice((page - 1) * limit, page * limit);

    const total = playlist.auditLog.length;

    res.json({
      success: true,
      data: {
        auditLog,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error getting playlist audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el log de auditoría'
    });
  }
};

/**
 * Suscribirse a notificaciones en tiempo real de una playlist
 */
exports.subscribeToPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar permisos de visualización
    if (!playlist.canView(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para suscribirte a esta playlist'
      });
    }

    // Registrar la suscripción
    const connectionId = `conn_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    realtimeService.registerConnection(userId, connectionId);
    realtimeService.startWatchingPlaylist(userId, playlistId);

    logger.info(`User ${userId} subscribed to playlist ${playlistId}`);

    res.json({
      success: true,
      message: 'Suscripción exitosa',
      data: {
        connectionId,
        playlistId
      }
    });

  } catch (error) {
    logger.error('Error subscribing to playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al suscribirse a la playlist'
    });
  }
};

/**
 * Cancelar suscripción a notificaciones en tiempo real
 */
exports.unsubscribeFromPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { connectionId } = req.body;
    const userId = req.user._id;

    realtimeService.stopWatchingPlaylist(userId, playlistId);

    if (connectionId) {
      realtimeService.unregisterConnection(userId, connectionId);
    }

    logger.info(`User ${userId} unsubscribed from playlist ${playlistId}`);

    res.json({
      success: true,
      message: 'Suscripción cancelada exitosamente'
    });

  } catch (error) {
    logger.error('Error unsubscribing from playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la suscripción'
    });
  }
};

/**
 * Obtener estadísticas del servicio en tiempo real
 */
exports.getRealtimeStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Solo administradores pueden ver estadísticas globales
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden ver estadísticas globales'
      });
    }

    const stats = realtimeService.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting realtime stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas en tiempo real'
    });
  }
};

/**
 * Obtener notificaciones pendientes (para polling como alternativa)
 */
exports.getPendingNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { since } = req.query;

    // Esta implementación básica no mantiene un historial de notificaciones
    // En una implementación real, se guardaría en base de datos
    const notifications = [];

    // Simular algunas notificaciones recientes para testing
    if (process.env.NODE_ENV === 'development') {
      const recentPlaylists = await Playlist.find({
        $or: [
          { user: userId },
          { collaborators: { $elemMatch: { user: userId } } }
        ],
        updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
      }).limit(5);

      notifications.push(...recentPlaylists.map(playlist => ({
        type: 'playlist_update',
        playlistId: playlist._id,
        message: `Playlist "${playlist.name}" fue actualizada`,
        timestamp: playlist.updatedAt
      })));
    }

    res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length
      }
    });

  } catch (error) {
    logger.error('Error getting pending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones pendientes'
    });
  }
};