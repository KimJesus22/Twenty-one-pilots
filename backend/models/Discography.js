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
  createdAt: { type: Date, default: Date.now },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Agregar paginación a los esquemas
songSchema.plugin(mongoosePaginate);
albumSchema.plugin(mongoosePaginate);

const Song = mongoose.model('Song', songSchema);
const Album = mongoose.model('Album', albumSchema);

module.exports = { Song, Album };