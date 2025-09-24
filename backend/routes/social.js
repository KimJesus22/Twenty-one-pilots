const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const socialController = require('../controllers/socialController');
const { validateMongoId } = require('../middleware/security');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware para verificar autenticación (simplificado)
const requireAuth = (req, res, next) => {
  // En producción, verificar JWT token
  // req.user = { id: userId }; // Set by auth middleware
  next();
};

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en social:', {
      errors: errors.array(),
      path: req.path,
      method: req.method
    });
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

// ==================== ASISTENCIA ====================

// Validaciones para marcar asistencia
const markAttendanceValidations = [
  body('eventId')
    .isMongoId()
    .withMessage('ID de evento inválido'),
  body('status')
    .isIn(['going', 'interested', 'not_going'])
    .withMessage('Status de asistencia inválido'),
  body('attendingWith')
    .optional()
    .isArray()
    .withMessage('attendingWith debe ser un array'),
  body('attendingWith.*')
    .optional()
    .isMongoId()
    .withMessage('ID de usuario inválido en attendingWith'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
];

// Marcar asistencia a evento
router.post('/attendance', [
  requireAuth,
  markAttendanceValidations,
  handleValidationErrors
], socialController.markAttendance);

// Obtener asistencia de usuario
router.get('/attendance/user/:userId?', [
  requireAuth,
  param('userId').optional().isMongoId().withMessage('ID de usuario inválido'),
  query('status').optional().isIn(['going', 'interested', 'not_going']).withMessage('Status inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], socialController.getUserAttendance);

// Obtener estadísticas de asistencia para evento
router.get('/attendance/event/:eventId/stats', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  handleValidationErrors
], socialController.getEventAttendanceStats);

// ==================== GRUPOS ====================

// Validaciones para crear grupo
const createGroupValidations = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('eventId')
    .isMongoId()
    .withMessage('ID de evento inválido'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('maxMembers debe estar entre 2 y 50'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate debe ser un booleano'),
  body('meetingPoint')
    .optional()
    .isObject()
    .withMessage('meetingPoint debe ser un objeto'),
  body('transportation')
    .optional()
    .isObject()
    .withMessage('transportation debe ser un objeto')
];

// Crear grupo para evento
router.post('/groups', [
  requireAuth,
  createGroupValidations,
  handleValidationErrors
], socialController.createEventGroup);

// Unirse a grupo
router.post('/groups/:groupId/join', [
  requireAuth,
  param('groupId').isMongoId().withMessage('ID de grupo inválido'),
  handleValidationErrors
], socialController.joinEventGroup);

// Salir de grupo
router.post('/groups/:groupId/leave', [
  requireAuth,
  param('groupId').isMongoId().withMessage('ID de grupo inválido'),
  handleValidationErrors
], socialController.leaveEventGroup);

// Obtener grupos de evento
router.get('/groups/event/:eventId', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  handleValidationErrors
], socialController.getEventGroups);

// Validaciones para enviar mensaje
const sendMessageValidations = [
  param('groupId').isMongoId().withMessage('ID de grupo inválido'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('El mensaje debe tener entre 1 y 500 caracteres'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'system'])
    .withMessage('Tipo de mensaje inválido')
];

// Enviar mensaje en chat de grupo
router.post('/groups/:groupId/messages', [
  requireAuth,
  sendMessageValidations,
  handleValidationErrors
], socialController.sendGroupMessage);

// ==================== PUBLICACIONES ====================

// Validaciones para crear publicación
const createPostValidations = [
  body('eventId')
    .isMongoId()
    .withMessage('ID de evento inválido'),
  body('type')
    .isIn(['text', 'image', 'video', 'review'])
    .withMessage('Tipo de publicación inválido'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('El título no puede exceder 200 caracteres'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('El contenido no puede exceder 2000 caracteres'),
  body('media')
    .optional()
    .isArray()
    .withMessage('Media debe ser un array'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating debe estar entre 1 y 5'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags debe ser un array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Cada tag no puede exceder 50 caracteres')
];

// Crear publicación para evento
router.post('/posts', [
  requireAuth,
  createPostValidations,
  handleValidationErrors
], socialController.createEventPost);

// Obtener publicaciones de evento
router.get('/posts/event/:eventId', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('type').optional().isIn(['text', 'image', 'video', 'review']).withMessage('Tipo inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], socialController.getEventPosts);

// Validaciones para reacción
const addReactionValidations = [
  param('postId').isMongoId().withMessage('ID de publicación inválido'),
  body('reactionType')
    .isIn(['like', 'love', 'laugh', 'wow', 'sad', 'angry'])
    .withMessage('Tipo de reacción inválido')
];

// Agregar reacción a publicación
router.post('/posts/:postId/reactions', [
  requireAuth,
  addReactionValidations,
  handleValidationErrors
], socialController.addPostReaction);

// Validaciones para comentario
const addCommentValidations = [
  param('postId').isMongoId().withMessage('ID de publicación inválido'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('El comentario debe tener entre 1 y 500 caracteres')
];

// Agregar comentario a publicación
router.post('/posts/:postId/comments', [
  requireAuth,
  addCommentValidations,
  handleValidationErrors
], socialController.addPostComment);

// ==================== ESTADÍSTICAS ====================

// Obtener estadísticas sociales de evento
router.get('/stats/event/:eventId', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  handleValidationErrors
], socialController.getEventSocialStats);

module.exports = router;