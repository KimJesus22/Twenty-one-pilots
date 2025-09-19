const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lyrics: { type: String },
  duration: { type: String },
  album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
});

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  releaseYear: { type: Number, required: true },
  coverImage: { type: String },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
});

// Agregar paginación a los esquemas
songSchema.plugin(mongoosePaginate);
albumSchema.plugin(mongoosePaginate);

const Song = mongoose.model('Song', songSchema);
const Album = mongoose.model('Album', albumSchema);

module.exports = { Song, Album };