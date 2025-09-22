const notificationsService = require('../services/notificationsService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class NotificationsController {
  /**
   * Crear notificación manual
   */
  async createNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const notificationData = req.body;

      const notification = await notificationsService.createNotification(userId, notificationData);

      res.status(201).json({
        success: true,
        message: 'Notificación creada exitosamente',
        data: { notification }
      });
    } catch (error) {
      logger.error('Error en createNotification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creando notificación'
      });
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const {
        status,
        type,
        priority,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        status,
        type,
        priority
      };

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await notificationsService.getUserNotifications(userId, filters, pagination);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error en getUserNotifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo notificaciones'
      });
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await notificationsService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      logger.error('Error en getUnreadCount:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo conteo de notificaciones'
      });
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationsService.markAsRead(userId, id);

      res.json({
        success: true,
        message: 'Notificación marcada como leída',
        data: { notification }
      });
    } catch (error) {
      logger.error('Error en markAsRead:', error);
      res.status(error.message === 'Notificación no encontrada' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error marcando notificación como leída'
      });
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationsService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas',
        data: { modifiedCount: result.modifiedCount }
      });
    } catch (error) {
      logger.error('Error en markAllAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Error marcando notificaciones como leídas'
      });
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationsService.deleteNotification(userId, id);

      res.json({
        success: true,
        message: 'Notificación eliminada exitosamente',
        data: { notification }
      });
    } catch (error) {
      logger.error('Error en deleteNotification:', error);
      res.status(error.message === 'Notificación no encontrada' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error eliminando notificación'
      });
    }
  }

  /**
   * Notificar nuevo concierto (admin)
   */
  async notifyNewConcert(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const concertData = req.body;
      const targetUsers = req.body.targetUsers; // Opcional

      await notificationsService.notifyNewConcert(concertData, targetUsers);

      res.json({
        success: true,
        message: 'Notificaciones de nuevo concierto enviadas'
      });
    } catch (error) {
      logger.error('Error en notifyNewConcert:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error enviando notificaciones de concierto'
      });
    }
  }

  /**
   * Notificar nuevo álbum (admin)
   */
  async notifyNewAlbum(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const albumData = req.body;
      const targetUsers = req.body.targetUsers; // Opcional

      await notificationsService.notifyNewAlbum(albumData, targetUsers);

      res.json({
        success: true,
        message: 'Notificaciones de nuevo álbum enviadas'
      });
    } catch (error) {
      logger.error('Error en notifyNewAlbum:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error enviando notificaciones de álbum'
      });
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(req, res) {
    try {
      const userId = req.query.userId || req.user.id;

      // Solo admin puede ver stats de otros usuarios
      if (req.query.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver estadísticas de otros usuarios'
        });
      }

      const stats = await notificationsService.getNotificationStats(userId);

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Error en getNotificationStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de notificaciones'
      });
    }
  }

  /**
   * Configurar preferencias de notificación del usuario
   */
  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;

      // Aquí iríamos a un modelo de UserPreferences o similar
      // Por ahora, solo logueamos
      logger.info('Preferencias de notificación actualizadas', {
        userId,
        preferences
      });

      res.json({
        success: true,
        message: 'Preferencias de notificación actualizadas',
        data: { preferences }
      });
    } catch (error) {
      logger.error('Error en updateNotificationPreferences:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando preferencias'
      });
    }
  }

  /**
   * Obtener preferencias de notificación del usuario
   */
  async getNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;

      // Aquí iríamos a buscar las preferencias del usuario
      // Por ahora, devolvemos valores por defecto
      const preferences = {
        email: {
          new_concert: true,
          album_release: true,
          forum_reply: true,
          system_announcement: true
        },
        push: {
          new_concert: true,
          forum_reply: true,
          personal_message: true
        },
        in_app: {
          all: true
        }
      };

      res.json({
        success: true,
        data: { preferences }
      });
    } catch (error) {
      logger.error('Error en getNotificationPreferences:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo preferencias'
      });
    }
  }

  /**
   * Probar envío de notificación (desarrollo)
   */
  async testNotification(req, res) {
    try {
      const userId = req.user.id;
      const { channel = 'in_app', type = 'system_announcement' } = req.body;

      const testNotification = {
        type,
        title: '🧪 Notificación de Prueba',
        message: 'Esta es una notificación de prueba del sistema de Twenty One Pilots',
        channels: [channel],
        priority: 'normal',
        data: {
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      const notification = await notificationsService.createNotification(userId, testNotification);

      res.json({
        success: true,
        message: 'Notificación de prueba enviada',
        data: { notification }
      });
    } catch (error) {
      logger.error('Error en testNotification:', error);
      res.status(500).json({
        success: false,
        message: 'Error enviando notificación de prueba'
      });
    }
  }
}

module.exports = new NotificationsController();