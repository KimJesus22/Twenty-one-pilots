const express = require('express');
const { body, param, query } = require('express-validator');
const wishlistController = require('../controllers/wishlistController');
const authService = require('../services/authService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authService.authenticateToken);

// Validaciones
const addToWishlistValidations = [
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
  body('productId').isMongoId().withMessage('ID de producto inválido'),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notas muy largas')
];

const updateNotesValidations = [
  body('notes').isString().isLength({ max: 500 }).withMessage('Notas muy largas')
];

// ===== RUTAS DE WISHLIST =====

// Obtener wishlist del usuario
router.get('/user/:userId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido')
], wishlistController.getUserWishlist);

// Agregar producto a wishlist
router.post('/', addToWishlistValidations, wishlistController.addToWishlist);

// Remover producto de wishlist
router.delete('/:userId/:productId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  param('productId').isMongoId().withMessage('ID de producto inválido')
], wishlistController.removeFromWishlist);

// Verificar si producto está en wishlist
router.get('/check/:userId/:productId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  param('productId').isMongoId().withMessage('ID de producto inválido')
], wishlistController.checkWishlistStatus);

// Actualizar notas de un item en wishlist
router.put('/notes/:userId/:productId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  param('productId').isMongoId().withMessage('ID de producto inválido'),
  ...updateNotesValidations
], wishlistController.updateWishlistNotes);

// Limpiar wishlist completa
router.delete('/clear/:userId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido')
], wishlistController.clearWishlist);

// Obtener estadísticas de wishlist
router.get('/stats/:userId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido')
], wishlistController.getWishlistStats);

// Obtener recomendaciones basadas en wishlist
router.get('/recommendations/:userId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido')
], wishlistController.getWishlistRecommendations);

// ===== ENDPOINTS ADICIONALES =====

// Toggle producto en wishlist (alternativa conveniente)
router.post('/toggle', addToWishlistValidations, async (req, res) => {
  try {
    const { userId, productId, notes } = req.body;

    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const isInWishlist = user.isInWishlist(productId);

    if (isInWishlist) {
      await user.removeFromWishlist(productId);
      res.json({
        success: true,
        action: 'removed',
        message: 'Producto removido de la wishlist'
      });
    } else {
      await user.addToWishlist(productId, notes);
      res.json({
        success: true,
        action: 'added',
        message: 'Producto agregado a la wishlist'
      });
    }
  } catch (error) {
    logger.error('❌ Error en toggle wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Información de la API
router.get('/api-info', (req, res) => {
  res.json({
    success: true,
    message: 'Wishlist API - Sistema de lista de deseos',
    version: '1.0.0',
    endpoints: {
      'GET /user/:userId': 'Obtener wishlist del usuario',
      'POST /': 'Agregar producto a wishlist',
      'DELETE /:userId/:productId': 'Remover producto de wishlist',
      'GET /check/:userId/:productId': 'Verificar si producto está en wishlist',
      'PUT /notes/:userId/:productId': 'Actualizar notas de producto',
      'DELETE /clear/:userId': 'Limpiar wishlist completa',
      'GET /stats/:userId': 'Obtener estadísticas de wishlist',
      'POST /toggle': 'Toggle producto en wishlist'
    },
    features: [
      'Almacenamiento integrado en modelo User',
      'Notas personales por producto',
      'Estadísticas y analytics',
      'Toggle conveniente',
      'Validación completa',
      'Integración con productos'
    ]
  });
});

module.exports = router;