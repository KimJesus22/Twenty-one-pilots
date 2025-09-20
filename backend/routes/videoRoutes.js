/**
 * Rutas completas de videos para la aplicación Twenty One Pilots
 * Maneja todas las operaciones CRUD de videos y integración con YouTube API
 *
 * @author KimJesus21
 * @version 2.0.0
 * @since 2025-09-20
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Video = require('../models/Video');
const { Song, Album } = require('../models/Discography');
const videoController = require('../controllers/videoController');
const youtubeService = require('../services/youtubeService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware para verificar autenticación (simplificado)
const requireAuth = (req, res, next) => {
  // En producción, verificar JWT token
  next();
};

// Middleware para verificar permisos de administrador
const requireAdmin = (req, res, next) => {
  // En producción, verificar rol de administrador
  next();
};

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en videoRoutes:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

// =============================================================================
// RUTAS DE YOUTUBE API
// =============================================================================

/**
 * @route GET /api/videos/test-api
 * @desc Validar la API key de YouTube
 * @access Public
 */
router.get('/test-api', videoController.validateApiKey);

/**
 * @route GET /api/videos/search
 * @desc Buscar videos en YouTube
 * @access Public
 * @query {string} q - Término de búsqueda
 * @query {number} [maxResults=10] - Número máximo de resultados (1-50)
 * @query {string} [order=relevance] - Orden de resultados
 * @query {string} [publishedAfter] - Fecha mínima de publicación (ISO 8601)
 * @query {string} [publishedBefore] - Fecha máxima de publicación (ISO 8601)
 */
router.get('/search',
  [
    query('q')
      .optional()
      .isString()
      .withMessage('El término de búsqueda debe ser un string')
      .isLength({ min: 1, max: 100 })
      .withMessage('El término de búsqueda debe tener entre 1 y 100 caracteres'),
    query('maxResults')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('maxResults debe ser un número entre 1 y 50'),
    query('order')
      .optional()
      .isIn(['relevance', 'date', 'rating', 'title', 'viewCount'])
      .withMessage('order debe ser uno de: relevance, date, rating, title, viewCount'),
    query('publishedAfter')
      .optional()
      .isISO8601()
      .withMessage('publishedAfter debe ser una fecha ISO 8601 válida'),
    query('publishedBefore')
      .optional()
      .isISO8601()
      .withMessage('publishedBefore debe ser una fecha ISO 8601 válida')
  ],
  handleValidationErrors,
  videoController.searchVideos
);

/**
 * @route GET /api/videos/:id
 * @desc Obtener detalles de un video específico
 * @access Public
 * @param {string} id - ID del video de YouTube
 */
router.get('/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('ID de video requerido')
      .isLength({ min: 11, max: 11 })
      .withMessage('ID de video debe tener exactamente 11 caracteres')
  ],
  handleValidationErrors,
  videoController.getVideoDetails
);

/**
 * @route GET /api/videos/:id/related
 * @desc Obtener videos relacionados
 * @access Public
 * @param {string} id - ID del video base
 * @query {number} [maxResults=5] - Número máximo de resultados (1-10)
 */
router.get('/:id/related',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('ID de video requerido')
      .isLength({ min: 11, max: 11 })
      .withMessage('ID de video debe tener exactamente 11 caracteres'),
    query('maxResults')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('maxResults debe ser un número entre 1 y 10')
  ],
  handleValidationErrors,
  videoController.getRelatedVideos
);

/**
 * @route GET /api/videos/channel/:channelId
 * @desc Obtener videos de un canal específico
 * @access Public
 * @param {string} channelId - ID del canal de YouTube
 * @query {number} [maxResults=10] - Número máximo de resultados (1-50)
 */
router.get('/channel/:channelId',
  [
    param('channelId')
      .isString()
      .notEmpty()
      .withMessage('ID de canal requerido'),
    query('maxResults')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('maxResults debe ser un número entre 1 y 50')
  ],
  handleValidationErrors,
  videoController.getChannelVideos
);

/**
 * @route GET /api/videos/channel/:channelId/info
 * @desc Obtener información de un canal
 * @access Public
 * @param {string} channelId - ID del canal de YouTube
 */
router.get('/channel/:channelId/info',
  [
    param('channelId')
      .isString()
      .notEmpty()
      .withMessage('ID de canal requerido')
  ],
  handleValidationErrors,
  videoController.getChannelInfo
);

// =============================================================================
// RUTAS CRUD PARA VIDEOS ALMACENADOS EN MONGODB
// =============================================================================

/**
 * @route GET /api/videos/stored
 * @desc Obtener lista de videos almacenados en la base de datos
 * @access Public
 * @query {number} [page=1] - Página actual
 * @query {number} [limit=20] - Número de videos por página
 * @query {string} [search] - Término de búsqueda en título/descripción
 * @query {string} [channelId] - Filtrar por canal
 * @query {string} [sortBy=createdAt] - Campo para ordenar
 * @query {string} [sortOrder=desc] - Orden (asc/desc)
 */
router.get('/stored',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un número entero positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit debe ser un número entre 1 y 100'),
    query('search')
      .optional()
      .isString()
      .withMessage('search debe ser un string'),
    query('channelId')
      .optional()
      .isString()
      .withMessage('channelId debe ser un string'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'publishedAt', 'statistics.viewCount', 'title'])
      .withMessage('sortBy debe ser un campo válido'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('sortOrder debe ser asc o desc')
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();
    const {
      page = 1,
      limit = 20,
      search,
      channelId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    try {
      logger.info('📋 Obteniendo videos almacenados', {
        page,
        limit,
        search,
        channelId,
        sortBy,
        sortOrder,
        userId: req.user?.id,
        ip: req.ip
      });

      // Construir query
      const query = { isAvailable: true };

      if (search) {
        query.$text = { $search: search };
      }

      if (channelId) {
        query.channelId = channelId;
      }

      // Construir opciones de ordenamiento
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calcular skip
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Ejecutar consulta
      const videos = await Video.find(query)
        .populate('associatedSongs', 'title artist')
        .populate('associatedAlbums', 'title artist releaseYear')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      // Contar total
      const total = await Video.countDocuments(query);

      logger.info('✅ Videos almacenados obtenidos', {
        count: videos.length,
        total,
        page,
        totalPages: Math.ceil(total / parseInt(limit)),
        duration: Date.now() - startTime
      });

      res.json({
        success: true,
        data: videos,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: (parseInt(page) * parseInt(limit)) < total,
          hasPrevPage: parseInt(page) > 1
        }
      });

    } catch (error) {
      logger.error('❌ Error obteniendo videos almacenados', {
        error: error.message,
        page,
        limit,
        duration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route GET /api/videos/stored/:id
 * @desc Obtener un video específico almacenado en la base de datos
 * @access Public
 * @param {string} id - ID del documento de video en MongoDB
 */
router.get('/stored/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('ID de video inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;

    try {
      logger.info('🎬 Obteniendo video almacenado por ID', {
        videoId: id,
        userId: req.user?.id,
        ip: req.ip
      });

      const video = await Video.findById(id)
        .populate('associatedSongs', 'title artist album duration')
        .populate('associatedAlbums', 'title artist releaseYear coverImage');

      if (!video) {
        logger.warn('⚠️ Video almacenado no encontrado', { videoId: id });
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      // Incrementar contador de acceso
      video.incrementAccess().catch(err =>
        logger.warn('Error incrementando contador de acceso', { error: err.message })
      );

      logger.info('✅ Video almacenado obtenido', {
        videoId: id,
        title: video.title.substring(0, 50),
        duration: Date.now() - startTime
      });

      res.json({
        success: true,
        data: video
      });

    } catch (error) {
      logger.error('❌ Error obteniendo video almacenado', {
        videoId: id,
        error: error.message,
        duration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route POST /api/videos/stored
 * @desc Crear un nuevo video en la base de datos
 * @access Private (Admin)
 * @body {string} videoId - ID del video de YouTube
 * @body {string} title - Título del video
 * @body {string} [description] - Descripción del video
 * @body {string} channelId - ID del canal
 * @body {string} channelTitle - Título del canal
 * @body {string} thumbnail - URL del thumbnail
 * @body {string} [source=youtube_api] - Fuente del video
 */
router.post('/stored',
  requireAdmin,
  [
    body('videoId')
      .isString()
      .notEmpty()
      .withMessage('videoId es requerido')
      .isLength({ min: 11, max: 11 })
      .withMessage('videoId debe tener exactamente 11 caracteres'),
    body('title')
      .isString()
      .notEmpty()
      .withMessage('title es requerido')
      .isLength({ min: 1, max: 200 })
      .withMessage('title debe tener entre 1 y 200 caracteres'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 5000 })
      .withMessage('description no puede exceder 5000 caracteres'),
    body('channelId')
      .isString()
      .notEmpty()
      .withMessage('channelId es requerido'),
    body('channelTitle')
      .isString()
      .notEmpty()
      .withMessage('channelTitle es requerido'),
    body('thumbnail')
      .isString()
      .notEmpty()
      .withMessage('thumbnail es requerido')
      .isURL()
      .withMessage('thumbnail debe ser una URL válida'),
    body('source')
      .optional()
      .isIn(['youtube_api', 'manual', 'import'])
      .withMessage('source debe ser youtube_api, manual o import')
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();
    const videoData = req.body;

    try {
      logger.info('➕ Creando nuevo video almacenado', {
        videoId: videoData.videoId,
        title: videoData.title,
        userId: req.user?.id,
        ip: req.ip
      });

      // Verificar si el video ya existe
      const existingVideo = await Video.findOne({ videoId: videoData.videoId });
      if (existingVideo) {
        logger.warn('⚠️ Video ya existe en la base de datos', {
          videoId: videoData.videoId,
          existingId: existingVideo._id
        });
        return res.status(409).json({
          success: false,
          message: 'El video ya existe en la base de datos',
          existingVideo: existingVideo._id
        });
      }

      // Crear nuevo video
      const video = new Video({
        ...videoData,
        publishedAt: videoData.publishedAt || new Date(),
        createdBy: req.user?.id
      });

      await video.save();

      logger.info('✅ Video almacenado creado exitosamente', {
        videoId: videoData.videoId,
        storedId: video._id,
        duration: Date.now() - startTime
      });

      res.status(201).json({
        success: true,
        data: video,
        message: 'Video creado exitosamente'
      });

    } catch (error) {
      logger.error('❌ Error creando video almacenado', {
        videoId: videoData.videoId,
        error: error.message,
        duration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route PUT /api/videos/stored/:id
 * @desc Actualizar un video almacenado
 * @access Private (Admin)
 * @param {string} id - ID del documento de video en MongoDB
 * @body {string} [title] - Nuevo título
 * @body {string} [description] - Nueva descripción
 * @body {object} [statistics] - Nuevas estadísticas
 */
router.put('/stored/:id',
  requireAdmin,
  [
    param('id')
      .isMongoId()
      .withMessage('ID de video inválido'),
    body('title')
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage('title debe tener entre 1 y 200 caracteres'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 5000 })
      .withMessage('description no puede exceder 5000 caracteres'),
    body('statistics')
      .optional()
      .isObject()
      .withMessage('statistics debe ser un objeto'),
    body('isAvailable')
      .optional()
      .isBoolean()
      .withMessage('isAvailable debe ser un booleano')
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    const updateData = req.body;

    try {
      logger.info('✏️ Actualizando video almacenado', {
        videoId: id,
        updates: Object.keys(updateData),
        userId: req.user?.id,
        ip: req.ip
      });

      const video = await Video.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('associatedSongs associatedAlbums');

      if (!video) {
        logger.warn('⚠️ Video almacenado no encontrado para actualizar', { videoId: id });
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      logger.info('✅ Video almacenado actualizado', {
        videoId: id,
        title: video.title,
        duration: Date.now() - startTime
      });

      res.json({
        success: true,
        data: video,
        message: 'Video actualizado exitosamente'
      });

    } catch (error) {
      logger.error('❌ Error actualizando video almacenado', {
        videoId: id,
        error: error.message,
        duration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route DELETE /api/videos/stored/:id
 * @desc Eliminar un video almacenado
 * @access Private (Admin)
 * @param {string} id - ID del documento de video en MongoDB
 */
router.delete('/stored/:id',
  requireAdmin,
  [
    param('id')
      .isMongoId()
      .withMessage('ID de video inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;

    try {
      logger.info('🗑️ Eliminando video almacenado', {
        videoId: id,
        userId: req.user?.id,
        ip: req.ip
      });

      const video = await Video.findByIdAndDelete(id);

      if (!video) {
        logger.warn('⚠️ Video almacenado no encontrado para eliminar', { videoId: id });
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      logger.info('✅ Video almacenado eliminado', {
        videoId: id,
        title: video.title,
        duration: Date.now() - startTime
      });

      res.json({
        success: true,
        message: 'Video eliminado exitosamente'
      });

    } catch (error) {
      logger.error('❌ Error eliminando video almacenado', {
        videoId: id,
        error: error.message,
        duration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =============================================================================
// RUTAS DE ASOCIACIONES CON DISCOGRAFÍA
// =============================================================================

/**
 * @route POST /api/videos/:videoId/song/:songId
 * @desc Asociar un video con una canción
 * @access Private
 * @param {string} videoId - ID del video
 * @param {string} songId - ID de la canción
 */
router.post('/:videoId/song/:songId',
  requireAuth,
  [
    param('videoId')
      .isString()
      .notEmpty()
      .withMessage('ID de video requerido'),
    param('songId')
      .isMongoId()
      .withMessage('ID de canción inválido')
  ],
  handleValidationErrors,
  videoController.associateVideoWithSong
);

/**
 * @route POST /api/videos/:videoId/album/:albumId
 * @desc Asociar un video con un álbum
 * @access Private
 * @param {string} videoId - ID del video
 * @param {string} albumId - ID del álbum
 */
router.post('/:videoId/album/:albumId',
  requireAuth,
  [
    param('videoId')
      .isString()
      .notEmpty()
      .withMessage('ID de video requerido'),
    param('albumId')
      .isMongoId()
      .withMessage('ID de álbum inválido')
  ],
  handleValidationErrors,
  videoController.associateVideoWithAlbum
);

/**
 * @route DELETE /api/videos/:videoId/song/:songId
 * @desc Desasociar un video de una canción
 * @access Private
 * @param {string} videoId - ID del video
 * @param {string} songId - ID de la canción
 */
router.delete('/:videoId/song/:songId',
  requireAuth,
  [
    param('videoId')
      .isString()
      .notEmpty()
      .withMessage('ID de video requerido'),
    param('songId')
      .isMongoId()
      .withMessage('ID de canción inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();
    const { videoId, songId } = req.params;

    try {
      logger.info('🔗 Desasociando video de canción', {
        videoId,
        songId,
        userId: req.user?.id,
        ip: req.ip
      });

      // Verificar permisos (usuario debe ser propietario o admin)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida'
        });
      }

      // Buscar el video
      const video = await Video.findOne({ videoId });
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      // Verificar que la canción existe
      const song = await Song.findById(songId);
      if (!song) {
        return res.status(404).json({
          success: false,
          message: 'Canción no encontrada'
        });
      }

      // Remover asociación
      video.associatedSongs = video.associatedSongs.filter(
        id => id.toString() !== songId
      );
      video.updatedAt = new Date();
      await video.save();

      logger.info('✅ Video desasociado de canción', {
        videoId,
        songId,
        songTitle: song.title,
        videoTitle: video.title,
        duration: Date.now() - startTime
      });

      res.json({
        success: true,
        message: 'Video desasociado de canción exitosamente',
        data: {
          video: video,
          song: song
        }
      });

    } catch (error) {
      logger.error('❌ Error desasociando video de canción', {
        videoId,
        songId,
        error: error.message,
        duration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route DELETE /api/videos/:videoId/album/:albumId
 * @desc Desasociar un video de un álbum
 * @access Private
 * @param {string} videoId - ID del video
 * @param {string} albumId - ID del álbum
 */
router.delete('/:videoId/album/:albumId',
  requireAuth,
  [
    param('videoId')
      .isString()
      .notEmpty()
      .withMessage('ID de video requerido'),
    param('albumId')
      .isMongoId()
      .withMessage('ID de álbum inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    const startTime = Date.now();
    const { videoId, albumId } = req.params;

    try {
      logger.info('💿 Desasociando video de álbum', {
        videoId,
        albumId,
        userId: req.user?.id,
        ip: req.ip
      });

      // Verificar permisos
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida'
        });
      }

      // Buscar el video
      const video = await Video.findOne({ videoId });
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado'
        });
      }

      // Verificar que el álbum existe
      const album = await Album.findById(albumId);
      if (!album) {
        return res.status(404).json({
          success: false,
          message: 'Álbum no encontrado'
        });
      }

      // Remover asociación
      video.associatedAlbums = video.associatedAlbums.filter(
        id => id.toString() !== albumId
      );
      video.updatedAt = new Date();
      await video.save();

      logger.info('✅ Video desasociado de álbum', {
        videoId,
        albumId,
        albumTitle: album.title,
        videoTitle: video.title,
        duration: Date.now() - startTime
      });

      res.json({
        success: true,
        message: 'Video desasociado de álbum exitosamente',
        data: {
          video: video,
          album: album
        }
      });

    } catch (error) {
      logger.error('❌ Error desasociando video de álbum', {
        videoId,
        albumId,
        error: error.message,
        duration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =============================================================================
// RUTAS DE ESTADÍSTICAS Y UTILIDADES
// =============================================================================

/**
 * @route GET /api/videos/popular
 * @desc Obtener videos populares de la base de datos
 * @access Public
 * @query {number} [limit=10] - Número máximo de resultados
 * @query {number} [page=1] - Página actual
 */
router.get('/popular',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('limit debe ser un número entre 1 y 50'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un número positivo')
  ],
  handleValidationErrors,
  videoController.getPopularVideos
);

/**
 * @route GET /api/videos/recent
 * @desc Obtener videos recientes de la base de datos
 * @access Public
 * @query {number} [limit=10] - Número máximo de resultados
 * @query {number} [page=1] - Página actual
 */
router.get('/recent',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('limit debe ser un número entre 1 y 50'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un número positivo')
  ],
  handleValidationErrors,
  videoController.getRecentVideos
);

/**
 * @route GET /api/videos/stats/service
 * @desc Obtener estadísticas del servicio de videos
 * @access Private (Admin)
 */
router.get('/stats/service', requireAdmin, videoController.getServiceStats);

/**
 * @route GET /api/videos/stats/database
 * @desc Obtener estadísticas de videos en la base de datos
 * @access Private (Admin)
 */
router.get('/stats/database',
  requireAdmin,
  async (req, res) => {
    const startTime = Date.now();

    try {
      logger.info('📊 Obteniendo estadísticas de base de datos de videos', {
        userId: req.user?.id,
        ip: req.ip
      });

      const [
        totalVideos,
        availableVideos,
        videosWithSongs,
        videosWithAlbums,
        totalViews,
        avgViews
      ] = await Promise.all([
        Video.countDocuments(),
        Video.countDocuments({ isAvailable: true }),
        Video.countDocuments({ associatedSongs: { $exists: true, $ne: [] } }),
        Video.countDocuments({ associatedAlbums: { $exists: true, $ne: [] } }),
        Video.aggregate([
          { $group: { _id: null, totalViews: { $sum: '$statistics.viewCount' } } }
        ]),
        Video.aggregate([
          { $group: { _id: null, avgViews: { $avg: '$statistics.viewCount' } } }
        ])
      ]);

      const stats = {
        totalVideos,
        availableVideos,
        unavailableVideos: totalVideos - availableVideos,
        videosWithSongs,
        videosWithAlbums,
        totalViews: totalViews[0]?.totalViews || 0,
        averageViews: Math.round(avgViews[0]?.avgViews || 0),
        timestamp: new Date().toISOString()
      };

      logger.info('✅ Estadísticas de base de datos obtenidas', {
        totalVideos,
        duration: Date.now() - startTime
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas de base de datos', {
        error: error.message,
        duration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;