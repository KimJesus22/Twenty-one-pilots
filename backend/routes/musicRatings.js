/**
 * @swagger
 * tags:
 *   name: Music Ratings
 *   description: Endpoints para gestión de valoraciones de música
 */

const express = require('express');
const { param, body } = require('express-validator');
const musicRatingController = require('../controllers/musicRatingController');
const authService = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * /api/music-ratings/{targetType}/{targetId}:
 *   post:
 *     summary: Crear o actualizar una valoración
 *     tags: [Music Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [album, song]
 *         description: Tipo de elemento a valorar
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del elemento a valorar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Valoración con estrellas (1-5)
 *     responses:
 *       200:
 *         description: Valoración creada/actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Elemento no encontrado
 */
router.post('/:targetType/:targetId',
  authService.authenticateToken,
  [
    param('targetType').isIn(['album', 'song']).withMessage('Tipo debe ser album o song'),
    param('targetId').isMongoId().withMessage('ID de target inválido'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe ser entre 1 y 5'),
  ],
  musicRatingController.createOrUpdateRating
);

/**
 * @swagger
 * /api/music-ratings/{targetType}/{targetId}/user:
 *   get:
 *     summary: Obtener valoración del usuario actual
 *     tags: [Music Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [album, song]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Valoración obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Valoración no encontrada
 */
router.get('/:targetType/:targetId/user',
  authService.authenticateToken,
  [
    param('targetType').isIn(['album', 'song']).withMessage('Tipo debe ser album o song'),
    param('targetId').isMongoId().withMessage('ID de target inválido'),
  ],
  musicRatingController.getUserRating
);

/**
 * @swagger
 * /api/music-ratings/{targetType}/{targetId}/stats:
 *   get:
 *     summary: Obtener estadísticas de valoraciones
 *     tags: [Music Ratings]
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [album, song]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       404:
 *         description: Elemento no encontrado
 */
router.get('/:targetType/:targetId/stats',
  [
    param('targetType').isIn(['album', 'song']).withMessage('Tipo debe ser album o song'),
    param('targetId').isMongoId().withMessage('ID de target inválido'),
  ],
  musicRatingController.getRatingStats
);

/**
 * @swagger
 * /api/music-ratings/{targetType}/{targetId}:
 *   delete:
 *     summary: Eliminar valoración del usuario
 *     tags: [Music Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [album, song]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Valoración eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Valoración no encontrada
 */
router.delete('/:targetType/:targetId',
  authService.authenticateToken,
  [
    param('targetType').isIn(['album', 'song']).withMessage('Tipo debe ser album o song'),
    param('targetId').isMongoId().withMessage('ID de target inválido'),
  ],
  musicRatingController.deleteUserRating
);

module.exports = router;