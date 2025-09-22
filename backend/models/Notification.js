const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'new_concert',           // Nuevo concierto disponible
      'album_release',         // Nuevo álbum lanzado
      'song_release',          // Nueva canción lanzada
      'video_upload',          // Nuevo video subido
      'forum_reply',           // Respuesta en foro
      'forum_mention',         // Mención en foro
      'favorite_update',       // Actualización de favorito
      'playlist_update',       // Actualización de playlist
      'system_announcement',   // Anuncio del sistema
      'personal_message',      // Mensaje personal
      'event_reminder',        // Recordatorio de evento
      'price_drop',           // Bajada de precio
      'restock_alert'         // Producto de vuelta en stock
    ],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    // Datos adicionales específicos del tipo de notificación
    itemId: mongoose.Schema.Types.ObjectId,    // ID del item relacionado
    itemType: String,                         // Tipo del item
    itemTitle: String,                        // Título del item
    url: String,                              // URL para redireccionar
    image: String,                            // Imagen relacionada
    metadata: mongoose.Schema.Types.Mixed     // Datos adicionales flexibles
  },
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'push', 'sms'],
    default: ['in_app']
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending',
    index: true
  },
  sentAt: Date,
  readAt: Date,
  expiresAt: Date,  // Para notificaciones que expiran
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
notificationSchema.index({ user: 1, status: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ 'data.itemId': 1, 'data.itemType': 1 });

// Método para marcar como leída
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Método para marcar como enviada
notificationSchema.methods.markAsSent = function(channel) {
  this.status = 'sent';
  this.sentAt = new Date();

  // Actualizar canales enviados
  if (channel && !this.data.sentChannels) {
    this.data.sentChannels = [];
  }
  if (channel && !this.data.sentChannels.includes(channel)) {
    this.data.sentChannels.push(channel);
  }

  return this.save();
};

// Método para marcar como fallida
notificationSchema.methods.markAsFailed = function(error, channel) {
  this.status = 'failed';

  if (!this.data.failures) {
    this.data.failures = [];
  }

  this.data.failures.push({
    channel,
    error: error.message || error,
    timestamp: new Date()
  });

  return this.save();
};

// Método estático para crear notificación de nuevo concierto
notificationSchema.statics.createConcertNotification = async function(userIds, concertData) {
  const notifications = userIds.map(userId => ({
    user: userId,
    type: 'new_concert',
    title: `🎵 Nuevo concierto: ${concertData.name}`,
    message: `${concertData.name} - ${concertData.venue} el ${new Date(concertData.date).toLocaleDateString()}`,
    data: {
      itemId: concertData._id,
      itemType: 'concert',
      itemTitle: concertData.name,
      url: `/concerts/${concertData._id}`,
      image: concertData.image,
      metadata: {
        venue: concertData.venue,
        date: concertData.date,
        city: concertData.city
      }
    },
    channels: ['in_app', 'email', 'push'],
    priority: 'high',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
  }));

  return await this.insertMany(notifications);
};

// Método estático para crear notificación de nuevo álbum
notificationSchema.statics.createAlbumNotification = async function(userIds, albumData) {
  const notifications = userIds.map(userId => ({
    user: userId,
    type: 'album_release',
    title: `🎵 Nuevo álbum: ${albumData.title}`,
    message: `${albumData.title} de ${albumData.artist} ya está disponible`,
    data: {
      itemId: albumData._id,
      itemType: 'album',
      itemTitle: albumData.title,
      url: `/discography/albums/${albumData._id}`,
      image: albumData.coverImage,
      metadata: {
        artist: albumData.artist,
        releaseYear: albumData.releaseYear,
        genre: albumData.genre
      }
    },
    channels: ['in_app', 'email'],
    priority: 'high',
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 días
  }));

  return await this.insertMany(notifications);
};

// Método estático para crear notificación de respuesta en foro
notificationSchema.statics.createForumReplyNotification = async function(userId, replyData) {
  return await this.create({
    user: userId,
    type: 'forum_reply',
    title: `💬 Nueva respuesta en: ${replyData.threadTitle}`,
    message: `${replyData.author} respondió a tu publicación`,
    data: {
      itemId: replyData.threadId,
      itemType: 'forum_thread',
      itemTitle: replyData.threadTitle,
      url: `/forum/thread/${replyData.threadId}#reply-${replyData.replyId}`,
      metadata: {
        author: replyData.author,
        replyId: replyData.replyId,
        threadId: replyData.threadId
      }
    },
    channels: ['in_app', 'email'],
    priority: 'normal',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
  });
};

// Método estático para obtener notificaciones no leídas
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    user: userId,
    status: { $in: ['pending', 'sent', 'delivered'] }
  });
};

// Método estático para marcar todas como leídas
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { user: userId, status: { $ne: 'read' } },
    {
      status: 'read',
      readAt: new Date()
    }
  );
};

// Método estático para limpiar notificaciones antiguas
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: 'read'
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;