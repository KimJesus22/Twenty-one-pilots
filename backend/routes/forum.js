const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const forumController = require('../controllers/forumController');
const authService = require('../services/authService');
const logger = require('../utils/logger');

const router = express.Router();

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

// Validaciones para crear hilo
const createThreadValidations = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('El contenido debe tener entre 10 y 10000 caracteres'),
  body('category')
    .optional()
    .isIn(['general', 'music', 'concerts', 'merchandise', 'fan-art', 'questions', 'announcements'])
    .withMessage('Categoría inválida'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags deben ser una cadena de texto')
];

// Validaciones para actualizar hilo
const updateThreadValidations = [
  param('id')
    .isMongoId()
    .withMessage('ID de hilo inválido'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('El contenido debe tener entre 10 y 10000 caracteres'),
  body('category')
    .optional()
    .isIn(['general', 'music', 'concerts', 'merchandise', 'fan-art', 'questions', 'announcements'])
    .withMessage('Categoría inválida'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags deben ser una cadena de texto')
];

// Validaciones para crear comentario
const createCommentValidations = [
  param('id')
    .isMongoId()
    .withMessage('ID de hilo inválido'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El comentario debe tener entre 1 y 2000 caracteres'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('ID de comentario padre inválido')
];

// Validaciones para actualizar comentario
const updateCommentValidations = [
  param('commentId')
    .isMongoId()
    .withMessage('ID de comentario inválido'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El comentario debe tener entre 1 y 2000 caracteres')
];

// Validaciones para votar
const voteValidations = [
  body('voteType')
    .isIn(['like', 'dislike'])
    .withMessage('Tipo de voto debe ser "like" o "dislike"')
];

// Estadísticas del foro
router.get('/stats', forumController.getStats);

// Categorías disponibles
router.get('/categories', forumController.getCategories);

// Obtener hilos con filtros avanzados
router.get('/threads', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe estar entre 1 y 50'),
  query('category').optional().isIn(['general', 'music', 'concerts', 'merchandise', 'fan-art', 'questions', 'announcements']).withMessage('Categoría inválida'),
  query('tags').optional().isString().withMessage('Tags deben ser una cadena'),
  query('author').optional().isMongoId().withMessage('ID de autor inválido'),
  query('search').optional().isString().withMessage('Search debe ser una cadena'),
  query('sort').optional().isIn(['createdAt', 'popularity', 'comments', 'views', 'lastActivity']).withMessage('Sort inválido'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order debe ser asc o desc'),
  query('minDate').optional().isISO8601().withMessage('minDate debe ser una fecha ISO válida'),
  query('maxDate').optional().isISO8601().withMessage('maxDate debe ser una fecha ISO válida'),
  handleValidationErrors
], forumController.getThreads);

// Obtener hilo específico
router.get('/threads/:id', [
  param('id').isMongoId().withMessage('ID de hilo inválido'),
  handleValidationErrors
], forumController.getThreadById);

// Crear nuevo hilo
router.post('/threads', [
  authService.authenticateToken,
  createThreadValidations,
  handleValidationErrors
], forumController.createThread);

// Actualizar hilo
router.put('/threads/:id', [
  authService.authenticateToken,
  updateThreadValidations,
  handleValidationErrors
], forumController.updateThread);

// Eliminar hilo
router.delete('/threads/:id', [
  authService.authenticateToken,
  param('id').isMongoId().withMessage('ID de hilo inválido'),
  handleValidationErrors
], forumController.deleteThread);

// Votar en hilo
router.post('/threads/:id/vote', [
  authService.authenticateToken,
  param('id').isMongoId().withMessage('ID de hilo inválido'),
  voteValidations,
  handleValidationErrors
], forumController.voteThread);

// Crear comentario
router.post('/threads/:id/comments', [
  authService.authenticateToken,
  createCommentValidations,
  handleValidationErrors
], forumController.createComment);

// Actualizar comentario
router.put('/comments/:commentId', [
  authService.authenticateToken,
  updateCommentValidations,
  handleValidationErrors
], forumController.updateComment);

// Eliminar comentario
router.delete('/comments/:commentId', [
  authService.authenticateToken,
  param('commentId').isMongoId().withMessage('ID de comentario inválido'),
  handleValidationErrors
], forumController.deleteComment);

// Votar en comentario
router.post('/comments/:commentId/vote', [
  authService.authenticateToken,
  param('commentId').isMongoId().withMessage('ID de comentario inválido'),
  voteValidations,
  handleValidationErrors
], forumController.voteComment);

// Tags y menciones
router.get('/tags/popular', forumController.getPopularTags);
router.get('/tags/search', forumController.searchByTags);
router.get('/tags/suggestions', forumController.getTagSuggestions);
router.get('/mentions/suggestions', forumController.getMentionSuggestions);

module.exports = router;