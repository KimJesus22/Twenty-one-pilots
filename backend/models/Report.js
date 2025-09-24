const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Usuario que reporta
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Contenido reportado
  targetType: {
    type: String,
    enum: ['thread', 'comment', 'user'],
    required: true
  },

  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Referencia dinámica basada en targetType
    refPath: 'targetModel'
  },

  targetModel: {
    type: String,
    enum: ['ForumThread', 'ForumComment', 'User'],
    required: true
  },

  // Detalles del reporte
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'hate_speech', 'inappropriate', 'violence', 'misinformation', 'other'],
    required: true
  },

  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },

  // Evidencia adicional
  evidence: [{
    type: {
      type: String,
      enum: ['text', 'image', 'link'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    description: String
  }],

  // Estado del reporte
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },

  // Moderador que revisó el reporte
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Acción tomada
  actionTaken: {
    type: String,
    enum: ['none', 'warned', 'content_deleted', 'user_suspended', 'user_banned']
  },

  // Resolución del reporte
  resolution: {
    decision: {
      type: String,
      enum: ['valid', 'invalid', 'needs_more_info']
    },
    notes: String,
    resolvedAt: Date
  },

  // Metadatos
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'low'
  },

  // Sistema de votos para reportes similares
  votes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['up', 'down'] },
    votedAt: { type: Date, default: Date.now }
  }],

  // Estadísticas
  viewCount: {
    type: Number,
    default: 0
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para optimización
reportSchema.index({ status: 1, priority: -1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ reviewedBy: 1, updatedAt: -1 });

// Middleware para actualizar updatedAt
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para calcular intensidad del reporte
reportSchema.methods.calculateIntensity = function() {
  // Basado en votos positivos y prioridad
  const upVotes = this.votes.filter(v => v.vote === 'up').length;
  const downVotes = this.votes.filter(v => v.vote === 'down').length;

  let intensity = upVotes - downVotes;

  // Bonus por prioridad
  if (this.priority === 'high') intensity += 2;
  if (this.priority === 'urgent') intensity += 5;

  return Math.max(0, intensity);
};

// Método para votar en un reporte
reportSchema.methods.addVote = async function(userId, vote) {
  // Remover voto anterior del usuario
  this.votes = this.votes.filter(v => !v.user.equals(userId));

  // Agregar nuevo voto
  this.votes.push({
    user: userId,
    vote: vote,
    votedAt: new Date()
  });

  // Recalcular prioridad basada en intensidad
  const intensity = this.calculateIntensity();
  if (intensity >= 10) {
    this.priority = 'urgent';
  } else if (intensity >= 5) {
    this.priority = 'high';
  } else if (intensity >= 2) {
    this.priority = 'medium';
  }

  return this.save();
};

// Método estático para obtener reportes pendientes
reportSchema.statics.getPendingReports = function(limit = 50) {
  return this.find({ status: 'pending' })
    .populate('reporter', 'username')
    .populate('reviewedBy', 'username')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit);
};

// Método estático para obtener reportes por contenido
reportSchema.statics.getReportsForContent = function(targetType, targetId) {
  return this.find({
    targetType,
    targetId,
    status: { $in: ['pending', 'reviewed'] }
  })
  .populate('reporter', 'username')
  .sort({ createdAt: -1 });
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;