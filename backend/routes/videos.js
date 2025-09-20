/**
 * Rutas de videos para la aplicación Twenty One Pilots
 * Utiliza el controlador de videos para manejar todas las operaciones
 *
 * @author KimJesus21
 * @version 2.0.0
 * @since 2025-09-20
 */

const express = require('express');
const { query, param } = require('express-validator');
const videoController = require('../controllers/videoController');
const logger = require('../utils/logger');

const router = express.Router();

// Ruta para validar API key de YouTube
router.get('/test-api', videoController.validateApiKey);

// Ruta para buscar videos de YouTube
router.get('/search',
  [
    query('q').optional().isString().withMessage('Query debe ser un string'),
    query('maxResults').optional().isInt({ min: 1, max: 50 }).withMessage('maxResults debe ser entre 1 y 50'),
  ],
  videoController.searchVideos
);

// Ruta para obtener detalles de un video específico
router.get('/:id',
  [
    param('id').isString().notEmpty().withMessage('ID de video requerido'),
  ],
  videoController.getVideoDetails
);

// Ruta para obtener videos relacionados
router.get('/:id/related',
  [
    param('id').isString().notEmpty().withMessage('ID de video requerido'),
    query('maxResults').optional().isInt({ min: 1, max: 10 }).withMessage('maxResults debe ser entre 1 y 10'),
  ],
  videoController.getRelatedVideos
);

// Rutas adicionales del controlador

// Obtener videos de un canal específico
router.get('/channel/:channelId',
  [
    param('channelId').isString().notEmpty().withMessage('ID de canal requerido'),
    query('maxResults').optional().isInt({ min: 1, max: 50 }).withMessage('maxResults debe ser entre 1 y 50'),
  ],
  videoController.getChannelVideos
);

// Obtener información de un canal
router.get('/channel/:channelId/info',
  [
    param('channelId').isString().notEmpty().withMessage('ID de canal requerido'),
  ],
  videoController.getChannelInfo
);

// Obtener videos populares de la base de datos
router.get('/popular',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit debe ser entre 1 y 50'),
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
  ],
  videoController.getPopularVideos
);

// Obtener videos recientes de la base de datos
router.get('/recent',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit debe ser entre 1 y 50'),
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número positivo'),
  ],
  videoController.getRecentVideos
);

// Asociar video con canción (requiere autenticación)
router.post('/:videoId/song/:songId',
  [
    param('videoId').isString().notEmpty().withMessage('ID de video requerido'),
    param('songId').isMongoId().withMessage('ID de canción inválido'),
  ],
  videoController.associateVideoWithSong
);

// Asociar video con álbum (requiere autenticación)
router.post('/:videoId/album/:albumId',
  [
    param('videoId').isString().notEmpty().withMessage('ID de video requerido'),
    param('albumId').isMongoId().withMessage('ID de álbum inválido'),
  ],
  videoController.associateVideoWithAlbum
);

// Obtener estadísticas del servicio de videos
router.get('/stats/service', videoController.getServiceStats);

module.exports = router;