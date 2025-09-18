const mongoose = require('mongoose');

const lyricsSchema = new mongoose.Schema({
  song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
  content: { type: String, required: true },
  language: { type: String, default: 'en' },
  isOfficial: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verificationDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Índice para búsquedas de texto en letras
lyricsSchema.index({ content: 'text' });

// Middleware para actualizar updatedAt
lyricsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Lyrics = mongoose.model('Lyrics', lyricsSchema);

module.exports = Lyrics;