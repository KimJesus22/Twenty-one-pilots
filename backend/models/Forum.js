const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Schema para votos
const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'dislike'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Schema para comentarios
const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // Para respuestas anidadas
  votes: [voteSchema],
  voteCount: {
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
  },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Schema para hilos
const threadSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxLength: 200 },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['general', 'music', 'concerts', 'merchandise', 'fan-art', 'questions', 'announcements'],
    default: 'general'
  },
  tags: [{ type: String, trim: true, lowercase: true }],
  votes: [voteSchema],
  voteCount: {
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
  },
  viewCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
threadSchema.index({ title: 'text', content: 'text', tags: 'text' });
threadSchema.index({ category: 1, createdAt: -1 });
threadSchema.index({ author: 1, createdAt: -1 });
threadSchema.index({ isPinned: -1, lastActivity: -1 });
threadSchema.index({ voteCount: -1 });

commentSchema.index({ thread: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });

// Métodos para calcular popularidad
threadSchema.methods.getPopularityScore = function() {
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const score = this.voteCount.likes - this.voteCount.dislikes;
  // Algoritmo simple: score / (edad en horas + 2)^1.5
  return score / Math.pow(ageInHours + 2, 1.5);
};

// Método para incrementar vistas
threadSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

// Método para actualizar conteo de comentarios
threadSchema.methods.updateCommentCount = async function() {
  const Comment = mongoose.model('Comment');
  this.commentCount = await Comment.countDocuments({ thread: this._id });
  return this.save();
};

// Método para votar en hilo
threadSchema.methods.addVote = function(userId, voteType) {
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

  this.lastActivity = new Date();
  return this.save();
};

// Método para votar en comentario
commentSchema.methods.addVote = function(userId, voteType) {
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

// Pre-save hooks
threadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified()) {
    this.lastActivity = Date.now();
  }
  next();
});

commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Agregar paginación
threadSchema.plugin(mongoosePaginate);
commentSchema.plugin(mongoosePaginate);

const Vote = mongoose.model('Vote', voteSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Thread = mongoose.model('Thread', threadSchema);

module.exports = { Thread, Comment, Vote };