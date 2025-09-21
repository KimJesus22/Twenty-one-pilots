const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const spotifyService = require('../services/spotifyService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en Spotify:', {
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

// Middleware para verificar token de Spotify (simplificado)
const requireSpotifyAuth = async (req, res, next) => {
  try {
    const isValid = await spotifyService.isAccessTokenValid();
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Token de Spotify inválido o expirado'
      });
    }
    next();
  } catch (error) {
    logger.error('Error verificando token de Spotify:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar URL de autorización
router.get('/authorize', (req, res) => {
  try {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read'
    ];
    const state = req.query.state || 'spotify_integration';
    const authorizeURL = spotifyService.generateAuthorizeURL(scopes, state);

    res.json({
      success: true,
      authorizeURL
    });
  } catch (error) {
    logger.error('Error generando URL de autorización:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando URL de autorización'
    });
  }
});

// Callback para intercambiar código por tokens
router.post('/callback', [
  body('code').isString().notEmpty().withMessage('Código de autorización requerido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { code } = req.body;
    const tokens = await spotifyService.authorizationCodeGrant(code);

    res.json({
      success: true,
      message: 'Autenticación exitosa',
      tokens
    });
  } catch (error) {
    logger.error('Error en callback de Spotify:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación'
    });
  }
});

// Refrescar token de acceso
router.post('/refresh-token', async (req, res) => {
  try {
    const tokens = await spotifyService.refreshAccessToken();

    res.json({
      success: true,
      message: 'Token refrescado exitosamente',
      tokens
    });
  } catch (error) {
    logger.error('Error refrescando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error refrescando token'
    });
  }
});

// Obtener perfil del usuario actual
router.get('/me', requireSpotifyAuth, async (req, res) => {
  try {
    const profile = await spotifyService.getCurrentUserProfile();

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo perfil de usuario'
    });
  }
});

// Obtener playlists del usuario actual
router.get('/playlists', requireSpotifyAuth, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset debe ser positivo'),
  handleValidationErrors
], async (req, res) => {
  try {
    const options = {};
    if (req.query.limit) options.limit = parseInt(req.query.limit);
    if (req.query.offset) options.offset = parseInt(req.query.offset);

    const playlists = await spotifyService.getCurrentUserPlaylists(options);

    res.json({
      success: true,
      data: playlists
    });
  } catch (error) {
    logger.error('Error obteniendo playlists:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo playlists'
    });
  }
});

// Obtener detalles de una playlist específica
router.get('/playlists/:id', requireSpotifyAuth, [
  param('id').isString().notEmpty().withMessage('ID de playlist requerido'),
  query('fields').optional().isString().withMessage('Fields debe ser una cadena'),
  handleValidationErrors
], async (req, res) => {
  try {
    const options = {};
    if (req.query.fields) options.fields = req.query.fields;

    const playlist = await spotifyService.getPlaylist(req.params.id, options);

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    logger.error('Error obteniendo playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo playlist'
    });
  }
});

// Obtener metadata de una pista
router.get('/tracks/:id', requireSpotifyAuth, [
  param('id').isString().notEmpty().withMessage('ID de pista requerido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const track = await spotifyService.getTrack(req.params.id);

    res.json({
      success: true,
      data: track
    });
  } catch (error) {
    logger.error('Error obteniendo pista:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pista'
    });
  }
});

// Obtener features de audio de una pista
router.get('/tracks/:id/audio-features', requireSpotifyAuth, [
  param('id').isString().notEmpty().withMessage('ID de pista requerido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const audioFeatures = await spotifyService.getAudioFeatures(req.params.id);

    res.json({
      success: true,
      data: audioFeatures
    });
  } catch (error) {
    logger.error('Error obteniendo features de audio:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo features de audio'
    });
  }
});

// Buscar en Spotify
router.get('/search', requireSpotifyAuth, [
  query('q').isString().notEmpty().withMessage('Término de búsqueda requerido'),
  query('type').optional().isIn(['track', 'artist', 'album', 'playlist']).withMessage('Tipo inválido'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { q, type = 'track', limit = 20 } = req.query;
    const types = type.split(',');

    const results = await spotifyService.search(q, types, { limit: parseInt(limit) });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda'
    });
  }
});

// Obtener recomendaciones
router.get('/recommendations', requireSpotifyAuth, [
  query('seed_tracks').optional().isString().withMessage('Seed tracks debe ser una cadena'),
  query('seed_artists').optional().isString().withMessage('Seed artists debe ser una cadena'),
  query('seed_genres').optional().isString().withMessage('Seed genres debe ser una cadena'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
  handleValidationErrors
], async (req, res) => {
  try {
    const options = {};

    if (req.query.seed_tracks) options.seed_tracks = req.query.seed_tracks.split(',');
    if (req.query.seed_artists) options.seed_artists = req.query.seed_artists.split(',');
    if (req.query.seed_genres) options.seed_genres = req.query.seed_genres.split(',');
    if (req.query.limit) options.limit = parseInt(req.query.limit);

    const recommendations = await spotifyService.getRecommendations(options);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Error obteniendo recomendaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo recomendaciones'
    });
  }
});

module.exports = router;