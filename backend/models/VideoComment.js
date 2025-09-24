const mongoose = require('mongoose');

// Schema para votos (reutilizado del foro)
const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'dislike'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Schema para comentarios de videos
const videoCommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoComment'
  }, // Para respuestas anidadas
  votes: [voteSchema],
  voteCount: {
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
  },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isModerated: { type: Boolean, default: false },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  moderationReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
videoCommentSchema.index({ video: 1, createdAt: 1 });
videoCommentSchema.index({ author: 1, createdAt: -1 });
videoCommentSchema.index({ parentComment: 1 });
videoCommentSchema.index({ 'voteCount.likes': -1 });

// Método para votar en comentario
videoCommentSchema.methods.addVote = function(userId, voteType) {
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

// Método para verificar si un usuario ya votó
videoCommentSchema.methods.getUserVote = function(userId) {
  const vote = this.votes.find(vote => vote.user.toString() === userId.toString());
  return vote ? vote.type : null;
};

// Método para moderar comentario
videoCommentSchema.methods.moderate = function(moderatorId, reason) {
  this.isModerated = true;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
  return this.save();
};

// Método estático para obtener comentarios de un video
videoCommentSchema.statics.getVideoComments = function(videoId, page = 1, limit = 20) {
  return this.find({ video: videoId, parentComment: null, isModerated: false })
    .populate('author', 'username')
    .populate({
      path: 'parentComment',
      populate: { path: 'author', select: 'username' }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Método estático para obtener respuestas de un comentario
videoCommentSchema.statics.getCommentReplies = function(commentId, page = 1, limit = 10) {
  return this.find({ parentComment: commentId, isModerated: false })
    .populate('author', 'username')
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Método estático para contar comentarios de un video
videoCommentSchema.statics.countVideoComments = function(videoId) {
  return this.countDocuments({ video: videoId, isModerated: false });
};

// Pre-save hook
videoCommentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const VideoComment = mongoose.model('VideoComment', videoCommentSchema);

module.exports = VideoComment;