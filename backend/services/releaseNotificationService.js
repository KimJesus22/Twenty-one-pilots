const ReleaseNotification = require('../models/ReleaseNotification');
const EventMusic = require('../models/EventMusic');
const EventMerch = require('../models/EventMerch');
const calendarService = require('./calendarService');
const logger = require('../utils/logger');

class ReleaseNotificationService {
  /**
   * Programar notificación para lanzamiento de música
   */
  async scheduleMusicReleaseNotification(userId, eventId, musicId, releaseDate, preferences = {}) {
    try {
      // Verificar que la música existe
      const music = await EventMusic.findById(musicId);
      if (!music) {
        throw new Error('Música no encontrada');
      }

      // Calcular tiempo de notificación (24 horas antes por defecto)
      const advanceNotice = preferences.advanceNotice || 24;
      const notificationTime = new Date(releaseDate);
      notificationTime.setHours(notificationTime.getHours() - advanceNotice);

      // Crear notificación
      const notification = await ReleaseNotification.createMusicReleaseNotification(
        userId,
        eventId,
        musicId,
        notificationTime,
        preferences
      );

      // Crear evento de calendario si está habilitado
      if (preferences.calendarSync !== false) {
        try {
          await this.createCalendarEventForRelease(userId, eventId, music, 'music', releaseDate);
        } catch (calendarError) {
          logger.warn('Error creando evento de calendario para música:', calendarError);
          // No fallar la notificación por error de calendario
        }
      }

      logger.info('Notificación de música programada:', {
        userId,
        musicId,
        notificationTime,
        title: music.title
      });

      return notification;
    } catch (error) {
      logger.error('Error programando notificación de música:', error);
      throw error;
    }
  }

  /**
   * Programar notificación para lanzamiento de merchandising
   */
  async scheduleMerchReleaseNotification(userId, eventId, merchId, releaseDate, preferences = {}) {
    try {
      // Verificar que el producto existe
      const merch = await EventMerch.findById(merchId);
      if (!merch) {
        throw new Error('Producto no encontrado');
      }

      // Calcular tiempo de notificación
      const advanceNotice = preferences.advanceNotice || 24;
      const notificationTime = new Date(releaseDate);
      notificationTime.setHours(notificationTime.getHours() - advanceNotice);

      // Crear notificación
      const notification = await ReleaseNotification.createMerchReleaseNotification(
        userId,
        eventId,
        merchId,
        notificationTime,
        preferences
      );

      logger.info('Notificación de merch programada:', {
        userId,
        merchId,
        notificationTime,
        title: merch.name
      });

      return notification;
    } catch (error) {
      logger.error('Error programando notificación de merch:', error);
      throw error;
    }
  }

  /**
   * Programar notificaciones para todos los usuarios interesados en un evento
   */
  async scheduleEventReleaseNotifications(eventId, itemType, itemId, releaseDate, preferences = {}) {
    try {
      // Obtener usuarios que han mostrado interés en el evento
      const interestedUsers = await this.getInterestedUsers(eventId);

      const notifications = [];
      for (const userId of interestedUsers) {
        try {
          if (itemType === 'music') {
            const notification = await this.scheduleMusicReleaseNotification(
              userId,
              eventId,
              itemId,
              releaseDate,
              preferences
            );
            notifications.push(notification);
          } else if (itemType === 'merch') {
            const notification = await this.scheduleMerchReleaseNotification(
              userId,
              eventId,
              itemId,
              releaseDate,
              preferences
            );
            notifications.push(notification);
          }
        } catch (error) {
          logger.warn(`Error creando notificación para usuario ${userId}:`, error.message);
        }
      }

      logger.info(`Notificaciones programadas para ${notifications.length} usuarios`);
      return notifications;
    } catch (error) {
      logger.error('Error programando notificaciones masivas:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios interesados en un evento
   */
  async getInterestedUsers(eventId) {
    try {
      // Por ahora, devolver usuarios que han marcado asistencia
      // En el futuro, podríamos expandir esto a usuarios que han visto el evento,
      // lo tienen en favoritos, etc.
      const EventAttendance = require('../models/EventAttendance');

      const attendances = await EventAttendance.find({
        event: eventId,
        status: { $in: ['going', 'interested'] }
      }).select('user');

      return [...new Set(attendances.map(a => a.user.toString()))];
    } catch (error) {
      logger.error('Error obteniendo usuarios interesados:', error);
      return [];
    }
  }

  /**
   * Procesar notificaciones pendientes
   */
  async processPendingNotifications() {
    try {
      const pendingNotifications = await ReleaseNotification.getPendingNotifications(100);

      logger.info(`Procesando ${pendingNotifications.length} notificaciones pendientes`);

      for (const notification of pendingNotifications) {
        try {
          if (notification.shouldSend()) {
            await this.sendNotification(notification);
          }
        } catch (error) {
          logger.error(`Error procesando notificación ${notification._id}:`, error);
          await notification.markAsFailed(error);
        }
      }

      return pendingNotifications.length;
    } catch (error) {
      logger.error('Error procesando notificaciones pendientes:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación específica
   */
  async sendNotification(notification) {
    try {
      // Enviar por cada canal configurado
      for (const channel of notification.channels) {
        try {
          await this.sendToChannel(notification, channel);
        } catch (channelError) {
          logger.warn(`Error enviando a canal ${channel}:`, channelError);
          // Continuar con otros canales aunque uno falle
        }
      }

      // Marcar como enviada
      await notification.markAsSent(notification.channels[0]);

      logger.info('Notificación enviada:', {
        id: notification._id,
        user: notification.user,
        type: notification.type,
        channels: notification.channels
      });

    } catch (error) {
      logger.error('Error enviando notificación:', error);
      await notification.markAsFailed(error);
      throw error;
    }
  }

  /**
   * Enviar notificación por canal específico
   */
  async sendToChannel(notification, channel) {
    const notificationService = require('./notificationService');

    switch (channel) {
      case 'in_app':
        // Crear notificación in-app
        await notificationService.createInAppNotification({
          userId: notification.user,
          title: notification.title,
          message: notification.message,
          type: 'release',
          metadata: {
            eventId: notification.event,
            itemType: notification.itemType,
            itemId: notification.itemId,
            imageUrl: notification.metadata.imageUrl,
            externalUrl: notification.metadata.externalUrl
          }
        });
        break;

      case 'push':
        // Enviar notificación push
        await notificationService.sendPushNotification({
          userId: notification.user,
          title: notification.title,
          body: notification.message,
          data: {
            eventId: notification.event,
            itemType: notification.itemType,
            itemId: notification.itemId,
            externalUrl: notification.metadata.externalUrl
          }
        });
        break;

      case 'email':
        // Enviar email
        await notificationService.sendEmail({
          to: notification.user.email,
          subject: notification.title,
          html: this.generateEmailTemplate(notification),
          metadata: {
            eventId: notification.event,
            itemType: notification.itemType,
            itemId: notification.itemId
          }
        });
        break;

      case 'sms':
        // Enviar SMS (si está implementado)
        if (notificationService.sendSMS) {
          await notificationService.sendSMS({
            to: notification.user.phone,
            message: `${notification.title}: ${notification.message}`
          });
        }
        break;

      default:
        logger.warn(`Canal no soportado: ${channel}`);
    }
  }

  /**
   * Generar template de email para notificaciones
   */
  generateEmailTemplate(notification) {
    const { title, message, metadata } = notification;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.5;">${message}</p>

        ${metadata.imageUrl ? `
          <img src="${metadata.imageUrl}" alt="Producto" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;">
        ` : ''}

        ${metadata.price ? `
          <p style="font-size: 18px; font-weight: bold; color: #ff6b6b;">
            ${metadata.currency === 'MXN' ? '$' : metadata.currency === 'USD' ? '$' : '€'}${metadata.price}
          </p>
        ` : ''}

        ${metadata.externalUrl ? `
          <a href="${metadata.externalUrl}"
             style="display: inline-block; background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ${notification.itemType === 'music' ? 'Escuchar Ahora' : 'Comprar Ahora'}
          </a>
        ` : ''}

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Recibes esta notificación porque mostrastes interés en el evento.
          Puedes gestionar tus preferencias de notificación en tu perfil.
        </p>
      </div>
    `;
  }

  /**
   * Cancelar notificaciones programadas
   */
  async cancelNotifications(itemType, itemId) {
    try {
      const result = await ReleaseNotification.updateMany(
        {
          itemType,
          itemId,
          status: 'scheduled'
        },
        { status: 'cancelled' }
      );

      logger.info(`Canceladas ${result.modifiedCount} notificaciones para ${itemType}:${itemId}`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Error cancelando notificaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(eventId = null) {
    try {
      const matchStage = eventId ? { event: mongoose.Types.ObjectId(eventId) } : {};

      const stats = await ReleaseNotification.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            scheduled: {
              $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
            },
            sent: {
              $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            byType: {
              $push: '$type'
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        scheduled: 0,
        sent: 0,
        cancelled: 0,
        failed: 0,
        byType: []
      };

      // Contar por tipo
      const typeCount = {};
      result.byType.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      result.byType = typeCount;

      return result;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de notificaciones:', error);
      throw error;
    }
  }

  /**
   * Limpiar notificaciones antiguas
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const deletedCount = await ReleaseNotification.cleanupOldNotifications(daysOld);
      logger.info(`Eliminadas ${deletedCount} notificaciones antiguas`);
      return deletedCount;
    } catch (error) {
      logger.error('Error limpiando notificaciones antiguas:', error);
      throw error;
    }
  }
}

module.exports = new ReleaseNotificationService();