const mongoose = require('mongoose');

const releaseNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['music_release', 'merch_release', 'album_release', 'single_release', 'bundle_release'],
    required: true
  },
  itemType: {
    type: String,
    enum: ['music', 'merch'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true,
    index: true
  },
  sentAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'cancelled', 'failed'],
    default: 'scheduled',
    index: true
  },
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    default: ['in_app']
  }],
  metadata: {
    imageUrl: String,
    externalUrl: String,
    price: Number,
    currency: {
      type: String,
      default: 'MXN'
    },
    platform: String, // spotify, youtube, etc.
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    }
  },
  userPreferences: {
    enabled: {
      type: Boolean,
      default: true
    },
    advanceNotice: {
      type: Number, // horas antes del lanzamiento
      default: 24
    },
    quietHours: {
      start: Number, // hora del día (0-23)
      end: Number    // hora del día (0-23)
    }
  },
  deliveryAttempts: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    channel: String,
    success: Boolean,
    error: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para consultas eficientes
releaseNotificationSchema.index({ user: 1, status: 1 });
releaseNotificationSchema.index({ scheduledTime: 1, status: 1 });
releaseNotificationSchema.index({ event: 1, type: 1 });
releaseNotificationSchema.index({ itemId: 1, itemType: 1 });

// Middleware para actualizar updatedAt
releaseNotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para marcar como enviada
releaseNotificationSchema.methods.markAsSent = async function(channel = 'in_app') {
  this.sentAt = new Date();
  this.status = 'sent';
  this.deliveryAttempts.push({
    channel,
    success: true
  });
  return this.save();
};

// Método para marcar como fallida
releaseNotificationSchema.methods.markAsFailed = async function(error, channel = 'in_app') {
  this.status = 'failed';
  this.deliveryAttempts.push({
    channel,
    success: false,
    error: error.message || error
  });
  return this.save();
};

// Método para cancelar
releaseNotificationSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  return this.save();
};

// Método para verificar si debe enviarse
releaseNotificationSchema.methods.shouldSend = function() {
  if (this.status !== 'scheduled') return false;
  if (!this.userPreferences.enabled) return false;

  const now = new Date();
  const timeDiff = this.scheduledTime - now;

  // Verificar si está dentro del tiempo de anticipación
  const advanceMs = this.userPreferences.advanceNotice * 60 * 60 * 1000;
  if (timeDiff > advanceMs) return false;

  // Verificar horas tranquilas
  if (this.userPreferences.quietHours) {
    const currentHour = now.getHours();
    const { start, end } = this.userPreferences.quietHours;

    if (start < end) {
      // Horas tranquilas en el mismo día
      if (currentHour >= start && currentHour < end) return false;
    } else {
      // Horas tranquilas cruzando medianoche
      if (currentHour >= start || currentHour < end) return false;
    }
  }

  return true;
};

// Método estático para crear notificación de lanzamiento de música
releaseNotificationSchema.statics.createMusicReleaseNotification = async function(userId, eventId, musicId, scheduledTime, preferences = {}) {
  const music = await mongoose.model('EventMusic').findById(musicId);
  if (!music) throw new Error('Música no encontrada');

  const type = music.type === 'album' ? 'album_release' :
               music.type === 'single' ? 'single_release' : 'music_release';

  const notification = new this({
    user: userId,
    event: eventId,
    type,
    itemType: 'music',
    itemId: musicId,
    title: `¡Nuevo lanzamiento: ${music.title}!`,
    message: `${music.artist} acaba de lanzar "${music.title}". ¡Escúchalo ahora!`,
    scheduledTime,
    channels: preferences.channels || ['in_app', 'push'],
    metadata: {
      imageUrl: music.artwork?.url,
      externalUrl: music.platforms?.spotify?.url || music.platforms?.youtube?.url,
      platform: music.platforms?.spotify ? 'spotify' : music.platforms?.youtube ? 'youtube' : 'other',
      priority: music.isExclusive ? 'high' : 'normal'
    },
    userPreferences: {
      enabled: preferences.enabled !== false,
      advanceNotice: preferences.advanceNotice || 24,
      quietHours: preferences.quietHours
    }
  });

  return notification.save();
};

// Método estático para crear notificación de lanzamiento de merch
releaseNotificationSchema.statics.createMerchReleaseNotification = async function(userId, eventId, merchId, scheduledTime, preferences = {}) {
  const merch = await mongoose.model('EventMerch').findById(merchId);
  if (!merch) throw new Error('Producto no encontrado');

  const notification = new this({
    user: userId,
    event: eventId,
    type: 'merch_release',
    itemType: 'merch',
    itemId: merchId,
    title: `¡Nuevo merch disponible: ${merch.name}!`,
    message: `${merch.name} ya está disponible. ${merch.pricing.discountPercentage > 0 ? `¡${merch.pricing.discountPercentage}% de descuento!` : 'No te lo pierdas!'}`,
    scheduledTime,
    channels: preferences.channels || ['in_app', 'email'],
    metadata: {
      imageUrl: merch.images[0]?.url,
      externalUrl: merch.externalLinks?.purchaseUrl,
      price: merch.pricing.salePrice || merch.pricing.originalPrice,
      currency: merch.pricing.currency,
      priority: merch.limitedEdition ? 'urgent' : merch.featured ? 'high' : 'normal'
    },
    userPreferences: {
      enabled: preferences.enabled !== false,
      advanceNotice: preferences.advanceNotice || 24,
      quietHours: preferences.quietHours
    }
  });

  return notification.save();
};

// Método estático para obtener notificaciones pendientes
releaseNotificationSchema.statics.getPendingNotifications = function(limit = 50) {
  const now = new Date();
  return this.find({
    status: 'scheduled',
    scheduledTime: { $lte: now }
  })
  .populate('user', 'username email notifications')
  .populate('event', 'title')
  .populate({
    path: 'itemId',
    select: 'title name artist',
    model: function(doc) {
      return doc.itemType === 'music' ? 'EventMusic' : 'EventMerch';
    }
  })
  .sort({ scheduledTime: 1 })
  .limit(limit);
};

// Método estático para obtener notificaciones de usuario
releaseNotificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const query = { user: userId };

  if (options.status) query.status = options.status;
  if (options.type) query.type = options.type;

  const notificationsQuery = this.find(query)
    .populate('event', 'title')
    .populate({
      path: 'itemId',
      select: 'title name artist images artwork',
      model: function(doc) {
        return doc.itemType === 'music' ? 'EventMusic' : 'EventMerch';
      }
    })
    .sort({ createdAt: -1 });

  if (options.limit) notificationsQuery.limit(options.limit);
  if (options.skip) notificationsQuery.skip(options.skip);

  return notificationsQuery;
};

// Método estático para limpiar notificaciones antiguas
releaseNotificationSchema.statics.cleanupOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['sent', 'cancelled'] }
  });
};

const ReleaseNotification = mongoose.model('ReleaseNotification', releaseNotificationSchema);

module.exports = ReleaseNotification;