const mongoose = require('mongoose');

const concertTriviaSchema = new mongoose.Schema({
  concert: { type: mongoose.Schema.Types.ObjectId, ref: 'Concert', required: true },
  type: {
    type: String,
    enum: ['trivia', 'review', 'behind_the_scenes', 'fan_story'],
    required: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images: [{ type: String }], // URLs de imágenes
  tags: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() { return this.type === 'review'; }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Índices para búsquedas eficientes
concertTriviaSchema.index({ concert: 1, type: 1 });
concertTriviaSchema.index({ tags: 1 });
concertTriviaSchema.index({ content: 'text', title: 'text' });

// Virtual para contar likes
concertTriviaSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual para contar comentarios
concertTriviaSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Middleware para actualizar updatedAt
concertTriviaSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ConcertTrivia = mongoose.model('ConcertTrivia', concertTriviaSchema);

module.exports = ConcertTrivia;