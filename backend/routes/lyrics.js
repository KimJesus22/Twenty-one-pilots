const express = require('express');
const { query, param, body } = require('express-validator');
const lyricsController = require('../controllers/lyricsController');
const authService = require('../services/authService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authService.authenticateToken);

// Validaciones
const lyricsValidations = [
  query('artist').isString().isLength({ min: 1 }).withMessage('Artista requerido'),
  query('title').isString().isLength({ min: 1 }).withMessage('Título requerido'),
  query('lang').optional().isIn(['es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'])
    .withMessage('Idioma no soportado')
];

const translationValidations = [
  body('lyrics').isString().isLength({ min: 1 }).withMessage('Letras requeridas'),
  body('fromLang').optional().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'])
    .withMessage('Idioma de origen no soportado'),
  body('toLang').optional().isIn(['es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'])
    .withMessage('Idioma de destino no soportado')
];

const searchValidations = [
  query('q').isString().isLength({ min: 1 }).withMessage('Término de búsqueda requerido'),
  query('artist').optional().isString().withMessage('Artista debe ser string'),
  query('album').optional().isString().withMessage('Álbum debe ser string'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite inválido')
];

const favoriteLyricsValidations = [
  body('songId').optional().isMongoId().withMessage('ID de canción inválido'),
  body('artist').isString().isLength({ min: 1 }).withMessage('Artista requerido'),
  body('title').isString().isLength({ min: 1 }).withMessage('Título requerido'),
  body('lyrics').isString().isLength({ min: 1 }).withMessage('Letras requeridas'),
  body('source').optional().isIn(['musixmatch', 'genius']).withMessage('Fuente inválida'),
  body('tags').optional().isArray().withMessage('Tags debe ser un array'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notas muy largas')
];

// ===== RUTAS DE LETRAS =====

// Obtener letras de una canción
router.get('/', lyricsValidations, lyricsController.getLyrics);

// Traducir letras
router.post('/translate', translationValidations, lyricsController.translateLyrics);

// Buscar canciones
router.get('/search', searchValidations, lyricsController.searchSongs);

// Obtener información de artista
router.get('/artist/:artistName', [
  param('artistName').isString().isLength({ min: 1 }).withMessage('Nombre de artista requerido')
], lyricsController.getArtistInfo);

// ===== FAVORITOS DE LETRAS =====

// Agregar letras a favoritos
router.post('/favorites', favoriteLyricsValidations, lyricsController.addLyricsToFavorites);

// Verificar si letras están en favoritos
router.get('/favorites/check/:artist/:title', [
  param('artist').isString().withMessage('Artista requerido'),
  param('title').isString().withMessage('Título requerido')
], lyricsController.checkLyricsFavorite);

// Verificar por songId
router.get('/favorites/check/:songId', [
  param('songId').isMongoId().withMessage('ID de canción inválido')
], lyricsController.checkLyricsFavorite);

// Obtener letras favoritas del usuario
router.get('/favorites', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser positiva'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite inválido'),
  query('search').optional().isString().withMessage('Búsqueda debe ser string')
], lyricsController.getFavoriteLyrics);

// ===== UTILIDADES =====

// Obtener idiomas soportados
router.get('/languages', lyricsController.getSupportedLanguages);

// Obtener estadísticas de uso
router.get('/stats', lyricsController.getLyricsStats);

// Verificar estado de APIs
router.get('/api-status', lyricsController.checkAPIStatus);

// Obtener sugerencias de búsqueda
router.get('/suggestions', [
  query('q').isString().isLength({ min: 1 }).withMessage('Query requerido'),
  query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Límite inválido')
], lyricsController.getSearchSuggestions);

// Obtener letras populares
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Límite inválido')
], lyricsController.getPopularLyrics);

// ===== ADMINISTRACIÓN =====

// Limpiar caché de letras (admin)
router.post('/admin/clear-cache',
  authService.requireAdmin,
  async (req, res) => {
    try {
      await require('../services/lyricsService').clearLyricsCache();
      res.json({
        success: true,
        message: 'Cache de letras limpiado exitosamente'
      });
    } catch (error) {
      logger.error('Error limpiando cache de letras:', error);
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
    message: 'Lyrics API - Sistema completo de letras y traducciones',
    version: '1.0.0',
    endpoints: {
      'GET /': 'Obtener letras de canción',
      'POST /translate': 'Traducir letras',
      'GET /search': 'Buscar canciones',
      'GET /artist/:artistName': 'Información de artista',
      'POST /favorites': 'Agregar letras a favoritos',
      'GET /favorites/check/*': 'Verificar favorito',
      'GET /favorites': 'Obtener letras favoritas',
      'GET /languages': 'Idiomas soportados',
      'GET /stats': 'Estadísticas de uso',
      'GET /api-status': 'Estado de APIs',
      'GET /suggestions': 'Sugerencias de búsqueda',
      'GET /popular': 'Letras populares'
    },
    apis: {
      musixmatch: {
        enabled: !!process.env.MUSIXMATCH_API_KEY,
        features: ['letras completas', 'búsqueda avanzada']
      },
      genius: {
        enabled: !!process.env.GENIUS_ACCESS_TOKEN,
        features: ['letras completas', 'URLs de canciones']
      }
    },
    features: [
      'Traducción automática a 11 idiomas',
      'Búsqueda por artista y álbum',
      'Cache inteligente con Redis',
      'Integración con favoritos',
      'Sugerencias de autocompletado',
      'Estadísticas de uso',
      'Soporte multi-API'
    ],
    supportedLanguages: [
      'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
    ]
  });
});

module.exports = router;