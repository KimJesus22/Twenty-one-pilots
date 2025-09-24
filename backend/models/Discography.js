const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lyrics: { type: String },
  duration: { type: String },
  trackNumber: { type: Number, default: 1 },
  album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
  spotifyId: { type: String },
  youtubeId: { type: String },
  previewUrl: { type: String },
  popularity: { type: Number, default: 0 },
  playCount: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Enlaces externos para letras y contenido adicional
  externalLinks: {
    genius: { type: String }, // Enlace a Genius para letras
    musicbrainz: { type: String }, // Enlace a MusicBrainz
    wikidata: { type: String }, // Enlace a Wikidata
    lyricsUrl: { type: String }, // URL directa a letras
    officialLyrics: { type: String } // URL oficial de letras
  },

  // Créditos de la canción
  credits: {
    writers: [{ type: String }], // Compositores/letristas
    producers: [{ type: String }], // Productores
    featuredArtists: [{ type: String }], // Artistas invitados
    additionalCredits: [{
      role: { type: String }, // Rol (ej: "Guitarra", "Batería")
      name: { type: String }  // Nombre de la persona
    }]
  },

  // Información adicional
  isrc: { type: String }, // Código ISRC internacional
  bpm: { type: Number }, // Beats por minuto
  key: { type: String }, // Tonalidad musical

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  releaseYear: { type: Number, required: true },
  coverImage: { type: String },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  artist: { type: String, default: 'Twenty One Pilots' },
  genre: {
    type: String,
    enum: ['rock', 'alternative', 'indie', 'pop', 'electronic', 'other'],
    default: 'alternative'
  },
  type: {
    type: String,
    enum: ['album', 'ep', 'single', 'compilation', 'live'],
    default: 'album'
  },
  totalDuration: { type: String },
  spotifyId: { type: String },
  youtubeId: { type: String },
  popularity: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  price: { type: Number, default: 0 }, // Para compras digitales
  isAvailable: { type: Boolean, default: true },

  // Sistema de ratings
  rating: { type: Number, default: 0, min: 0, max: 5 }, // Rating promedio
  ratingCount: { type: Number, default: 0 }, // Número total de ratings
  ratingDistribution: {
    one: { type: Number, default: 0 },
    two: { type: Number, default: 0 },
    three: { type: Number, default: 0 },
    four: { type: Number, default: 0 },
    five: { type: Number, default: 0 }
  },

  // Sistema de comentarios/reseñas
  commentCount: { type: Number, default: 0 }, // Número total de comentarios
  avgCommentRating: { type: Number, min: 0, max: 5 }, // Rating promedio de reseñas
  featuredComments: { type: Number, default: 0 }, // Número de reseñas destacadas

  // Enlaces externos oficiales
  externalLinks: {
    spotify: { type: String }, // URL completa de Spotify
    appleMusic: { type: String }, // URL completa de Apple Music
    youtube: { type: String }, // URL completa del canal/artista
    youtubeMusic: { type: String }, // URL de YouTube Music
    deezer: { type: String }, // URL de Deezer
    tidal: { type: String }, // URL de Tidal
    amazonMusic: { type: String }, // URL de Amazon Music
    genius: { type: String }, // URL de Genius para letras
    musicbrainz: { type: String }, // URL de MusicBrainz
    discogs: { type: String }, // URL de Discogs
    allmusic: { type: String }, // URL de AllMusic
    wikipedia: { type: String }, // URL de Wikipedia
    officialWebsite: { type: String } // Sitio web oficial
  },

  // Créditos del álbum
  credits: {
    executiveProducer: { type: String },
    producers: [{ type: String }],
    coProducers: [{ type: String }],
    engineers: [{ type: String }],
    mixingEngineers: [{ type: String }],
    masteringEngineers: [{ type: String }],
    additionalCredits: [{
      role: { type: String },
      names: [{ type: String }]
    }],
    artworkBy: { type: String },
    photographyBy: { type: String },
    designBy: { type: String }
  },

  // Notas de producción y detalles
  productionNotes: {
    recordingLocation: { type: String },
    recordingDates: { type: String },
    mixingLocation: { type: String },
    masteringLocation: { type: String },
    studio: { type: String },
    equipment: { type: String },
    additionalInfo: { type: String }
  },

  // Información adicional
  upc: { type: String }, // Código UPC/EAN
  catalogNumber: { type: String }, // Número de catálogo
  label: { type: String, default: 'Fueled By Ramen' },
  copyright: { type: String },
  releaseDate: { type: Date }, // Fecha exacta de lanzamiento

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Agregar paginación a los esquemas
songSchema.plugin(mongoosePaginate);
albumSchema.plugin(mongoosePaginate);

const Song = mongoose.model('Song', songSchema);
const Album = mongoose.model('Album', albumSchema);

module.exports = { Song, Album };