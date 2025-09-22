const express = require('express');
const { body, param, query } = require('express-validator');
const favoritesController = require('../controllers/favoritesController');
const authService = require('../services/authService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authService.authenticateToken);

// Validaciones
const favoriteValidations = [
  body('itemType').isIn(['song', 'album', 'video', 'article', 'concert', 'playlist'])
    .withMessage('Tipo de item inválido'),
  body('itemId').isMongoId().withMessage('ID de item inválido'),
  body('itemData').optional().isObject().withMessage('Datos del item deben ser un objeto'),
  body('tags').optional().isArray().withMessage('Tags debe ser un array'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notas muy largas'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating debe estar entre 1 y 5'),
  body('isPublic').optional().isBoolean().withMessage('isPublic debe ser booleano')
];

const updateValidations = [
  body('tags').optional().isArray().withMessage('Tags debe ser un array'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notas muy largas'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating debe estar entre 1 y 5'),
  body('isPublic').optional().isBoolean().withMessage('isPublic debe ser booleano')
];

// ===== RUTAS DE FAVORITOS =====

// Agregar a favoritos
router.post('/', favoriteValidations, favoritesController.addToFavorites);

// Remover de favoritos
router.delete('/:itemType/:itemId', [
  param('itemType').isIn(['song', 'album', 'video', 'article', 'concert', 'playlist'])
    .withMessage('Tipo de item inválido'),
  param('itemId').isMongoId().withMessage('ID de item inválido')
], favoritesController.removeFromFavorites);

// Verificar si está en favoritos
router.get('/check/:itemType/:itemId', [
  param('itemType').isIn(['song', 'album', 'video', 'article', 'concert', 'playlist'])
    .withMessage('Tipo de item inválido'),
  param('itemId').isMongoId().withMessage('ID de item inválido')
], favoritesController.checkFavorite);

// Toggle favorito
router.post('/toggle', favoriteValidations, favoritesController.toggleFavorite);

// Obtener favoritos del usuario
router.get('/', [
  query('itemType').optional().isIn(['song', 'album', 'video', 'article', 'concert', 'playlist'])
    .withMessage('Tipo de item inválido'),
  query('search').optional().isString().withMessage('Búsqueda debe ser string'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating inválido'),
  query('tags').optional().isString().withMessage('Tags debe ser string'),
  query('sortBy').optional().isIn(['addedAt', 'rating', 'itemData.title'])
    .withMessage('Campo de ordenamiento inválido'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Orden inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser positiva'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido')
], favoritesController.getUserFavorites);

// Actualizar favorito
router.put('/:id', [
  param('id').isMongoId().withMessage('ID de favorito inválido'),
  ...updateValidations
], favoritesController.updateFavorite);

// Agregar tags a favorito
router.post('/:id/tags', [
  param('id').isMongoId().withMessage('ID de favorito inválido'),
  body('tags').isArray().withMessage('Tags debe ser un array')
], favoritesController.addTags);

// Remover tags de favorito
router.delete('/:id/tags', [
  param('id').isMongoId().withMessage('ID de favorito inválido'),
  body('tags').isArray().withMessage('Tags debe ser un array')
], favoritesController.removeTags);

// ===== ESTADÍSTICAS Y BÚSQUEDAS =====

// Obtener estadísticas del usuario
router.get('/stats', favoritesController.getUserStats);

// Obtener items populares
router.get('/popular/:itemType', [
  param('itemType').isIn(['song', 'album', 'video', 'article', 'concert', 'playlist'])
    .withMessage('Tipo de item inválido'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite inválido')
], favoritesController.getPopularItems);

// Buscar en favoritos
router.get('/search', [
  query('q').isString().isLength({ min: 1 }).withMessage('Query de búsqueda requerido'),
  query('itemType').optional().isIn(['song', 'album', 'video', 'article', 'concert', 'playlist'])
    .withMessage('Tipo de item inválido'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating inválido'),
  query('tags').optional().isString().withMessage('Tags debe ser string'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido')
], favoritesController.searchFavorites);

// ===== ADMINISTRACIÓN =====

// Sincronizar datos de item (admin)
router.post('/sync/:itemType/:itemId',
  authService.requireAdmin,
  [
    param('itemType').isIn(['song', 'album', 'video', 'article', 'concert', 'playlist'])
      .withMessage('Tipo de item inválido'),
    param('itemId').isMongoId().withMessage('ID de item inválido'),
    body('data').isObject().withMessage('Datos deben ser un objeto')
  ],
  favoritesController.syncItemData
);

// Información de la API
router.get('/api-info', (req, res) => {
  res.json({
    success: true,
    message: 'Favorites API - Sistema completo de favoritos',
    version: '1.0.0',
    endpoints: {
      'POST /': 'Agregar item a favoritos',
      'DELETE /:itemType/:itemId': 'Remover item de favoritos',
      'GET /check/:itemType/:itemId': 'Verificar si está en favoritos',
      'POST /toggle': 'Toggle favorito',
      'GET /': 'Obtener favoritos del usuario (con filtros)',
      'PUT /:id': 'Actualizar favorito',
      'POST /:id/tags': 'Agregar tags',
      'DELETE /:id/tags': 'Remover tags',
      'GET /stats': 'Estadísticas del usuario',
      'GET /popular/:itemType': 'Items populares',
      'GET /search': 'Buscar en favoritos',
      'POST /sync/:itemType/:itemId': 'Sincronizar datos (admin)'
    },
    features: [
      'Almacenamiento en Redis para rendimiento',
      'Cache inteligente con invalidación automática',
      'Búsqueda y filtrado avanzado',
      'Tags y notas personalizadas',
      'Estadísticas y analytics',
      'Notificaciones automáticas',
      'Integración con colas Bull'
    ]
  });
});

module.exports = router;