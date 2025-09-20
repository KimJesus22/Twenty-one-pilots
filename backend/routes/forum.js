const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Thread } = require('../models/Forum');
const User = require('../models/User');
const { validateMongoId } = require('../middleware/security');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware para verificar autenticación (simplificado)
const requireAuth = (req, res, next) => {
  // En producción, verificar JWT token
  next();
};

// Validaciones para crear hilo
const createThreadValidations = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage('El título contiene caracteres no permitidos'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('El contenido debe tener entre 10 y 5000 caracteres'),
  body('authorId')
    .isMongoId()
    .withMessage('ID de autor inválido')
];

// Validaciones para crear comentario
const createCommentValidations = [
  param('id')
    .isMongoId()
    .withMessage('ID de hilo inválido'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('El comentario debe tener entre 1 y 1000 caracteres'),
  body('authorId')
    .isMongoId()
    .withMessage('ID de autor inválido')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en forum:', {
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

// Obtener todos los hilos
router.get('/threads', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const threads = await Thread.find()
      .populate('author', 'username')
      .sort({ isPinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Thread.countDocuments();

    res.json({
      success: true,
      data: threads,
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
    logger.error('Error obteniendo hilos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener un hilo específico
router.get('/threads/:id', [
  param('id').isMongoId().withMessage('ID de hilo inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments.author', 'username');

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Hilo no encontrado'
      });
    }

    res.json({
      success: true,
      data: thread
    });
  } catch (error) {
    logger.error('Error obteniendo hilo específico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo hilo
router.post('/threads', [
  requireAuth,
  createThreadValidations,
  handleValidationErrors
], async (req, res) => {
  try {
    const { title, content, authorId } = req.body;

    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const thread = new Thread({
      title,
      content,
      author: authorId,
    });

    await thread.save();
    await thread.populate('author', 'username');

    logger.info('Nuevo hilo creado:', {
      threadId: thread._id,
      authorId,
      title: title.substring(0, 50)
    });

    res.status(201).json({
      success: true,
      data: thread,
      message: 'Hilo creado exitosamente'
    });
  } catch (error) {
    logger.error('Error creando hilo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Agregar comentario a un hilo
router.post('/threads/:id/comments', [
  requireAuth,
  createCommentValidations,
  handleValidationErrors
], async (req, res) => {
  try {
    const { content, authorId } = req.body;

    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Hilo no encontrado'
      });
    }

    thread.comments.push({
      content,
      author: authorId,
    });

    await thread.save();
    await thread.populate('comments.author', 'username');

    const newComment = thread.comments[thread.comments.length - 1];

    logger.info('Nuevo comentario agregado:', {
      threadId: req.params.id,
      commentId: newComment._id,
      authorId
    });

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comentario agregado exitosamente'
    });
  } catch (error) {
    logger.error('Error agregando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;