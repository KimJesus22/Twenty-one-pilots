const express = require('express');
const { param, query } = require('express-validator');
const albumMetricsController = require('../controllers/albumMetricsController');
const authService = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Album Metrics
 *   description: Endpoints para métricas y estadísticas de álbumes
 */

/**
 * @swagger
 * /api/albums/{albumId}/metrics:
 *   get:
 *     summary: Obtener métricas históricas de un álbum
 *     tags: [Album Metrics]
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [popularity, views, likes, playCount, rating, streams, downloads, sales]
 *           default: popularity
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [manual, spotify, youtube, apple_music, deezer, api]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Métricas obtenidas exitosamente
 *       404:
 *         description: Álbum no encontrado
 */
router.get('/:albumId/metrics',
  [
    param('albumId').isMongoId().withMessage('ID de álbum inválido'),
    query('metric').optional().isIn(['popularity', 'views', 'likes', 'playCount', 'rating', 'streams', 'downloads', 'sales']).withMessage('Métrica inválida'),
    query('startDate').optional().isISO8601().withMessage('Fecha de inicio inválida'),
    query('endDate').optional().isISO8601().withMessage('Fecha de fin inválida'),
    query('source').optional().isIn(['manual', 'spotify', 'youtube', 'apple_music', 'deezer', 'api']).withMessage('Fuente inválida'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit debe ser entre 1 y 1000'),
  ],
  albumMetricsController.getAlbumMetrics
);

/**
 * @swagger
 * /api/albums/metrics/compare:
 *   get:
 *     summary: Comparar métricas de múltiples álbumes
 *     tags: [Album Metrics]
 *     parameters:
 *       - in: query
 *         name: albumIds
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [popularity, views, likes, playCount, rating, streams, downloads, sales]
 *           default: popularity
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Comparación obtenida exitosamente
 */
router.get('/metrics/compare',
  [
    query('albumIds').isArray().withMessage('albumIds debe ser un array'),
    query('albumIds.*').isMongoId().withMessage('ID de álbum inválido'),
    query('metric').optional().isIn(['popularity', 'views', 'likes', 'playCount', 'rating', 'streams', 'downloads', 'sales']).withMessage('Métrica inválida'),
    query('startDate').optional().isISO8601().withMessage('Fecha de inicio inválida'),
    query('endDate').optional().isISO8601().withMessage('Fecha de fin inválida'),
    query('source').optional().isIn(['manual', 'spotify', 'youtube', 'apple_music', 'deezer', 'api']).withMessage('Fuente inválida'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit debe ser entre 1 y 500'),
  ],
  albumMetricsController.getMultipleAlbumsMetrics
);

/**
 * @swagger
 * /api/albums/{albumId}/metrics/current:
 *   get:
 *     summary: Obtener métricas actuales de un álbum
 *     tags: [Album Metrics]
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Métricas actuales obtenidas exitosamente
 *       404:
 *         description: Álbum no encontrado
 */
router.get('/:albumId/metrics/current',
  [
    param('albumId').isMongoId().withMessage('ID de álbum inválido'),
  ],
  albumMetricsController.getCurrentAlbumMetrics
);

/**
 * @swagger
 * /api/albums/{albumId}/metrics/stats:
 *   get:
 *     summary: Obtener estadísticas de crecimiento de un álbum
 *     tags: [Album Metrics]
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/:albumId/metrics/stats',
  [
    param('albumId').isMongoId().withMessage('ID de álbum inválido'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Días debe ser entre 1 y 365'),
  ],
  albumMetricsController.getMetricsStats
);

/**
 * @swagger
 * /api/albums/{albumId}/metrics/snapshot:
 *   post:
 *     summary: Crear snapshot de métricas actuales (solo administradores)
 *     tags: [Album Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *                 enum: [manual, spotify, youtube, apple_music, deezer, api]
 *                 default: manual
 *     responses:
 *       201:
 *         description: Snapshot creado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Álbum no encontrado
 */
router.post('/:albumId/metrics/snapshot',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    param('albumId').isMongoId().withMessage('ID de álbum inválido'),
  ],
  albumMetricsController.createMetricsSnapshot
);

module.exports = router;