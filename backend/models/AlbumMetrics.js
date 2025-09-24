const mongoose = require('mongoose');

const albumMetricsSchema = new mongoose.Schema({
  album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true },

  // Métricas principales
  popularity: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  playCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },

  // Métricas adicionales
  streams: { type: Number, default: 0 }, // Para plataformas de streaming
  downloads: { type: Number, default: 0 }, // Descargas digitales
  sales: { type: Number, default: 0 }, // Ventas físicas/digitales

  // Plataformas específicas
  spotifyStreams: { type: Number, default: 0 },
  youtubeViews: { type: Number, default: 0 },
  appleMusicStreams: { type: Number, default: 0 },

  // Fecha de captura de estas métricas
  capturedAt: { type: Date, default: Date.now, required: true },

  // Fuente de los datos (manual, spotify, youtube, etc.)
  source: {
    type: String,
    enum: ['manual', 'spotify', 'youtube', 'apple_music', 'deezer', 'api'],
    default: 'manual'
  },

  // Metadatos adicionales
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
});

// Índices para búsquedas eficientes
albumMetricsSchema.index({ album: 1, capturedAt: -1 });
albumMetricsSchema.index({ album: 1, source: 1 });
albumMetricsSchema.index({ capturedAt: -1 });

// Método para obtener métricas en un rango de fechas
albumMetricsSchema.statics.getMetricsInRange = async function(albumId, startDate, endDate, metric = 'popularity') {
  return this.find({
    album: albumId,
    capturedAt: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .sort({ capturedAt: 1 })
  .select(`capturedAt ${metric}`)
  .lean();
};

// Método para obtener últimas métricas de un álbum
albumMetricsSchema.statics.getLatestMetrics = async function(albumId) {
  return this.findOne({ album: albumId })
    .sort({ capturedAt: -1 })
    .lean();
};

// Método para crear snapshot de métricas actual
albumMetricsSchema.statics.createSnapshot = async function(albumId, source = 'api') {
  const Album = mongoose.model('Album');

  // Obtener datos actuales del álbum
  const album = await Album.findById(albumId);
  if (!album) {
    throw new Error('Album not found');
  }

  // Crear snapshot
  const snapshot = new this({
    album: albumId,
    popularity: album.popularity || 0,
    views: album.views || 0,
    likes: album.likes?.length || 0,
    playCount: album.playCount || 0,
    rating: album.rating || 0,
    ratingCount: album.ratingCount || 0,
    commentCount: album.commentCount || 0,
    source
  });

  await snapshot.save();
  return snapshot;
};

const AlbumMetrics = mongoose.model('AlbumMetrics', albumMetricsSchema);

module.exports = AlbumMetrics;