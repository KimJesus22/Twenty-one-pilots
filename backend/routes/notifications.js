const express = require('express');
const { body, param, query } = require('express-validator');
const notificationsController = require('../controllers/notificationsController');
const authService = require('../services/authService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authService.authenticateToken);

// Validaciones
const notificationValidations = [
  body('type').isIn([
    'new_concert', 'album_release', 'song_release', 'video_upload',
    'forum_reply', 'forum_mention', 'favorite_update', 'playlist_update',
    'system_announcement', 'personal_message', 'event_reminder',
    'price_drop', 'restock_alert'
  ]).withMessage('Tipo de notificación inválido'),
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Título requerido (1-200 chars)'),
  body('message').isString().isLength({ min: 1, max: 1000 }).withMessage('Mensaje requerido (1-1000 chars)'),
  body('channels').optional().isArray().withMessage('Canales debe ser un array'),
  body('channels.*').optional().isIn(['in_app', 'email', 'push', 'sms']).withMessage('Canal inválido'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Prioridad inválida'),
  body('data').optional().isObject().withMessage('Datos deben ser un objeto')
];

const concertNotificationValidations = [
  body('name').isString().isLength({ min: 1 }).withMessage('Nombre del concierto requerido'),
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('venue').isString().isLength({ min: 1 }).withMessage('Venue requerido'),
  body('city').isString().isLength({ min: 1 }).withMessage('Ciudad requerida'),
  body('artist').isString().isLength({ min: 1 }).withMessage('Artista requerido'),
  body('_id').isMongoId().withMessage('ID del concierto inválido'),
  body('image').optional().isURL().withMessage('URL de imagen inválida'),
  body('targetUsers').optional().isArray().withMessage('Usuarios objetivo debe ser array'),
  body('targetUsers.*').optional().isMongoId().withMessage('ID de usuario inválido')
];

const albumNotificationValidations = [
  body('title').isString().isLength({ min: 1 }).withMessage('Título del álbum requerido'),
  body('artist').isString().isLength({ min: 1 }).withMessage('Artista requerido'),
  body('releaseYear').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Año de lanzamiento inválido'),
  body('_id').isMongoId().withMessage('ID del álbum inválido'),
  body('coverImage').optional().isURL().withMessage('URL de imagen inválida'),
  body('genre').optional().isString().withMessage('Género debe ser string'),
  body('targetUsers').optional().isArray().withMessage('Usuarios objetivo debe ser array'),
  body('targetUsers.*').optional().isMongoId().withMessage('ID de usuario inválido')
];

// ===== RUTAS DE NOTIFICACIONES =====

// Crear notificación manual
router.post('/', notificationValidations, notificationsController.createNotification);

// Obtener notificaciones del usuario
router.get('/', [
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'read', 'failed'])
    .withMessage('Estado inválido'),
  query('type').optional().isIn([
    'new_concert', 'album_release', 'song_release', 'video_upload',
    'forum_reply', 'forum_mention', 'favorite_update', 'playlist_update',
    'system_announcement', 'personal_message', 'event_reminder',
    'price_drop', 'restock_alert'
  ]).withMessage('Tipo inválido'),
  query('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Prioridad inválida'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser positiva'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite inválido')
], notificationsController.getUserNotifications);

// Obtener conteo de notificaciones no leídas
router.get('/unread-count', notificationsController.getUnreadCount);

// Marcar notificación como leída
router.put('/:id/read', [
  param('id').isMongoId().withMessage('ID de notificación inválido')
], notificationsController.markAsRead);

// Marcar todas como leídas
router.put('/mark-all-read', notificationsController.markAllAsRead);

// Eliminar notificación
router.delete('/:id', [
  param('id').isMongoId().withMessage('ID de notificación inválido')
], notificationsController.deleteNotification);

// ===== NOTIFICACIONES AUTOMÁTICAS (ADMIN) =====

// Notificar nuevo concierto
router.post('/notify/concert',
  authService.requireAdmin,
  concertNotificationValidations,
  notificationsController.notifyNewConcert
);

// Notificar nuevo álbum
router.post('/notify/album',
  authService.requireAdmin,
  albumNotificationValidations,
  notificationsController.notifyNewAlbum
);

// ===== PREFERENCIAS Y CONFIGURACIÓN =====

// Obtener preferencias de notificación
router.get('/preferences', notificationsController.getNotificationPreferences);

// Actualizar preferencias de notificación
router.put('/preferences', [
  body('preferences').isObject().withMessage('Preferencias deben ser un objeto'),
  body('preferences.email').optional().isObject().withMessage('Preferencias de email inválidas'),
  body('preferences.push').optional().isObject().withMessage('Preferencias de push inválidas'),
  body('preferences.in_app').optional().isObject().withMessage('Preferencias in-app inválidas')
], notificationsController.updateNotificationPreferences);

// ===== ESTADÍSTICAS Y ADMINISTRACIÓN =====

// Obtener estadísticas de notificaciones
router.get('/stats', [
  query('userId').optional().isMongoId().withMessage('ID de usuario inválido')
], notificationsController.getNotificationStats);

// Probar envío de notificación (desarrollo)
router.post('/test', [
  body('channel').optional().isIn(['in_app', 'email', 'push', 'sms'])
    .withMessage('Canal inválido'),
  body('type').optional().isIn([
    'new_concert', 'album_release', 'song_release', 'video_upload',
    'forum_reply', 'forum_mention', 'favorite_update', 'playlist_update',
    'system_announcement', 'personal_message', 'event_reminder',
    'price_drop', 'restock_alert'
  ]).withMessage('Tipo inválido')
], notificationsController.testNotification);

// ===== WEBHOOKS PARA NOTIFICACIONES =====

// Webhook para respuestas de foro (llamado desde forum service)
router.post('/webhook/forum-reply', [
  body('threadId').isMongoId().withMessage('ID de thread inválido'),
  body('replyData').isObject().withMessage('Datos de respuesta requeridos'),
  body('replyData.authorId').isMongoId().withMessage('ID de autor inválido'),
  body('replyData.authorName').isString().withMessage('Nombre de autor requerido'),
  body('replyData._id').isMongoId().withMessage('ID de respuesta inválido')
], async (req, res) => {
  try {
    const { threadId, replyData } = req.body;

    await notificationsService.notifyForumReply(threadId, replyData);

    res.json({
      success: true,
      message: 'Notificaciones de respuesta en foro enviadas'
    });
  } catch (error) {
    logger.error('Error en webhook forum-reply:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook de foro'
    });
  }
});

// Webhook para nuevos lanzamientos (llamado desde discography service)
router.post('/webhook/new-release', [
  body('type').isIn(['album', 'song']).withMessage('Tipo de lanzamiento inválido'),
  body('data').isObject().withMessage('Datos del lanzamiento requeridos')
], async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'album') {
      await notificationsService.notifyNewAlbum(data);
    } else if (type === 'song') {
      // Para canciones, notificamos como parte del álbum
      // o implementamos lógica específica si es necesario
      logger.info('Notificación de nueva canción', { songData: data });
    }

    res.json({
      success: true,
      message: `Notificaciones de nuevo ${type} enviadas`
    });
  } catch (error) {
    logger.error('Error en webhook new-release:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook de lanzamiento'
    });
  }
});

// Información de la API
router.get('/api-info', (req, res) => {
  res.json({
    success: true,
    message: 'Notifications API - Sistema completo de notificaciones',
    version: '1.0.0',
    endpoints: {
      'POST /': 'Crear notificación manual',
      'GET /': 'Obtener notificaciones del usuario',
      'GET /unread-count': 'Conteo de notificaciones no leídas',
      'PUT /:id/read': 'Marcar notificación como leída',
      'PUT /mark-all-read': 'Marcar todas como leídas',
      'DELETE /:id': 'Eliminar notificación',
      'POST /notify/concert': 'Notificar nuevo concierto (admin)',
      'POST /notify/album': 'Notificar nuevo álbum (admin)',
      'GET /preferences': 'Obtener preferencias',
      'PUT /preferences': 'Actualizar preferencias',
      'GET /stats': 'Estadísticas de notificaciones',
      'POST /test': 'Probar notificación',
      'POST /webhook/forum-reply': 'Webhook respuestas foro',
      'POST /webhook/new-release': 'Webhook nuevos lanzamientos'
    },
    channels: ['in_app', 'email', 'push', 'sms'],
    types: [
      'new_concert', 'album_release', 'song_release', 'video_upload',
      'forum_reply', 'forum_mention', 'favorite_update', 'playlist_update',
      'system_announcement', 'personal_message', 'event_reminder',
      'price_drop', 'restock_alert'
    ],
    features: [
      'Múltiples canales de envío',
      'Sistema de prioridades',
      'Cache inteligente',
      'Integración con colas Bull',
      'Webhooks para eventos automáticos',
      'Preferencias de usuario',
      'Estadísticas y monitoreo'
    ]
  });
});

module.exports = router;