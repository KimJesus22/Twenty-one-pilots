const mongoose = require('mongoose');

const userBlockSchema = new mongoose.Schema({
  // Usuario bloqueado
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Moderador que aplicó el bloqueo
  moderator: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    role: { type: String, required: true }
  },

  // Razón del bloqueo
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Tipo de bloqueo
  blockType: {
    type: String,
    enum: ['temporary', 'permanent'],
    required: true
  },

  // Duración (solo para bloqueos temporales)
  duration: {
    value: { type: Number, min: 1 }, // duración en la unidad especificada
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks', 'months'],
      default: 'days'
    }
  },

  // Fecha de expiración
  expiresAt: {
    type: Date,
    index: true
  },

  // Indica si es permanente
  isPermanent: {
    type: Boolean,
    default: false
  },

  // Restricciones aplicadas
  restrictions: {
    // Acciones bloqueadas
    canPost: { type: Boolean, default: false },
    canComment: { type: Boolean, default: false },
    canCreateThreads: { type: Boolean, default: false },
    canUploadFiles: { type: Boolean, default: false },
    canSendMessages: { type: Boolean, default: false },

    // Acceso general
    forumAccess: { type: Boolean, default: false },
    fullBan: { type: Boolean, default: false } // bloqueo total
  },

  // Estado del bloqueo
  status: {
    type: String,
    enum: ['active', 'expired', 'lifted', 'appealed'],
    default: 'active',
    index: true
  },

  // Información de apelación
  appeal: {
    requested: { type: Boolean, default: false },
    requestedAt: Date,
    reason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'denied', 'pending']
    },
    reviewNotes: String
  },

  // Reporte que originó el bloqueo (opcional)
  originatingReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },

  // Metadatos
  ipAddress: String,
  userAgent: String,

  // Historial de extensiones
  extensions: [{
    extendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    extendedAt: { type: Date, default: Date.now },
    previousExpiry: Date,
    newExpiry: Date,
    reason: String,
    additionalDuration: {
      value: Number,
      unit: String
    }
  }],

  // Notas internas de moderadores
  internalNotes: [{
    moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }],

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

// Índices compuestos
userBlockSchema.index({ userId: 1, status: 1 });
userBlockSchema.index({ expiresAt: 1, status: 1 });
userBlockSchema.index({ 'moderator.id': 1, createdAt: -1 });

// Middleware para calcular expiresAt basado en duración
userBlockSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (this.blockType === 'temporary' && this.duration && !this.isPermanent) {
    const now = new Date();
    let expiryDate = new Date(now);

    const { value, unit } = this.duration;

    switch (unit) {
      case 'minutes':
        expiryDate.setMinutes(expiryDate.getMinutes() + value);
        break;
      case 'hours':
        expiryDate.setHours(expiryDate.getHours() + value);
        break;
      case 'days':
        expiryDate.setDate(expiryDate.getDate() + value);
        break;
      case 'weeks':
        expiryDate.setDate(expiryDate.getDate() + (value * 7));
        break;
      case 'months':
        expiryDate.setMonth(expiryDate.getMonth() + value);
        break;
    }

    this.expiresAt = expiryDate;
  } else if (this.blockType === 'permanent') {
    this.isPermanent = true;
    this.expiresAt = null;
  }

  next();
});

// Método para verificar si el bloqueo está activo
userBlockSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  if (this.isPermanent) return true;
  if (!this.expiresAt) return false;

  return new Date() < new Date(this.expiresAt);
};

// Método para extender la duración del bloqueo
userBlockSchema.methods.extend = async function(moderator, additionalDuration, reason) {
  if (this.isPermanent) {
    throw new Error('No se puede extender un bloqueo permanente');
  }

  const previousExpiry = this.expiresAt;
  const now = new Date();

  let newExpiry = new Date(previousExpiry || now);
  const { value, unit } = additionalDuration;

  switch (unit) {
    case 'minutes':
      newExpiry.setMinutes(newExpiry.getMinutes() + value);
      break;
    case 'hours':
      newExpiry.setHours(newExpiry.getHours() + value);
      break;
    case 'days':
      newExpiry.setDate(newExpiry.getDate() + value);
      break;
    case 'weeks':
      newExpiry.setDate(newExpiry.getDate() + (value * 7));
      break;
    case 'months':
      newExpiry.setMonth(newExpiry.getMonth() + value);
      break;
  }

  // Registrar extensión
  this.extensions.push({
    extendedBy: moderator.id || moderator,
    extendedAt: now,
    previousExpiry,
    newExpiry,
    reason,
    additionalDuration
  });

  this.expiresAt = newExpiry;
  this.updatedAt = now;

  return this.save();
};

// Método para levantar el bloqueo
userBlockSchema.methods.lift = async function(moderator, reason) {
  this.status = 'lifted';
  this.updatedAt = new Date();

  // Agregar nota interna
  this.internalNotes.push({
    moderator: moderator.id || moderator,
    note: `Bloqueo levantado: ${reason}`,
    createdAt: new Date()
  });

  return this.save();
};

// Método para solicitar apelación
userBlockSchema.methods.requestAppeal = async function(reason) {
  if (this.appeal.requested) {
    throw new Error('Ya se ha solicitado una apelación para este bloqueo');
  }

  this.appeal = {
    requested: true,
    requestedAt: new Date(),
    reason
  };

  return this.save();
};

// Método para revisar apelación
userBlockSchema.methods.reviewAppeal = async function(moderator, decision, notes) {
  if (!this.appeal.requested) {
    throw new Error('No hay apelación pendiente para este bloqueo');
  }

  this.appeal.reviewedBy = moderator.id || moderator;
  this.appeal.reviewedAt = new Date();
  this.appeal.decision = decision;
  this.appeal.reviewNotes = notes;

  // Si se aprueba la apelación, levantar el bloqueo
  if (decision === 'approved') {
    this.status = 'lifted';
  }

  return this.save();
};

// Método estático para obtener bloqueos activos de un usuario
userBlockSchema.statics.getActiveBlocksForUser = function(userId) {
  return this.find({
    userId,
    status: 'active',
    $or: [
      { isPermanent: true },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

// Método estático para limpiar bloqueos expirados
userBlockSchema.statics.cleanExpiredBlocks = function() {
  return this.updateMany(
    {
      status: 'active',
      isPermanent: false,
      expiresAt: { $lte: new Date() }
    },
    { status: 'expired' }
  );
};

// Método estático para obtener estadísticas de bloqueos
userBlockSchema.statics.getBlockStats = function(startDate, endDate) {
  const matchConditions = { createdAt: { $gte: startDate, $lte: endDate } };

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          blockType: '$blockType',
          status: '$status'
        },
        count: { $sum: 1 },
        moderators: { $addToSet: '$moderator.id' }
      }
    },
    {
      $group: {
        _id: '$_id.status',
        types: {
          $push: {
            type: '$_id.blockType',
            count: '$count'
          }
        },
        totalBlocks: { $sum: '$count' },
        uniqueModerators: { $addToSet: '$moderators' }
      }
    }
  ]);
};

const UserBlock = mongoose.model('UserBlock', userBlockSchema);

module.exports = UserBlock;