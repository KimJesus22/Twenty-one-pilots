const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
  // Moderador que realizó la acción
  moderator: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    role: { type: String, required: true }
  },

  // Acción realizada
  action: {
    type: String,
    enum: [
      'warn',
      'delete_content',
      'ban_user',
      'suspend_user',
      'restrict_user',
      'unban_user',
      'unsuspend_user',
      'report_resolved',
      'report_dismissed'
    ],
    required: true
  },

  // Objetivo de la moderación
  target: {
    type: {
      type: String,
      enum: ['thread', 'comment', 'user', 'report'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    model: {
      type: String,
      enum: ['ForumThread', 'ForumComment', 'User', 'Report']
    }
  },

  // Razón de la moderación
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Detalles adicionales
  details: {
    // Para suspensiones/bloqueos
    duration: Number, // en días
    expiresAt: Date,
    isPermanent: { type: Boolean, default: false },

    // Para contenido eliminado
    originalContent: String,
    deletionReason: String,

    // Para reportes
    reportId: mongoose.Schema.Types.ObjectId,

    // Información del contexto
    ip: String,
    userAgent: String,
    location: String,

    // Metadatos adicionales
    metadata: mongoose.Schema.Types.Mixed
  },

  // Severidad de la acción
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Estado de la acción
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending', 'reverted'],
    default: 'completed'
  },

  // Resultado de la acción
  result: {
    success: { type: Boolean, default: true },
    message: String,
    errorDetails: String
  },

  // Reversión de acciones
  reverted: {
    isReverted: { type: Boolean, default: false },
    revertedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revertedAt: Date,
    revertReason: String
  },

  // Timestamps
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

// Índices para optimización
moderationLogSchema.index({ 'moderator.id': 1, createdAt: -1 });
moderationLogSchema.index({ 'target.type': 1, 'target.id': 1 });
moderationLogSchema.index({ action: 1, createdAt: -1 });
moderationLogSchema.index({ severity: 1, createdAt: -1 });
moderationLogSchema.index({ status: 1, createdAt: -1 });

// Middleware para actualizar updatedAt
moderationLogSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para marcar como revertido
moderationLogSchema.methods.markAsReverted = async function(revertedBy, reason) {
  this.reverted = {
    isReverted: true,
    revertedBy,
    revertedAt: new Date(),
    revertReason: reason
  };

  return this.save();
};

// Método estático para obtener logs de un moderador
moderationLogSchema.statics.getModeratorLogs = function(moderatorId, limit = 50) {
  return this.find({ 'moderator.id': moderatorId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Método estático para obtener logs de un usuario objetivo
moderationLogSchema.statics.getUserModerationHistory = function(userId, limit = 20) {
  return this.find({
    $or: [
      { 'target.id': userId, 'target.type': 'user' },
      { 'moderator.id': userId }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Método estático para obtener estadísticas de moderación
moderationLogSchema.statics.getModerationStats = function(startDate, endDate) {
  const matchConditions = {};
  if (startDate && endDate) {
    matchConditions.createdAt = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          action: '$action',
          severity: '$severity'
        },
        count: { $sum: 1 },
        moderators: { $addToSet: '$moderator.id' }
      }
    },
    {
      $group: {
        _id: '$_id.severity',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count'
          }
        },
        totalActions: { $sum: '$count' },
        uniqueModerators: { $addToSet: '$moderators' }
      }
    }
  ]);
};

// Método estático para obtener logs recientes
moderationLogSchema.statics.getRecentLogs = function(limit = 20) {
  return this.find({})
    .populate('moderator.id', 'username')
    .sort({ createdAt: -1 })
    .limit(limit);
};

const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);

module.exports = ModerationLog;