const EventMusic = require('../models/EventMusic');
const EventMerch = require('../models/EventMerch');
const releaseNotificationService = require('../services/releaseNotificationService');
const logger = require('../utils/logger');

/**
 * Controlador de música y merchandising para eventos
 * Maneja productos exclusivos, música asociada y recomendaciones
 */

// ==================== MÚSICA ====================

/**
 * Obtener música asociada a un evento
 */
const getEventMusic = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, featured, limit = 20, page = 1 } = req.query;

    const options = {
      type,
      featuredOnly: featured === 'true',
      limit: parseInt(limit),
      skip: (page - 1) * parseInt(limit)
    };

    const music = await EventMusic.getEventMusic(eventId, options);
    const total = await EventMusic.countDocuments({
      event: eventId,
      ...(type && { type }),
      ...(featured === 'true' && { isFeatured: true })
    });

    res.json({
      success: true,
      data: music,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error('Error getting event music:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener música del evento'
    });
  }
};

/**
 * Obtener música destacada de un evento
 */
const getFeaturedEventMusic = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 10 } = req.query;

    const music = await EventMusic.getFeaturedMusic(eventId, parseInt(limit));

    res.json({
      success: true,
      data: music
    });
  } catch (error) {
    logger.error('Error getting featured music:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener música destacada'
    });
  }
};

/**
 * Obtener playlist recomendada para un evento
 */
const getRecommendedPlaylist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 20 } = req.query;

    const playlist = await EventMusic.getRecommendedPlaylist(eventId, parseInt(limit));

    res.json({
      success: true,
      data: playlist,
      message: 'Playlist recomendada generada exitosamente'
    });
  } catch (error) {
    logger.error('Error getting recommended playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar playlist recomendada'
    });
  }
};

/**
 * Buscar música en un evento
 */
const searchEventMusic = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El término de búsqueda debe tener al menos 2 caracteres'
      });
    }

    const music = await EventMusic.searchMusic(eventId, q.trim(), parseInt(limit));

    res.json({
      success: true,
      data: music,
      searchTerm: q
    });
  } catch (error) {
    logger.error('Error searching music:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar música'
    });
  }
};

/**
 * Registrar reproducción de música
 */
const trackMusicPlay = async (req, res) => {
  try {
    const { musicId } = req.params;
    const { platform = 'unknown' } = req.body;

    const music = await EventMusic.findById(musicId);
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Música no encontrada'
      });
    }

    await music.incrementPlays(platform);

    res.json({
      success: true,
      message: 'Reproducción registrada'
    });
  } catch (error) {
    logger.error('Error tracking music play:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar reproducción'
    });
  }
};

/**
 * Agregar/quitar like a música
 */
const toggleMusicLike = async (req, res) => {
  try {
    const { musicId } = req.params;
    const { action } = req.body; // 'add' or 'remove'
    const userId = req.user.id;

    const music = await EventMusic.findById(musicId);
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Música no encontrada'
      });
    }

    if (action === 'add') {
      await music.addLike();
    } else if (action === 'remove') {
      await music.removeLike();
    }

    res.json({
      success: true,
      message: action === 'add' ? 'Like agregado' : 'Like removido'
    });
  } catch (error) {
    logger.error('Error toggling music like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar like'
    });
  }
};

/**
 * Compartir música
 */
const shareMusic = async (req, res) => {
  try {
    const { musicId } = req.params;

    const music = await EventMusic.findById(musicId);
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Música no encontrada'
      });
    }

    await music.incrementShares();

    res.json({
      success: true,
      message: 'Música compartida exitosamente',
      shareUrl: music.getPrimaryPlayUrl()
    });
  } catch (error) {
    logger.error('Error sharing music:', error);
    res.status(500).json({
      success: false,
      message: 'Error al compartir música'
    });
  }
};

// ==================== MERCHANDISING ====================

/**
 * Obtener productos de merchandising de un evento
 */
const getEventMerch = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, category, featured, available, limit = 20, page = 1 } = req.query;

    const options = {
      type,
      category,
      featuredOnly: featured === 'true',
      availableOnly: available !== 'false',
      limit: parseInt(limit),
      skip: (page - 1) * parseInt(limit)
    };

    const merch = await EventMerch.getEventMerch(eventId, options);
    const total = await EventMerch.countDocuments({
      event: eventId,
      ...(type && { type }),
      ...(category && { category }),
      ...(featured === 'true' && { featured: true }),
      ...(available !== 'false' && { 'availability.isAvailable': true })
    });

    res.json({
      success: true,
      data: merch,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error('Error getting event merch:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener merchandising'
    });
  }
};

/**
 * Obtener productos destacados de un evento
 */
const getFeaturedEventMerch = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 6 } = req.query;

    const merch = await EventMerch.getFeaturedMerch(eventId, parseInt(limit));

    res.json({
      success: true,
      data: merch
    });
  } catch (error) {
    logger.error('Error getting featured merch:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener merchandising destacado'
    });
  }
};

/**
 * Buscar productos de merchandising
 */
const searchEventMerch = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El término de búsqueda debe tener al menos 2 caracteres'
      });
    }

    const merch = await EventMerch.searchMerch(eventId, q.trim(), parseInt(limit));

    res.json({
      success: true,
      data: merch,
      searchTerm: q
    });
  } catch (error) {
    logger.error('Error searching merch:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar merchandising'
    });
  }
};

/**
 * Obtener detalles de un producto específico
 */
const getMerchDetails = async (req, res) => {
  try {
    const { merchId } = req.params;

    const merch = await EventMerch.findById(merchId).populate('event', 'title venue');
    if (!merch) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Incrementar vistas
    await merch.incrementViews();

    res.json({
      success: true,
      data: merch
    });
  } catch (error) {
    logger.error('Error getting merch details:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del producto'
    });
  }
};

/**
 * Agregar/quitar producto de wishlist
 */
const toggleMerchWishlist = async (req, res) => {
  try {
    const { merchId } = req.params;
    const { action } = req.body; // 'add' or 'remove'
    const userId = req.user.id;

    const merch = await EventMerch.findById(merchId);
    if (!merch) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (action === 'add') {
      await merch.addToWishlist();
    } else if (action === 'remove') {
      await merch.removeFromWishlist();
    }

    res.json({
      success: true,
      message: action === 'add' ? 'Agregado a wishlist' : 'Removido de wishlist'
    });
  } catch (error) {
    logger.error('Error toggling merch wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar wishlist'
    });
  }
};

/**
 * Agregar rating a un producto
 */
const addMerchRating = async (req, res) => {
  try {
    const { merchId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'El rating debe estar entre 1 y 5'
      });
    }

    const merch = await EventMerch.findById(merchId);
    if (!merch) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await merch.addRating(rating);

    res.json({
      success: true,
      message: 'Rating agregado exitosamente',
      newAverage: merch.stats.rating.average
    });
  } catch (error) {
    logger.error('Error adding merch rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar rating'
    });
  }
};

/**
 * Verificar disponibilidad de producto
 */
const checkMerchAvailability = async (req, res) => {
  try {
    const { merchId } = req.params;
    const { quantity = 1, size, variant } = req.query;

    const merch = await EventMerch.findById(merchId);
    if (!merch) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const isAvailable = merch.isInStock(parseInt(quantity), size, variant);

    res.json({
      success: true,
      available: isAvailable,
      inventory: {
        available: merch.inventory.available,
        total: merch.inventory.total
      },
      sizes: size ? merch.inventory.sizes.find(s => s.size === size) : null,
      variant: variant ? merch.inventory.variants.find(v => v.value === variant) : null
    });
  } catch (error) {
    logger.error('Error checking merch availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar disponibilidad'
    });
  }
};

// ==================== ESTADÍSTICAS ====================

/**
 * Obtener estadísticas de música y merchandising
 */
const getEventMusicMerchStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const [musicStats, merchStats, notificationStats] = await Promise.all([
      EventMusic.getMusicStats(eventId),
      EventMerch.getMerchStats(eventId),
      releaseNotificationService.getNotificationStats(eventId)
    ]);

    res.json({
      success: true,
      data: {
        music: musicStats,
        merch: merchStats,
        notifications: notificationStats
      }
    });
  } catch (error) {
    logger.error('Error getting music/merch stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// ==================== NOTIFICACIONES ====================

/**
 * Programar notificación de lanzamiento de música
 */
const scheduleMusicReleaseNotification = async (req, res) => {
  try {
    const { musicId } = req.params;
    const { userId, releaseDate, preferences } = req.body;

    const notification = await releaseNotificationService.scheduleMusicReleaseNotification(
      userId,
      req.body.eventId, // Asumiendo que viene en el body
      musicId,
      new Date(releaseDate),
      preferences
    );

    res.json({
      success: true,
      data: notification,
      message: 'Notificación de música programada exitosamente'
    });
  } catch (error) {
    logger.error('Error scheduling music release notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error al programar notificación de música'
    });
  }
};

/**
 * Programar notificación de lanzamiento de merchandising
 */
const scheduleMerchReleaseNotification = async (req, res) => {
  try {
    const { merchId } = req.params;
    const { userId, releaseDate, preferences } = req.body;

    const notification = await releaseNotificationService.scheduleMerchReleaseNotification(
      userId,
      req.body.eventId, // Asumiendo que viene en el body
      merchId,
      new Date(releaseDate),
      preferences
    );

    res.json({
      success: true,
      data: notification,
      message: 'Notificación de merchandising programada exitosamente'
    });
  } catch (error) {
    logger.error('Error scheduling merch release notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error al programar notificación de merchandising'
    });
  }
};

/**
 * Programar notificaciones masivas para todos los usuarios interesados
 */
const scheduleBulkReleaseNotifications = async (req, res) => {
  try {
    const { eventId, itemType, itemId, releaseDate, preferences } = req.body;

    const notifications = await releaseNotificationService.scheduleEventReleaseNotifications(
      eventId,
      itemType,
      itemId,
      new Date(releaseDate),
      preferences
    );

    res.json({
      success: true,
      data: {
        count: notifications.length,
        notifications: notifications.slice(0, 10) // Solo mostrar las primeras 10
      },
      message: `Notificaciones programadas para ${notifications.length} usuarios`
    });
  } catch (error) {
    logger.error('Error scheduling bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al programar notificaciones masivas'
    });
  }
};

/**
 * Obtener notificaciones de usuario
 */
const getUserReleaseNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type, limit = 20, page = 1 } = req.query;

    const options = {
      status,
      type,
      limit: parseInt(limit),
      skip: (page - 1) * parseInt(limit)
    };

    const notifications = await require('../models/ReleaseNotification').getUserNotifications(userId, options);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(notifications.length / limit), // Esto debería calcularse mejor
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones de usuario'
    });
  }
};

/**
 * Cancelar notificaciones programadas
 */
const cancelReleaseNotifications = async (req, res) => {
  try {
    const { itemType, itemId } = req.body;

    const cancelledCount = await releaseNotificationService.cancelNotifications(itemType, itemId);

    res.json({
      success: true,
      message: `Canceladas ${cancelledCount} notificaciones`
    });
  } catch (error) {
    logger.error('Error cancelling notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar notificaciones'
    });
  }
};

module.exports = {
  // Music
  getEventMusic,
  getFeaturedEventMusic,
  getRecommendedPlaylist,
  searchEventMusic,
  trackMusicPlay,
  toggleMusicLike,
  shareMusic,

  // Merch
  getEventMerch,
  getFeaturedEventMerch,
  searchEventMerch,
  getMerchDetails,
  toggleMerchWishlist,
  addMerchRating,
  checkMerchAvailability,

  // Notifications
  scheduleMusicReleaseNotification,
  scheduleMerchReleaseNotification,
  scheduleBulkReleaseNotifications,
  getUserReleaseNotifications,
  cancelReleaseNotifications,

  // Stats
  getEventMusicMerchStats
};