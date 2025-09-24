const mongoose = require('mongoose');

const eventMusicSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  album: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['song', 'album', 'ep', 'single', 'playlist', 'live_recording'],
    default: 'song'
  },
  platforms: {
    spotify: {
      id: String,
      url: String,
      embedUrl: String
    },
    youtube: {
      id: String,
      url: String,
      embedUrl: String
    },
    appleMusic: {
      id: String,
      url: String
    },
    deezer: {
      id: String,
      url: String
    },
    soundcloud: {
      id: String,
      url: String,
      embedUrl: String
    }
  },
  metadata: {
    duration: Number, // en segundos
    releaseDate: Date,
    genre: [{
      type: String,
      trim: true
    }],
    bpm: Number,
    key: String,
    lyrics: String,
    explicit: {
      type: Boolean,
      default: false
    }
  },
  artwork: {
    url: String,
    thumbnail: String,
    alt: String
  },
  stats: {
    plays: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    spotifyPopularity: Number, // 0-100
    youtubeViews: Number
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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

// Índices para consultas eficientes
eventMusicSchema.index({ event: 1, type: 1 });
eventMusicSchema.index({ event: 1, isFeatured: 1 });
eventMusicSchema.index({ event: 1, priority: -1 });
eventMusicSchema.index({ artist: 1 });
eventMusicSchema.index({ 'platforms.spotify.id': 1 });
eventMusicSchema.index({ 'platforms.youtube.id': 1 });
eventMusicSchema.index({ tags: 1 });

// Middleware para actualizar updatedAt
eventMusicSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para incrementar reproducciones
eventMusicSchema.methods.incrementPlays = async function(platform = 'unknown') {
  this.stats.plays += 1;

  // Actualizar estadísticas específicas de plataforma si es necesario
  if (platform === 'spotify' && this.platforms.spotify) {
    // Aquí iría lógica para actualizar desde Spotify API
  }

  return this.save();
};

// Método para agregar like
eventMusicSchema.methods.addLike = async function() {
  this.stats.likes += 1;
  return this.save();
};

// Método para quitar like
eventMusicSchema.methods.removeLike = async function() {
  this.stats.likes = Math.max(0, this.stats.likes - 1);
  return this.save();
};

// Método para incrementar shares
eventMusicSchema.methods.incrementShares = async function() {
  this.stats.shares += 1;
  return this.save();
};

// Método para obtener URL de embed principal
eventMusicSchema.methods.getPrimaryEmbedUrl = function() {
  // Prioridad: Spotify > YouTube > SoundCloud > Apple Music
  if (this.platforms.spotify?.embedUrl) {
    return this.platforms.spotify.embedUrl;
  }
  if (this.platforms.youtube?.embedUrl) {
    return this.platforms.youtube.embedUrl;
  }
  if (this.platforms.soundcloud?.embedUrl) {
    return this.platforms.soundcloud.embedUrl;
  }
  return null;
};

// Método para obtener URL de reproducción principal
eventMusicSchema.methods.getPrimaryPlayUrl = function() {
  // Prioridad: Spotify > YouTube > Apple Music > Deezer > SoundCloud
  if (this.platforms.spotify?.url) {
    return this.platforms.spotify.url;
  }
  if (this.platforms.youtube?.url) {
    return this.platforms.youtube.url;
  }
  if (this.platforms.appleMusic?.url) {
    return this.platforms.appleMusic.url;
  }
  if (this.platforms.deezer?.url) {
    return this.platforms.deezer.url;
  }
  if (this.platforms.soundcloud?.url) {
    return this.platforms.soundcloud.url;
  }
  return null;
};

// Método estático para obtener música de un evento
eventMusicSchema.statics.getEventMusic = function(eventId, options = {}) {
  const query = { event: eventId };

  if (options.type) query.type = options.type;
  if (options.featuredOnly) query.isFeatured = true;
  if (options.exclusiveOnly) query.isExclusive = true;

  const musicQuery = this.find(query)
    .sort({ priority: -1, isFeatured: -1, 'stats.plays': -1, createdAt: -1 });

  if (options.limit) musicQuery.limit(options.limit);
  if (options.skip) musicQuery.skip(options.skip);

  return musicQuery;
};

// Método estático para obtener música destacada
eventMusicSchema.statics.getFeaturedMusic = function(eventId, limit = 10) {
  return this.find({
    event: eventId,
    isFeatured: true
  })
  .sort({ priority: -1, 'stats.plays': -1 })
  .limit(limit);
};

// Método estático para buscar música
eventMusicSchema.statics.searchMusic = function(eventId, searchTerm, limit = 20) {
  const searchRegex = new RegExp(searchTerm, 'i');

  return this.find({
    event: eventId,
    $or: [
      { title: searchRegex },
      { artist: searchRegex },
      { album: searchRegex },
      { tags: searchRegex }
    ]
  })
  .sort({ priority: -1, isFeatured: -1 })
  .limit(limit);
};

// Método estático para obtener playlist recomendada
eventMusicSchema.statics.getRecommendedPlaylist = function(eventId, limit = 20) {
  return this.find({ event: eventId })
    .sort({
      isFeatured: -1,
      priority: -1,
      'stats.plays': -1,
      'stats.likes': -1
    })
    .limit(limit);
};

// Método estático para obtener estadísticas musicales
eventMusicSchema.statics.getMusicStats = async function(eventId) {
  const stats = await this.aggregate([
    { $match: { event: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: null,
        totalTracks: { $sum: 1 },
        featuredTracks: {
          $sum: { $cond: ['$isFeatured', 1, 0] }
        },
        exclusiveTracks: {
          $sum: { $cond: ['$isExclusive', 1, 0] }
        },
        totalPlays: { $sum: '$stats.plays' },
        totalLikes: { $sum: '$stats.likes' },
        totalShares: { $sum: '$stats.shares' },
        avgSpotifyPopularity: { $avg: '$stats.spotifyPopularity' },
        platformsCount: {
          $sum: {
            $add: [
              { $cond: [{ $ne: ['$platforms.spotify', null] }, 1, 0] },
              { $cond: [{ $ne: ['$platforms.youtube', null] }, 1, 0] },
              { $cond: [{ $ne: ['$platforms.appleMusic', null] }, 1, 0] },
              { $cond: [{ $ne: ['$platforms.deezer', null] }, 1, 0] },
              { $cond: [{ $ne: ['$platforms.soundcloud', null] }, 1, 0] }
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalTracks: 0,
    featuredTracks: 0,
    exclusiveTracks: 0,
    totalPlays: 0,
    totalLikes: 0,
    totalShares: 0,
    avgSpotifyPopularity: 0,
    platformsCount: 0
  };
};

// Método estático para sincronizar con APIs externas
eventMusicSchema.statics.syncWithPlatforms = async function(musicId) {
  const music = await this.findById(musicId);
  if (!music) return null;

  // Aquí iría la lógica para sincronizar con APIs de plataformas
  // Spotify API, YouTube API, etc.

  // Por ahora, solo actualizamos la fecha de modificación
  music.updatedAt = new Date();
  return music.save();
};

const EventMusic = mongoose.model('EventMusic', eventMusicSchema);

module.exports = EventMusic;