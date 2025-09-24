const mongoose = require('mongoose');

// Schema para votos en comentarios
const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'dislike'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Schema para comentarios de música
const musicCommentSchema = new mongoose.Schema({
  // Contenido de la reseña/comentario
  title: {
    type: String,
    maxlength: 100,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },

  // Referencia al elemento comentado
  targetType: {
    type: String,
    enum: ['album', 'song'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // Autor del comentario
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Sistema de replies (comentarios anidados)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MusicComment'
  },

  // Rating opcional (para reseñas destacadas)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },

  // Votos y engagement
  votes: [voteSchema],
  voteCount: {
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
  },

  // Información adicional para reseñas
  pros: [{ type: String, maxlength: 100 }], // Aspectos positivos
  cons: [{ type: String, maxlength: 100 }], // Aspectos negativos
  recommended: { type: Boolean, default: true },

  // Moderación
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'approved' // Por defecto aprobado para música
  },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  moderationReason: { type: String },

  // Reportes
  reports: [{
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    reportedAt: { type: Date, default: Date.now }
  }],

  // Metadata
  ipAddress: { type: String },
  userAgent: { type: String },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  editHistory: [{
    previousTitle: { type: String },
    previousContent: { type: String },
    editedAt: { type: Date, default: Date.now }
  }],

  // Estadísticas
  replyCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }, // Reseña destacada

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
musicCommentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
musicCommentSchema.index({ author: 1, createdAt: -1 });
musicCommentSchema.index({ parentComment: 1 });
musicCommentSchema.index({ status: 1 });
musicCommentSchema.index({ 'voteCount.likes': -1 });
musicCommentSchema.index({ rating: -1 });
musicCommentSchema.index({ isFeatured: -1 });

// Índice único: un usuario solo puede tener una reseña por elemento (no replies)
musicCommentSchema.index(
  { targetType: 1, targetId: 1, author: 1, parentComment: { $exists: false } },
  { unique: true, partialFilterExpression: { parentComment: { $exists: false } } }
);

// Middleware para actualizar estadísticas
musicCommentSchema.post('save', async function() {
  // Actualizar contador de replies en comentario padre
  if (this.parentComment) {
    await mongoose.model('MusicComment').findByIdAndUpdate(
      this.parentComment,
      { $inc: { replyCount: 1 } }
    );
  }

  // Actualizar estadísticas del target
  await updateTargetCommentStats(this.targetType, this.targetId);
});

musicCommentSchema.post('remove', async function() {
  // Actualizar contador de replies en comentario padre
  if (this.parentComment) {
    await mongoose.model('MusicComment').findByIdAndUpdate(
      this.parentComment,
      { $inc: { replyCount: -1 } }
    );
  }

  // Actualizar estadísticas del target
  await updateTargetCommentStats(this.targetType, this.targetId);
});

// Función para actualizar estadísticas de comentarios
async function updateTargetCommentStats(targetType, targetId) {
  const MusicComment = mongoose.model('MusicComment');

  const stats = await MusicComment.aggregate([
    {
      $match: {
        targetType: targetType,
        targetId: mongoose.Types.ObjectId(targetId),
        status: 'approved',
        parentComment: { $exists: false } // Solo comentarios principales
      }
    },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        featuredCount: {
          $sum: { $cond: ['$isFeatured', 1, 0] }
        }
      }
    }
  ]);

  if (stats.length > 0) {
    const stat = stats[0];

    // Actualizar el documento correspondiente
    if (targetType === 'album') {
      const Discography = mongoose.model('Discography');
      await Discography.findByIdAndUpdate(targetId, {
        commentCount: stat.totalComments,
        avgCommentRating: stat.avgRating ? Math.round(stat.avgRating * 10) / 10 : null,
        featuredComments: stat.featuredCount
      });
    }
  }
}

// Método para votar en comentario
musicCommentSchema.methods.addVote = function(userId, voteType) {
  const existingVoteIndex = this.votes.findIndex(vote =>
    vote.user.toString() === userId.toString()
  );

  if (existingVoteIndex > -1) {
    const oldVote = this.votes[existingVoteIndex].type;
    if (oldVote === voteType) {
      // Remover voto si es el mismo
      this.votes.splice(existingVoteIndex, 1);
      this.voteCount[oldVote + 's'] -= 1;
    } else {
      // Cambiar tipo de voto
      this.votes[existingVoteIndex].type = voteType;
      this.voteCount[oldVote + 's'] -= 1;
      this.voteCount[voteType + 's'] += 1;
    }
  } else {
    // Agregar nuevo voto
    this.votes.push({ user: userId, type: voteType });
    this.voteCount[voteType + 's'] += 1;
  }

  return this.save();
};

// Método para verificar voto de usuario
musicCommentSchema.methods.getUserVote = function(userId) {
  const vote = this.votes.find(vote => vote.user.toString() === userId.toString());
  return vote ? vote.type : null;
};

// Método para reportar comentario
musicCommentSchema.methods.report = function(userId, reason) {
  const alreadyReported = this.reports.some(report =>
    report.reportedBy.toString() === userId.toString()
  );

  if (!alreadyReported) {
    this.reports.push({
      reportedBy: userId,
      reason
    });
    return this.save();
  }

  throw new Error('Ya has reportado este comentario');
};

// Método para moderar comentario
musicCommentSchema.methods.moderate = function(status, moderatedBy, reason = '') {
  this.status = status;
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
  return this.save();
};

// Método para editar comentario
musicCommentSchema.methods.edit = function(newTitle, newContent) {
  if (this.isEdited) {
    throw new Error('Los comentarios solo pueden editarse una vez');
  }

  this.editHistory.push({
    previousTitle: this.title,
    previousContent: this.content,
    editedAt: new Date()
  });

  this.title = newTitle;
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  this.updatedAt = new Date();

  return this.save();
};

// Método para marcar como destacado
musicCommentSchema.methods.feature = function(featured = true) {
  this.isFeatured = featured;
  return this.save();
};

// Método estático para obtener comentarios de un elemento
musicCommentSchema.statics.getComments = function(targetType, targetId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc',
    includeReplies = false,
    status = 'approved'
  } = options;

  const query = {
    targetType,
    targetId,
    status,
    parentComment: { $exists: false } // Solo comentarios principales
  };

  const sortOption = { [sort]: order === 'desc' ? -1 : 1 };

  let queryBuilder = this.find(query)
    .populate('author', 'username avatar')
    .sort(sortOption)
    .limit(limit)
    .skip((page - 1) * limit);

  if (includeReplies) {
    queryBuilder = queryBuilder.populate({
      path: 'replies',
      populate: { path: 'author', select: 'username avatar' },
      options: { sort: { createdAt: 1 }, limit: 5 }
    });
  }

  return queryBuilder;
};

// Método estático para obtener replies de un comentario
musicCommentSchema.statics.getCommentReplies = function(commentId, page = 1, limit = 10) {
  return this.find({
    parentComment: commentId,
    status: 'approved'
  })
    .populate('author', 'username avatar')
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Método estático para contar comentarios
musicCommentSchema.statics.countComments = function(targetType, targetId, status = 'approved') {
  return this.countDocuments({
    targetType,
    targetId,
    status,
    parentComment: { $exists: false }
  });
};

// Método estático para verificar si usuario puede comentar
musicCommentSchema.statics.canUserComment = function(targetType, targetId, userId) {
  return this.findOne({
    targetType,
    targetId,
    author: userId,
    parentComment: { $exists: false }
  }).select('_id');
};

// Pre-save hook
musicCommentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MusicComment = mongoose.model('MusicComment', musicCommentSchema);

module.exports = MusicComment;