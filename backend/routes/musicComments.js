/**
 * @swagger
 * tags:
 *   name: Music Comments
 *   description: Endpoints para gestión de comentarios y reseñas de música
 */

const express = require('express');
const { param, body, query } = require('express-validator');
const musicCommentController = require('../controllers/musicCommentController');
const authService = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * /api/music-comments/{targetType}/{targetId}:
 *   get:
 *     summary: Obtener comentarios de un elemento musical
 *     tags: [Music Comments]
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, voteCount]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: includeReplies
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Comentarios obtenidos exitosamente
 */
router.get('/:targetType/:targetId',
  [
    param('targetType').isIn(['album', 'song']).withMessage('Tipo debe ser album o song'),
    param('targetId').isMongoId().withMessage('ID de target inválido'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe ser entre 1 y 50'),
    query('sort').optional().isIn(['createdAt', 'rating', 'voteCount']).withMessage('Sort inválido'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order debe ser asc o desc'),
    query('includeReplies').optional().isBoolean().withMessage('includeReplies debe ser boolean'),
  ],
  musicCommentController.getComments
);

/**
 * @swagger
 * /api/music-comments/{targetType}/{targetId}:
 *   post:
 *     summary: Crear un nuevo comentario/reseña
 *     tags: [Music Comments]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 100
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 100
 *               recommended:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Comentario creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       409:
 *         description: Usuario ya tiene una reseña para este elemento
 */
router.post('/:targetType/:targetId',
  authService.authenticateToken,
  [
    param('targetType').isIn(['album', 'song']).withMessage('Tipo debe ser album o song'),
    param('targetId').isMongoId().withMessage('ID de target inválido'),
    body('title').optional().isLength({ max: 100 }).withMessage('Título muy largo'),
    body('content').isLength({ min: 1, max: 2000 }).withMessage('Contenido requerido (1-2000 caracteres)'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating debe ser entre 1 y 5'),
    body('pros.*').optional().isLength({ max: 100 }).withMessage('Cada pro muy largo'),
    body('cons.*').optional().isLength({ max: 100 }).withMessage('Cada con muy largo'),
    body('recommended').optional().isBoolean().withMessage('Recommended debe ser boolean'),
  ],
  musicCommentController.createComment
);

/**
 * @swagger
 * /api/music-comments/{commentId}/replies:
 *   get:
 *     summary: Obtener respuestas de un comentario
 *     tags: [Music Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *     responses:
 *       200:
 *         description: Respuestas obtenidas exitosamente
 */
router.get('/:commentId/replies',
  [
    param('commentId').isMongoId().withMessage('ID de comentario inválido'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit debe ser entre 1 y 20'),
  ],
  musicCommentController.getCommentReplies
);

/**
 * @swagger
 * /api/music-comments/{commentId}/reply:
 *   post:
 *     summary: Responder a un comentario
 *     tags: [Music Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Respuesta creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/:commentId/reply',
  authService.authenticateToken,
  [
    param('commentId').isMongoId().withMessage('ID de comentario inválido'),
    body('content').isLength({ min: 1, max: 1000 }).withMessage('Contenido requerido (1-1000 caracteres)'),
  ],
  musicCommentController.createReply
);

/**
 * @swagger
 * /api/music-comments/{commentId}/vote:
 *   post:
 *     summary: Votar en un comentario (like/dislike)
 *     tags: [Music Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voteType
 *             properties:
 *               voteType:
 *                 type: string
 *                 enum: [like, dislike]
 *     responses:
 *       200:
 *         description: Voto registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/:commentId/vote',
  authService.authenticateToken,
  [
    param('commentId').isMongoId().withMessage('ID de comentario inválido'),
    body('voteType').isIn(['like', 'dislike']).withMessage('voteType debe ser like o dislike'),
  ],
  musicCommentController.voteComment
);

/**
 * @swagger
 * /api/music-comments/{commentId}/report:
 *   post:
 *     summary: Reportar un comentario
 *     tags: [Music Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       200:
 *         description: Reporte enviado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       409:
 *         description: Ya reportado por este usuario
 */
router.post('/:commentId/report',
  authService.authenticateToken,
  [
    param('commentId').isMongoId().withMessage('ID de comentario inválido'),
    body('reason').isLength({ min: 1, max: 200 }).withMessage('Razón requerida (1-200 caracteres)'),
  ],
  musicCommentController.reportComment
);

/**
 * @swagger
 * /api/music-comments/{commentId}:
 *   put:
 *     summary: Editar un comentario propio
 *     tags: [Music Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Comentario editado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No es el autor del comentario
 *       409:
 *         description: Ya editado anteriormente
 */
router.put('/:commentId',
  authService.authenticateToken,
  [
    param('commentId').isMongoId().withMessage('ID de comentario inválido'),
    body('title').optional().isLength({ max: 100 }).withMessage('Título muy largo'),
    body('content').optional().isLength({ min: 1, max: 2000 }).withMessage('Contenido inválido'),
  ],
  musicCommentController.editComment
);

/**
 * @swagger
 * /api/music-comments/{commentId}:
 *   delete:
 *     summary: Eliminar un comentario propio
 *     tags: [Music Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No es el autor del comentario
 */
router.delete('/:commentId',
  authService.authenticateToken,
  [
    param('commentId').isMongoId().withMessage('ID de comentario inválido'),
  ],
  musicCommentController.deleteComment
);

/**
 * @swagger
 * /api/music-comments/{commentId}/feature:
 *   patch:
 *     summary: Marcar/desmarcar comentario como destacado (solo admin/moderador)
 *     tags: [Music Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featured
 *             properties:
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado de destacado actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de moderador
 */
router.patch('/:commentId/feature',
  authService.authenticateToken,
  authService.requireModerator,
  [
    param('commentId').isMongoId().withMessage('ID de comentario inválido'),
    body('featured').isBoolean().withMessage('featured debe ser boolean'),
  ],
  musicCommentController.toggleFeatured
);

/**
 * @swagger
 * /api/music-comments/{commentId}/moderate:
 *   patch:
 *     summary: Moderar comentario (solo admin/moderador)
 *     tags: [Music Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, hidden]
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       200:
 *         description: Comentario moderado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de moderador
 */
router.patch('/:commentId/moderate',
  authService.authenticateToken,
  authService.requireModerator,
  [
    param('commentId').isMongoId().withMessage('ID de comentario inválido'),
    body('status').isIn(['approved', 'rejected', 'hidden']).withMessage('Status inválido'),
    body('reason').optional().isLength({ max: 200 }).withMessage('Razón muy larga'),
  ],
  musicCommentController.moderateComment
);

module.exports = router;