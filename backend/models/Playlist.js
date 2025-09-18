const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;