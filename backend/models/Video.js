/**
 * Modelo de Video para almacenar información de videos en MongoDB
 * Compatible con YouTube API y asociaciones con discografía
 *
 * @author KimJesus21
 * @version 1.0.0
 * @since 2025-09-20
 */

const mongoose = require('mongoose');

const videoStatisticsSchema = new mongoose.Schema({
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  favoriteCount: { type: Number, default: 0 }
}, { _id: false });

const videoSchema = new mongoose.Schema({
  // Información básica del video
  videoId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000
  },

  // Información del canal
  channelId: {
    type: String,
    required: true,
    index: true
  },
  channelTitle: {
    type: String,
    required: true,
    trim: true
  },

  // URLs y thumbnails
  url: {
    type: String,
    required: true
  },
  embedUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },

  // Fechas
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Estadísticas del video
  statistics: videoStatisticsSchema,

  // Metadatos adicionales
  duration: {
    type: String,
    default: '0:00'
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  categoryId: {
    type: String,
    default: '10' // Música por defecto
  },

  // Estado del video
  privacyStatus: {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'public'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },

  // Asociaciones con discografía
  associatedSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  associatedAlbums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  }],

  // Metadatos de búsqueda y filtros
  searchQuery: {
    type: String,
    index: true
  },
  source: {
    type: String,
    enum: ['youtube_api', 'manual', 'import'],
    default: 'youtube_api'
  },

  // Control de calidad y moderación
  isVerified: {
    type: Boolean,
    default: false
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },

  // Cache y optimización
  cacheExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
  },

  // Metadatos del sistema
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  accessCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización de consultas
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ publishedAt: -1 });
videoSchema.index({ 'statistics.viewCount': -1 });
videoSchema.index({ channelId: 1, publishedAt: -1 });
videoSchema.index({ associatedSongs: 1 });
videoSchema.index({ associatedAlbums: 1 });
videoSchema.index({ cacheExpiry: 1 });

// Virtual para verificar si el cache está expirado
videoSchema.virtual('isCacheExpired').get(function() {
  return new Date() > this.cacheExpiry;
});

// Método para actualizar estadísticas
videoSchema.methods.updateStatistics = function(newStats) {
  this.statistics = { ...this.statistics, ...newStats };
  this.updatedAt = new Date();
  return this.save();
};

// Método para incrementar contador de acceso
videoSchema.methods.incrementAccess = function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Método para asociar con canción
videoSchema.methods.associateWithSong = function(songId) {
  if (!this.associatedSongs.includes(songId)) {
    this.associatedSongs.push(songId);
    this.updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Método para asociar con álbum
videoSchema.methods.associateWithAlbum = function(albumId) {
  if (!this.associatedAlbums.includes(albumId)) {
    this.associatedAlbums.push(albumId);
    this.updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Método estático para buscar videos populares
videoSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isAvailable: true })
    .sort({ 'statistics.viewCount': -1 })
    .limit(limit)
    .populate('associatedSongs', 'title artist')
    .populate('associatedAlbums', 'title artist releaseYear');
};

// Método estático para buscar videos recientes
videoSchema.statics.findRecent = function(limit = 10) {
  return this.find({ isAvailable: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('associatedSongs', 'title artist')
    .populate('associatedAlbums', 'title artist releaseYear');
};

// Método estático para buscar por canal
videoSchema.statics.findByChannel = function(channelId, limit = 20) {
  return this.find({
    channelId,
    isAvailable: true
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .populate('associatedSongs', 'title artist')
  .populate('associatedAlbums', 'title artist releaseYear');
};

// Método estático para limpiar cache expirado
videoSchema.statics.cleanExpiredCache = function() {
  return this.deleteMany({
    cacheExpiry: { $lt: new Date() }
  });
};

// Pre-save middleware para actualizar cacheExpiry
videoSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.cacheExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  }
  next();
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;