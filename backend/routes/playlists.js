/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Endpoints para gestión de playlists personalizadas
 */

const express = require('express');
const { param, body, query } = require('express-validator');
const playlistController = require('../controllers/playlistController');
const authService = require('../services/authService');

const router = express.Router();

/**
 * @swagger
 * /api/playlists:
 *   post:
 *     summary: Crear una nueva playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *                 enum: [favorites, workout, party, study, custom]
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *               isCollaborative:
 *                 type: boolean
 *                 default: false
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               coverImage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Playlist creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/',
  authService.authenticateToken,
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Nombre requerido (1-100 caracteres)'),
    body('description').optional().isLength({ max: 500 }).withMessage('Descripción muy larga'),
    body('tags.*').optional().isLength({ max: 50 }).withMessage('Tag muy largo'),
    body('category').optional().isIn(['favorites', 'workout', 'party', 'study', 'custom']).withMessage('Categoría inválida'),
    body('isPublic').optional().isBoolean().withMessage('isPublic debe ser boolean'),
    body('isCollaborative').optional().isBoolean().withMessage('isCollaborative debe ser boolean'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating debe ser entre 1 y 5'),
    body('coverImage').optional().isURL().withMessage('URL de imagen inválida'),
  ],
  playlistController.createPlaylist
);

/**
 * @swagger
 * /api/playlists:
 *   get:
 *     summary: Obtener playlists del usuario autenticado
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [favorites, workout, party, study, custom, all]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, playCount]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Playlists obtenidas exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/',
  authService.authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe ser entre 1 y 50'),
    query('category').optional().isIn(['favorites', 'workout', 'party', 'study', 'custom', 'all']).withMessage('Categoría inválida'),
    query('sort').optional().isIn(['createdAt', 'updatedAt', 'name', 'playCount']).withMessage('Campo de ordenamiento inválido'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Orden debe ser asc o desc'),
  ],
  playlistController.getUserPlaylists
);

/**
 * @swagger
 * /api/playlists/public:
 *   get:
 *     summary: Obtener playlists públicas
 *     tags: [Playlists]
 *     parameters:
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [favorites, workout, party, study, custom, all]
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           description: Tags separados por coma
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, likes, playCount, viewCount]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Playlists públicas obtenidas exitosamente
 */
router.get('/public',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe ser entre 1 y 50'),
    query('category').optional().isIn(['favorites', 'workout', 'party', 'study', 'custom', 'all']).withMessage('Categoría inválida'),
    query('sort').optional().isIn(['createdAt', 'likes', 'playCount', 'viewCount']).withMessage('Campo de ordenamiento inválido'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Orden debe ser asc o desc'),
  ],
  playlistController.getPublicPlaylists
);

/**
 * @swagger
 * /api/playlists/{playlistId}:
 *   get:
 *     summary: Obtener playlist por ID
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para ver la playlist
 *       404:
 *         description: Playlist no encontrada
 */
router.get('/:playlistId',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
  ],
  playlistController.getPlaylistById
);

/**
 * @swagger
 * /api/playlists/{playlistId}:
 *   put:
 *     summary: Actualizar playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
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
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *                 enum: [favorites, workout, party, study, custom]
 *               isPublic:
 *                 type: boolean
 *               isCollaborative:
 *                 type: boolean
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               coverImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Playlist actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para editar
 *       404:
 *         description: Playlist no encontrada
 */
router.put('/:playlistId',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Nombre inválido (1-100 caracteres)'),
    body('description').optional().isLength({ max: 500 }).withMessage('Descripción muy larga'),
    body('tags.*').optional().isLength({ max: 50 }).withMessage('Tag muy largo'),
    body('category').optional().isIn(['favorites', 'workout', 'party', 'study', 'custom']).withMessage('Categoría inválida'),
    body('isPublic').optional().isBoolean().withMessage('isPublic debe ser boolean'),
    body('isCollaborative').optional().isBoolean().withMessage('isCollaborative debe ser boolean'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating debe ser entre 1 y 5'),
    body('coverImage').optional().isURL().withMessage('URL de imagen inválida'),
  ],
  playlistController.updatePlaylist
);

/**
 * @swagger
 * /api/playlists/{playlistId}:
 *   delete:
 *     summary: Eliminar playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo el propietario puede eliminar
 *       404:
 *         description: Playlist no encontrada
 */
router.delete('/:playlistId',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
  ],
  playlistController.deletePlaylist
);

/**
 * @swagger
 * /api/playlists/{playlistId}/videos:
 *   post:
 *     summary: Agregar video a playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
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
 *               - videoId
 *             properties:
 *               videoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para editar
 *       404:
 *         description: Playlist o video no encontrado
 */
router.post('/:playlistId/videos',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    body('videoId').isMongoId().withMessage('ID de video inválido'),
  ],
  playlistController.addVideoToPlaylist
);

/**
 * @swagger
 * /api/playlists/{playlistId}/videos/{videoId}:
 *   delete:
 *     summary: Quitar video de playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video removido exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para editar
 *       404:
 *         description: Playlist no encontrada
 */
router.delete('/:playlistId/videos/:videoId',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    param('videoId').isMongoId().withMessage('ID de video inválido'),
  ],
  playlistController.removeVideoFromPlaylist
);

/**
 * @swagger
 * /api/playlists/{playlistId}/reorder:
 *   put:
 *     summary: Reordenar videos en playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
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
 *               - videoOrder
 *             properties:
 *               videoOrder:
 *                 type: object
 *                 description: Objeto con videoId como clave y orden como valor
 *                 example: {"60d5ecb74b24c72b8c8b4567": 1, "60d5ecb74b24c72b8c8b4568": 2}
 *     responses:
 *       200:
 *         description: Videos reordenados exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para editar
 *       404:
 *         description: Playlist no encontrada
 */
router.put('/:playlistId/reorder',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    body('videoOrder').isObject().withMessage('videoOrder debe ser un objeto'),
  ],
  playlistController.reorderPlaylistVideos
);

/**
 * @swagger
 * /api/playlists/{playlistId}/like:
 *   post:
 *     summary: Dar/quitar like a playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like procesado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Playlist no encontrada
 */
router.post('/:playlistId/like',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
  ],
  playlistController.togglePlaylistLike
);

/**
 * @swagger
 * /api/playlists/{playlistId}/collaborators:
 *   post:
 *     summary: Agregar colaborador a playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [viewer, editor, admin]
 *                 default: viewer
 *     responses:
 *       200:
 *         description: Colaborador agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo el propietario puede gestionar colaboradores
 *       404:
 *         description: Playlist o usuario no encontrado
 */
router.post('/:playlistId/collaborators',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    body('userId').isMongoId().withMessage('ID de usuario inválido'),
    body('role').optional().isIn(['viewer', 'editor', 'admin']).withMessage('Rol inválido'),
  ],
  playlistController.addCollaborator
);

/**
 * @swagger
 * /api/playlists/{playlistId}/share:
 *   put:
 *     summary: Actualizar configuración de compartir
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
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
 *               isEnabled:
 *                 type: boolean
 *               allowCopy:
 *                 type: boolean
 *               password:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               maxViews:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para editar
 *       404:
 *         description: Playlist no encontrada
 */
router.put('/:playlistId/share',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    body('isEnabled').optional().isBoolean().withMessage('isEnabled debe ser boolean'),
    body('allowCopy').optional().isBoolean().withMessage('allowCopy debe ser boolean'),
    body('password').optional().isLength({ min: 4, max: 50 }).withMessage('Contraseña debe tener 4-50 caracteres'),
    body('expiresAt').optional().isISO8601().withMessage('Fecha de expiración inválida'),
    body('maxViews').optional().isInt({ min: 1 }).withMessage('maxViews debe ser un entero positivo'),
  ],
  playlistController.updateShareSettings
);

/**
 * @swagger
 * /api/playlists/shared/{shareUrl}:
 *   get:
 *     summary: Obtener playlist compartida por URL
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: shareUrl
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist compartida obtenida exitosamente
 *       404:
 *         description: Playlist no encontrada
 *       410:
 *         description: Enlace expirado o límite alcanzado
 */
router.get('/shared/:shareUrl',
  [
    param('shareUrl').isLength({ min: 1 }).withMessage('URL de compartir requerida'),
  ],
  playlistController.getSharedPlaylist
);

/**
 * @swagger
 * /api/playlists/{playlistId}/export:
 *   get:
 *     summary: Exportar playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json]
 *           default: json
 *     responses:
 *       200:
 *         description: Playlist exportada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para exportar
 *       404:
 *         description: Playlist no encontrada
 */
router.get('/:playlistId/export',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    query('format').optional().isIn(['json']).withMessage('Formato inválido'),
  ],
  playlistController.exportPlaylist
);

/**
 * @swagger
 * /api/playlists/import:
 *   post:
 *     summary: Importar playlist desde JSON
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   rating:
 *                     type: integer
 *                   videos:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                         youtubeId:
 *                           type: string
 *                         spotifyId:
 *                           type: string
 *     responses:
 *       201:
 *         description: Playlist importada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/import',
  authService.authenticateToken,
  [
    body('data').isObject().withMessage('Datos de importación requeridos'),
    body('data.name').isLength({ min: 1, max: 100 }).withMessage('Nombre requerido'),
  ],
  playlistController.importPlaylist
);

/**
 * @swagger
 * /api/playlists/{playlistId}/stats:
 *   get:
 *     summary: Obtener estadísticas de playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para ver estadísticas
 *       404:
 *         description: Playlist no encontrada
 */
router.get('/:playlistId/stats',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
  ],
  playlistController.getPlaylistStats
);

/**
 * @swagger
 * /api/playlists/{playlistId}/audit:
 *   get:
 *     summary: Obtener log de auditoría de playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Log de auditoría obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo el propietario puede ver el log
 *       404:
 *         description: Playlist no encontrada
 */
router.get('/:playlistId/audit',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe ser entre 1 y 50'),
  ],
  playlistController.getPlaylistAuditLog
);

/**
 * @swagger
 * /api/playlists/{playlistId}/moderate:
 *   patch:
 *     summary: Moderar playlist (solo administradores)
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
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
 *                 enum: [active, pending, moderated, banned]
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       200:
 *         description: Playlist moderada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos de moderador
 *       404:
 *         description: Playlist no encontrada
 */
router.patch('/:playlistId/moderate',
  authService.authenticateToken,
  authService.requireModerator,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
    body('status').isIn(['active', 'pending', 'moderated', 'banned']).withMessage('Status inválido'),
    body('reason').optional().isLength({ max: 200 }).withMessage('Razón muy larga'),
  ],
  playlistController.moderatePlaylist
);

/**
 * @swagger
 * /api/playlists/{playlistId}/subscribe:
 *   post:
 *     summary: Suscribirse a notificaciones en tiempo real de una playlist
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suscripción exitosa
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tiene permisos para suscribirse
 *       404:
 *         description: Playlist no encontrada
 */
router.post('/:playlistId/subscribe',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
  ],
  playlistController.subscribeToPlaylist
);

/**
 * @swagger
 * /api/playlists/{playlistId}/unsubscribe:
 *   post:
 *     summary: Cancelar suscripción a notificaciones en tiempo real
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
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
 *               connectionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suscripción cancelada exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/:playlistId/unsubscribe',
  authService.authenticateToken,
  [
    param('playlistId').isMongoId().withMessage('ID de playlist inválido'),
  ],
  playlistController.unsubscribeFromPlaylist
);

/**
 * @swagger
 * /api/playlists/realtime/stats:
 *   get:
 *     summary: Obtener estadísticas del servicio en tiempo real (solo admin)
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       403:
 *         description: Solo administradores pueden ver estadísticas
 */
router.get('/realtime/stats',
  authService.authenticateToken,
  authService.requireAdmin,
  playlistController.getRealtimeStats
);

/**
 * @swagger
 * /api/playlists/notifications/pending:
 *   get:
 *     summary: Obtener notificaciones pendientes (para polling)
 *     tags: [Playlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Notificaciones obtenidas exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/notifications/pending',
  authService.authenticateToken,
  playlistController.getPendingNotifications
);

module.exports = router;