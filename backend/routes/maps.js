const express = require('express');
const { query, param, body } = require('express-validator');
const mapsController = require('../controllers/mapsController');
const authService = require('../services/authService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authService.authenticateToken);

// Validaciones
const geocodeValidations = [
  query('address').isString().isLength({ min: 1 }).withMessage('Dirección requerida')
];

const reverseGeocodeValidations = [
  query('lng').isFloat().withMessage('Longitud requerida'),
  query('lat').isFloat().withMessage('Latitud requerida')
];

const routeValidations = [
  query('originLng').isFloat().withMessage('Longitud de origen requerida'),
  query('originLat').isFloat().withMessage('Latitud de origen requerida'),
  query('destLng').isFloat().withMessage('Longitud de destino requerida'),
  query('destLat').isFloat().withMessage('Latitud de destino requerida'),
  query('profile').optional().isIn(['driving', 'walking', 'cycling']).withMessage('Perfil inválido')
];

const nearbyValidations = [
  query('lng').isFloat().withMessage('Longitud requerida'),
  query('lat').isFloat().withMessage('Latitud requerida'),
  query('radius').optional().isInt({ min: 100, max: 50000 }).withMessage('Radio inválido'),
  query('types').optional().isString().withMessage('Tipos debe ser string'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite inválido')
];

const customMapValidations = [
  body('layers').isArray({ min: 1 }).withMessage('Se requieren capas'),
  body('layers.*.id').isString().withMessage('ID de capa requerido'),
  body('layers.*.type').optional().isIn(['circle', 'fill', 'line', 'symbol']).withMessage('Tipo de capa inválido'),
  body('layers.*.features').optional().isArray().withMessage('Features debe ser array'),
  body('style').optional().isString().withMessage('Estilo debe ser string'),
  body('center').optional().isArray().withMessage('Centro debe ser array'),
  body('zoom').optional().isInt({ min: 0, max: 22 }).withMessage('Zoom inválido')
];

const favoriteLocationValidations = [
  body('locationId').isString().isLength({ min: 1 }).withMessage('ID de ubicación requerido'),
  body('name').isString().isLength({ min: 1 }).withMessage('Nombre requerido'),
  body('coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordenadas requeridas'),
  body('coordinates.*').isFloat().withMessage('Coordenadas deben ser números'),
  body('type').optional().isIn(['store', 'venue', 'location', 'event']).withMessage('Tipo inválido'),
  body('description').optional().isString().withMessage('Descripción debe ser string'),
  body('tags').optional().isArray().withMessage('Tags debe ser array'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notas muy largas')
];

const autocompleteValidations = [
  query('q').isString().isLength({ min: 1 }).withMessage('Query requerido'),
  query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Límite inválido'),
  query('country').optional().isString().withMessage('País debe ser string'),
  query('types').optional().isString().withMessage('Tipos debe ser string')
];

// ===== RUTAS DE GEOCODING =====

// Geocodificar dirección
router.get('/geocode', geocodeValidations, mapsController.geocodeAddress);

// Reverse geocoding
router.get('/reverse-geocode', reverseGeocodeValidations, mapsController.reverseGeocode);

// ===== RUTAS DE RUTAS =====

// Calcular ruta
router.get('/route', routeValidations, mapsController.getRoute);

// ===== RUTAS DE LUGARES =====

// Lugares cercanos
router.get('/nearby/places', nearbyValidations, mapsController.getNearbyPlaces);

// Eventos cercanos
router.get('/nearby/events', nearbyValidations, mapsController.getNearbyEvents);

// ===== RUTAS DE TWENTY ONE PILOTS =====

// Ubicaciones oficiales de TOP
router.get('/top-locations', mapsController.getTOPLocations);

// ===== RUTAS DE MAPAS PERSONALIZADOS =====

// Crear mapa personalizado
router.post('/custom', customMapValidations, mapsController.createCustomMap);

// ===== FAVORITOS DE UBICACIONES =====

// Agregar ubicación a favoritos
router.post('/favorites', favoriteLocationValidations, mapsController.addLocationToFavorites);

// Verificar si ubicación está en favoritos
router.get('/favorites/check/:locationId', [
  param('locationId').isString().withMessage('ID de ubicación requerido')
], mapsController.checkLocationFavorite);

// Obtener ubicaciones favoritas
router.get('/favorites', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser positiva'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite inválido'),
  query('type').optional().isString().withMessage('Tipo debe ser string')
], mapsController.getFavoriteLocations);

// ===== UTILIDADES =====

// Autocompletado
router.get('/autocomplete', autocompleteValidations, mapsController.getAutocompleteSuggestions);

// Verificar estado de Mapbox
router.get('/status', mapsController.checkMapboxStatus);

// Estadísticas de mapas
router.get('/stats', mapsController.getMapsStats);

// ===== NOTIFICACIONES DE UBICACIÓN =====

// Configurar notificaciones de ubicación
router.put('/notifications/preferences', [
  body('enabled').optional().isBoolean().withMessage('Enabled debe ser booleano'),
  body('radius').optional().isInt({ min: 1000, max: 100000 }).withMessage('Radio inválido'),
  body('types').optional().isArray().withMessage('Types debe ser array')
], mapsController.configureLocationNotifications);

// Obtener preferencias de notificaciones
router.get('/notifications/preferences', mapsController.getLocationNotificationPreferences);

// ===== ADMINISTRACIÓN =====

// Limpiar caché de mapas (admin)
router.post('/admin/clear-cache',
  authService.requireAdmin,
  async (req, res) => {
    try {
      await require('../services/mapsService').clearMapsCache();
      res.json({
        success: true,
        message: 'Cache de mapas limpiado exitosamente'
      });
    } catch (error) {
      logger.error('Error limpiando cache de mapas:', error);
      res.status(500).json({
        success: false,
        message: 'Error limpiando cache'
      });
    }
  }
);

// Información de la API
router.get('/api-info', (req, res) => {
  res.json({
    success: true,
    message: 'Maps API - Sistema completo de mapas interactivos',
    version: '1.0.0',
    endpoints: {
      'GET /geocode': 'Geocodificar dirección',
      'GET /reverse-geocode': 'Reverse geocoding',
      'GET /route': 'Calcular ruta',
      'GET /nearby/places': 'Lugares cercanos',
      'GET /nearby/events': 'Eventos cercanos',
      'GET /top-locations': 'Ubicaciones de Twenty One Pilots',
      'POST /custom': 'Crear mapa personalizado',
      'POST /favorites': 'Agregar ubicación a favoritos',
      'GET /favorites/check/:id': 'Verificar favorito',
      'GET /favorites': 'Obtener ubicaciones favoritas',
      'GET /autocomplete': 'Sugerencias de autocompletado',
      'GET /status': 'Estado de Mapbox',
      'GET /stats': 'Estadísticas de mapas',
      'PUT /notifications/preferences': 'Configurar notificaciones',
      'GET /notifications/preferences': 'Obtener preferencias'
    },
    features: [
      'Geocoding y reverse geocoding',
      'Cálculo de rutas (driving, walking, cycling)',
      'Lugares y eventos cercanos',
      'Ubicaciones oficiales de Twenty One Pilots',
      'Mapas personalizables con capas',
      'Integración con favoritos',
      'Notificaciones push para eventos cercanos',
      'Autocompletado inteligente',
      'Cache distribuido con Redis',
      'Soporte para múltiples estilos de mapa'
    ],
    supportedProfiles: ['driving', 'walking', 'cycling'],
    supportedTypes: ['poi', 'address', 'place', 'store', 'venue', 'event'],
    locationTypes: ['store', 'venue', 'location', 'event'],
    mapStyles: [
      'mapbox://styles/mapbox/streets-v11',
      'mapbox://styles/mapbox/outdoors-v11',
      'mapbox://styles/mapbox/light-v10',
      'mapbox://styles/mapbox/dark-v10',
      'mapbox://styles/mapbox/satellite-v9'
    ]
  });
});

module.exports = router;