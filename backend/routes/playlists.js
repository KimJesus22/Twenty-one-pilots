const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Playlist } = require('../models/Playlist');
const User = require('../models/User');
const { validateMongoId } = require('../middleware/security');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware para verificar autenticación (simplificado)
const requireAuth = (req, res, next) => {
  // En producción, verificar JWT token
  next();
};

// Validaciones para crear playlist
const createPlaylistValidations = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage('El nombre contiene caracteres no permitidos'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('userId')
    .isMongoId()
    .withMessage('ID de usuario inválido'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic debe ser un valor booleano')
];

// Validaciones para actualizar playlist
const updatePlaylistValidations = [
  param('id')
    .isMongoId()
    .withMessage('ID de playlist inválido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic debe ser un valor booleano'),
  body('userId')
    .isMongoId()
    .withMessage('ID de usuario inválido')
];

// Validaciones para agregar canción
const addSongValidations = [
  param('id')
    .isMongoId()
    .withMessage('ID de playlist inválido'),
  body('songId')
    .isMongoId()
    .withMessage('ID de canción inválido'),
  body('userId')
    .isMongoId()
    .withMessage('ID de usuario inválido')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en playlists:', {
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

// Obtener playlists del usuario
router.get('/user/:userId', [
  requireAuth,
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const playlists = await Playlist.find({ user: userId })
      .populate('songs')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Playlist.countDocuments({ user: userId });

    res.json({
      success: true,
      data: playlists,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Error obteniendo playlists del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener playlist específica
router.get('/:id', [
  param('id').isMongoId().withMessage('ID de playlist inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('user', 'username')
      .populate('songs');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    logger.error('Error obteniendo playlist específica:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva playlist
router.post('/', [
  requireAuth,
  createPlaylistValidations,
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, description, userId, isPublic } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const playlist = new Playlist({
      name,
      description,
      user: userId,
      isPublic: isPublic || false,
    });

    await playlist.save();
    await playlist.populate('user', 'username');

    logger.info('Nueva playlist creada:', {
      playlistId: playlist._id,
      userId,
      name
    });

    res.status(201).json({
      success: true,
      data: playlist,
      message: 'Playlist creada exitosamente'
    });
  } catch (error) {
    logger.error('Error creando playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar playlist
router.put('/:id', [
  requireAuth,
  updatePlaylistValidations,
  handleValidationErrors
], async (req, res) => {
  try {
    const { userId, name, description, isPublic } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar que el usuario sea el propietario
    if (playlist.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para modificar esta playlist'
      });
    }

    // Actualizar campos
    if (name !== undefined) playlist.name = name;
    if (description !== undefined) playlist.description = description;
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    await playlist.save();
    await playlist.populate('user', 'username');

    logger.info('Playlist actualizada:', {
      playlistId: req.params.id,
      userId
    });

    res.json({
      success: true,
      data: playlist,
      message: 'Playlist actualizada exitosamente'
    });
  } catch (error) {
    logger.error('Error actualizando playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar playlist
router.delete('/:id', [
  requireAuth,
  param('id').isMongoId().withMessage('ID de playlist inválido'),
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { userId } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar que el usuario sea el propietario
    if (playlist.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar esta playlist'
      });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    logger.info('Playlist eliminada:', {
      playlistId: req.params.id,
      userId
    });

    res.json({
      success: true,
      message: 'Playlist eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error eliminando playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Agregar canción a playlist
router.post('/:id/songs', [
  requireAuth,
  addSongValidations,
  handleValidationErrors
], async (req, res) => {
  try {
    const { songId, userId } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar que el usuario sea el propietario
    if (playlist.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Verificar que la canción no esté ya en la playlist
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({
        success: false,
        message: 'La canción ya está en la playlist'
      });
    }

    playlist.songs.push(songId);
    await playlist.save();
    await playlist.populate('songs');

    logger.info('Canción agregada a playlist:', {
      playlistId: req.params.id,
      songId,
      userId
    });

    res.json({
      success: true,
      data: playlist,
      message: 'Canción agregada exitosamente'
    });
  } catch (error) {
    logger.error('Error agregando canción a playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar canción de playlist
router.delete('/:id/songs/:songId', [
  requireAuth,
  param('id').isMongoId().withMessage('ID de playlist inválido'),
  param('songId').isMongoId().withMessage('ID de canción inválido'),
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { userId } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist no encontrada'
      });
    }

    // Verificar que el usuario sea el propietario
    if (playlist.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    playlist.songs = playlist.songs.filter(song => song.toString() !== req.params.songId);
    await playlist.save();
    await playlist.populate('songs');

    logger.info('Canción eliminada de playlist:', {
      playlistId: req.params.id,
      songId: req.params.songId,
      userId
    });

    res.json({
      success: true,
      data: playlist,
      message: 'Canción eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error eliminando canción de playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener playlists públicas
router.get('/public/all', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const playlists = await Playlist.find({ isPublic: true })
      .populate('user', 'username')
      .populate('songs')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Playlist.countDocuments({ isPublic: true });

    res.json({
      success: true,
      data: playlists,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Error obteniendo playlists públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;