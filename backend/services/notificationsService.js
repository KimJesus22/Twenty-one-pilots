const Notification = require('../models/Notification');
const User = require('../models/User');
const queueService = require('./queueService');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

class NotificationsService {
  constructor() {
    this.CACHE_TTL = {
      user_notifications: 300,   // 5 minutos
      unread_count: 60          // 1 minuto
    };
  }

  /**
   * Crear notificación
   */
  async createNotification(userId, notificationData) {
    try {
      const notification = new Notification({
        user: userId,
        ...notificationData
      });

      await notification.save();

      // Invalidar caché
      await this.invalidateUserCache(userId);

      // Enviar notificación por los canales especificados
      await this.sendNotification(notification);

      logger.info('Notificación creada', {
        userId,
        type: notification.type,
        channels: notification.channels
      });

      return notification;
    } catch (error) {
      logger.error('Error creando notificación:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación por todos los canales configurados
   */
  async sendNotification(notification) {
    try {
      for (const channel of notification.channels) {
        try {
          switch (channel) {
            case 'in_app':
              // Las notificaciones in-app ya están creadas en la BD
              await notification.markAsSent(channel);
              break;

            case 'email':
              await queueService.addEmailJob('notification', {
                userId: notification.user,
                notificationId: notification._id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                data: notification.data
              });
              break;

            case 'push':
              await queueService.addNotificationJob('push', notification.user, {
                title: notification.title,
                message: notification.message,
                data: notification.data
              });
              break;

            case 'sms':
              await queueService.addNotificationJob('sms', notification.user, {
                message: notification.message,
                data: notification.data
              });
              break;
          }
        } catch (channelError) {
          logger.error(`Error enviando notificación por ${channel}:`, channelError);
          await notification.markAsFailed(channelError, channel);
        }
      }
    } catch (error) {
      logger.error('Error enviando notificación:', error);
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId, filters = {}, pagination = {}) {
    try {
      const cacheKey = `notifications:user:${userId}:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const query = { user: userId };

      // Aplicar filtros
      if (filters.status) {
        if (filters.status === 'unread') {
          query.status = { $in: ['pending', 'sent', 'delivered'] };
        } else {
          query.status = filters.status;
        }
      }

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.priority) {
        query.priority = filters.priority;
      }

      // Paginación
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const skip = (page - 1) * limit;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(query);

      const result = {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.user_notifications);

      return result;
    } catch (error) {
      logger.error('Error obteniendo notificaciones de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(userId) {
    try {
      const cacheKey = `notifications:unread:${userId}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const count = await Notification.getUnreadCount(userId);

      // Cachear resultado
      await cacheService.set(cacheKey, count, this.CACHE_TTL.unread_count);

      return count;
    } catch (error) {
      logger.error('Error obteniendo conteo de notificaciones no leídas:', error);
      return 0;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { status: 'read', readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notificación no encontrada');
      }

      // Invalidar caché
      await this.invalidateUserCache(userId);

      logger.info('Notificación marcada como leída', { userId, notificationId });

      return notification;
    } catch (error) {
      logger.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);

      // Invalidar caché
      await this.invalidateUserCache(userId);

      logger.info('Todas las notificaciones marcadas como leídas', {
        userId,
        modified: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.error('Error marcando todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(userId, notificationId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId
      });

      if (!notification) {
        throw new Error('Notificación no encontrada');
      }

      // Invalidar caché
      await this.invalidateUserCache(userId);

      logger.info('Notificación eliminada', { userId, notificationId });

      return notification;
    } catch (error) {
      logger.error('Error eliminando notificación:', error);
      throw error;
    }
  }

  /**
   * Crear notificación de nuevo concierto
   */
  async notifyNewConcert(concertData, targetUsers = null) {
    try {
      let userIds = targetUsers;

      // Si no se especifican usuarios, notificar a todos los fans
      if (!userIds) {
        // Obtener usuarios que han marcado como favoritos artistas relacionados
        // o que han asistido a conciertos similares
        userIds = await this.getUsersInterestedInArtist(concertData.artist);
      }

      if (userIds.length === 0) {
        logger.info('No hay usuarios para notificar sobre nuevo concierto', { concertId: concertData._id });
        return;
      }

      await Notification.createConcertNotification(userIds, concertData);

      logger.info('Notificaciones de nuevo concierto enviadas', {
        concertId: concertData._id,
        usersNotified: userIds.length
      });
    } catch (error) {
      logger.error('Error creando notificaciones de concierto:', error);
      throw error;
    }
  }

  /**
   * Crear notificación de nuevo álbum
   */
  async notifyNewAlbum(albumData, targetUsers = null) {
    try {
      let userIds = targetUsers;

      if (!userIds) {
        // Notificar a fans del artista
        userIds = await this.getUsersInterestedInArtist(albumData.artist);
      }

      if (userIds.length === 0) {
        logger.info('No hay usuarios para notificar sobre nuevo álbum', { albumId: albumData._id });
        return;
      }

      await Notification.createAlbumNotification(userIds, albumData);

      logger.info('Notificaciones de nuevo álbum enviadas', {
        albumId: albumData._id,
        usersNotified: userIds.length
      });
    } catch (error) {
      logger.error('Error creando notificaciones de álbum:', error);
      throw error;
    }
  }

  /**
   * Crear notificación de respuesta en foro
   */
  async notifyForumReply(threadId, replyData) {
    try {
      // Obtener el autor del thread original
      const thread = await require('../models/Forum').findById(threadId);
      if (!thread) {
        throw new Error('Thread no encontrado');
      }

      // Notificar al autor del thread (si no es el mismo que responde)
      if (thread.author.toString() !== replyData.authorId.toString()) {
        await Notification.createForumReplyNotification(thread.author, {
          threadId,
          threadTitle: thread.title,
          author: replyData.authorName,
          replyId: replyData._id
        });
      }

      // También notificar a otros participantes del thread
      const otherParticipants = await this.getThreadParticipants(threadId, replyData.authorId);
      for (const participantId of otherParticipants) {
        await Notification.createForumReplyNotification(participantId, {
          threadId,
          threadTitle: thread.title,
          author: replyData.authorName,
          replyId: replyData._id
        });
      }

      logger.info('Notificaciones de respuesta en foro enviadas', {
        threadId,
        replyId: replyData._id,
        participantsNotified: otherParticipants.length + (thread.author.toString() !== replyData.authorId.toString() ? 1 : 0)
      });
    } catch (error) {
      logger.error('Error creando notificaciones de foro:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios interesados en un artista
   */
  async getUsersInterestedInArtist(artistName) {
    try {
      // Buscar usuarios que tienen favoritos relacionados con el artista
      const Favorite = require('../models/Favorite');
      const favorites = await Favorite.find({
        $or: [
          { 'itemData.artist': artistName },
          { 'itemData.title': { $regex: artistName, $options: 'i' } }
        ]
      }).distinct('user');

      return favorites;
    } catch (error) {
      logger.error('Error obteniendo usuarios interesados en artista:', error);
      return [];
    }
  }

  /**
   * Obtener participantes de un thread
   */
  async getThreadParticipants(threadId, excludeUserId) {
    try {
      // Buscar respuestas en el thread excluyendo al usuario que responde
      const Forum = require('../models/Forum');
      const replies = await Forum.find({
        parentId: threadId,
        author: { $ne: excludeUserId }
      }).distinct('author');

      return replies;
    } catch (error) {
      logger.error('Error obteniendo participantes del thread:', error);
      return [];
    }
  }

  /**
   * Limpiar caché de usuario
   */
  async invalidateUserCache(userId) {
    try {
      const patterns = [
        `notifications:user:${userId}:*`,
        `notifications:unread:${userId}`
      ];

      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }

      logger.debug('Cache de notificaciones invalidado para usuario', { userId });
    } catch (error) {
      logger.error('Error invalidando cache de notificaciones:', error);
    }
  }

  /**
   * Programar notificaciones recurrentes
   */
  async scheduleRecurringNotifications() {
    try {
      // Programar recordatorios de eventos próximos
      await queueService.addJob('recurring', 'event-reminders', {}, {
        repeat: { cron: '0 */6 * * *' } // Cada 6 horas
      });

      // Programar limpieza de notificaciones antiguas
      await queueService.addJob('maintenance', 'cleanup-notifications', {}, {
        repeat: { cron: '0 2 * * *' } // Todos los días a las 2 AM
      });

      logger.info('Notificaciones recurrentes programadas');
    } catch (error) {
      logger.error('Error programando notificaciones recurrentes:', error);
    }
  }

  /**
   * Procesar recordatorios de eventos
   */
  async processEventReminders() {
    try {
      // Lógica para enviar recordatorios de eventos próximos
      // (Próximos 24-48 horas)
      logger.info('Recordatorios de eventos procesados');
    } catch (error) {
      logger.error('Error procesando recordatorios de eventos:', error);
    }
  }

  /**
   * Limpiar notificaciones antiguas
   */
  async cleanupOldNotifications() {
    try {
      const result = await Notification.cleanupOldNotifications(90); // 90 días
      logger.info('Notificaciones antiguas limpiadas', { deleted: result.deletedCount });
    } catch (error) {
      logger.error('Error limpiando notificaciones antiguas:', error);
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(userId = null) {
    try {
      const matchStage = userId ? { user: userId } : {};

      const stats = await Notification.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              type: '$type',
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            statuses: {
              $push: {
                status: '$_id.status',
                count: '$count'
              }
            },
            total: { $sum: '$count' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de notificaciones:', error);
      throw error;
    }
  }
}

module.exports = new NotificationsService();