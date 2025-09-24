const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const musicMerchController = require('../controllers/musicMerchController');
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
    logger.warn('Errores de validación en music/merch:', {
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

// ==================== MÚSICA ====================

// Obtener música de un evento
router.get('/music/event/:eventId', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('type').optional().isIn(['song', 'album', 'ep', 'single', 'playlist', 'live_recording']).withMessage('Tipo inválido'),
  query('featured').optional().isBoolean().withMessage('Featured debe ser booleano'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número entero positivo'),
  handleValidationErrors
], musicMerchController.getEventMusic);

// Obtener música destacada
router.get('/music/event/:eventId/featured', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Límite debe estar entre 1 y 20'),
  handleValidationErrors
], musicMerchController.getFeaturedEventMusic);

// Obtener playlist recomendada
router.get('/music/event/:eventId/recommended', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], musicMerchController.getRecommendedPlaylist);

// Buscar música
router.get('/music/event/:eventId/search', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('q').isLength({ min: 2, max: 100 }).withMessage('Término de búsqueda debe tener entre 2 y 100 caracteres'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], musicMerchController.searchEventMusic);

// Registrar reproducción
router.post('/music/:musicId/play', [
  requireAuth,
  param('musicId').isMongoId().withMessage('ID de música inválido'),
  body('platform').optional().isIn(['spotify', 'youtube', 'apple', 'deezer', 'soundcloud', 'unknown']).withMessage('Plataforma inválida'),
  handleValidationErrors
], musicMerchController.trackMusicPlay);

// Like/Unlike música
router.post('/music/:musicId/like', [
  requireAuth,
  param('musicId').isMongoId().withMessage('ID de música inválido'),
  body('action').isIn(['add', 'remove']).withMessage('Acción debe ser add o remove'),
  handleValidationErrors
], musicMerchController.toggleMusicLike);

// Compartir música
router.post('/music/:musicId/share', [
  requireAuth,
  param('musicId').isMongoId().withMessage('ID de música inválido'),
  handleValidationErrors
], musicMerchController.shareMusic);

// ==================== MERCHANDISING ====================

// Obtener merchandising de un evento
router.get('/merch/event/:eventId', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('type').optional().isIn(['clothing', 'accessories', 'music', 'collectibles', 'digital', 'other']).withMessage('Tipo inválido'),
  query('category').optional().isIn(['t-shirt', 'hoodie', 'hat', 'poster', 'vinyl', 'cd', 'digital_album', 'bundle', 'limited_edition']).withMessage('Categoría inválida'),
  query('featured').optional().isBoolean().withMessage('Featured debe ser booleano'),
  query('available').optional().isBoolean().withMessage('Available debe ser booleano'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número entero positivo'),
  handleValidationErrors
], musicMerchController.getEventMerch);

// Obtener merchandising destacado
router.get('/merch/event/:eventId/featured', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('limit').optional().isInt({ min: 1, max: 12 }).withMessage('Límite debe estar entre 1 y 12'),
  handleValidationErrors
], musicMerchController.getFeaturedEventMerch);

// Buscar merchandising
router.get('/merch/event/:eventId/search', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('q').isLength({ min: 2, max: 100 }).withMessage('Término de búsqueda debe tener entre 2 y 100 caracteres'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], musicMerchController.searchEventMerch);

// Detalles de producto
router.get('/merch/:merchId', [
  param('merchId').isMongoId().withMessage('ID de producto inválido'),
  handleValidationErrors
], musicMerchController.getMerchDetails);

// Wishlist de producto
router.post('/merch/:merchId/wishlist', [
  requireAuth,
  param('merchId').isMongoId().withMessage('ID de producto inválido'),
  body('action').isIn(['add', 'remove']).withMessage('Acción debe ser add o remove'),
  handleValidationErrors
], musicMerchController.toggleMerchWishlist);

// Rating de producto
router.post('/merch/:merchId/rating', [
  requireAuth,
  param('merchId').isMongoId().withMessage('ID de producto inválido'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe estar entre 1 y 5'),
  handleValidationErrors
], musicMerchController.addMerchRating);

// Verificar disponibilidad
router.get('/merch/:merchId/availability', [
  param('merchId').isMongoId().withMessage('ID de producto inválido'),
  query('quantity').optional().isInt({ min: 1 }).withMessage('Cantidad debe ser un número positivo'),
  query('size').optional().isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']).withMessage('Talla inválida'),
  query('variant').optional().isLength({ min: 1, max: 100 }).withMessage('Variante inválida'),
  handleValidationErrors
], musicMerchController.checkMerchAvailability);

// ==================== ESTADÍSTICAS ====================

// Estadísticas de música y merchandising
router.get('/stats/event/:eventId', [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  handleValidationErrors
], musicMerchController.getEventMusicMerchStats);

// ==================== NOTIFICACIONES ====================

// Programar notificación de música
router.post('/music/:musicId/notifications', [
  requireAuth,
  param('musicId').isMongoId().withMessage('ID de música inválido'),
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
  body('eventId').isMongoId().withMessage('ID de evento inválido'),
  body('releaseDate').isISO8601().withMessage('Fecha de lanzamiento inválida'),
  body('preferences').optional().isObject().withMessage('Preferencias inválidas'),
  handleValidationErrors
], musicMerchController.scheduleMusicReleaseNotification);

// Programar notificación de merchandising
router.post('/merch/:merchId/notifications', [
  requireAuth,
  param('merchId').isMongoId().withMessage('ID de producto inválido'),
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
  body('eventId').isMongoId().withMessage('ID de evento inválido'),
  body('releaseDate').isISO8601().withMessage('Fecha de lanzamiento inválida'),
  body('preferences').optional().isObject().withMessage('Preferencias inválidas'),
  handleValidationErrors
], musicMerchController.scheduleMerchReleaseNotification);

// Programar notificaciones masivas
router.post('/notifications/bulk', [
  requireAuth,
  body('eventId').isMongoId().withMessage('ID de evento inválido'),
  body('itemType').isIn(['music', 'merch']).withMessage('Tipo de item inválido'),
  body('itemId').isMongoId().withMessage('ID de item inválido'),
  body('releaseDate').isISO8601().withMessage('Fecha de lanzamiento inválida'),
  body('preferences').optional().isObject().withMessage('Preferencias inválidas'),
  handleValidationErrors
], musicMerchController.scheduleBulkReleaseNotifications);

// Obtener notificaciones de usuario
router.get('/notifications/user/:userId', [
  requireAuth,
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  query('status').optional().isIn(['scheduled', 'sent', 'cancelled', 'failed']).withMessage('Estado inválido'),
  query('type').optional().isIn(['music_release', 'merch_release', 'album_release', 'single_release', 'bundle_release']).withMessage('Tipo inválido'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número entero positivo'),
  handleValidationErrors
], musicMerchController.getUserReleaseNotifications);

// Cancelar notificaciones
router.delete('/notifications', [
  requireAuth,
  body('itemType').isIn(['music', 'merch']).withMessage('Tipo de item inválido'),
  body('itemId').isMongoId().withMessage('ID de item inválido'),
  handleValidationErrors
], musicMerchController.cancelReleaseNotifications);

module.exports = router;