const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  isPublic: { type: Boolean, default: false },
  isCollaborative: { type: Boolean, default: false },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shareUrl: { type: String, unique: true },
  tags: [{ type: String }],
  playCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Generar URL de compartir única antes de guardar
playlistSchema.pre('save', function(next) {
  if (this.isNew && !this.shareUrl) {
    this.shareUrl = `playlist_${this._id}_${Date.now()}`;
  }
  this.updatedAt = new Date();
  next();
});

// Método para dar/quitar like
playlistSchema.methods.toggleLike = async function(userId) {
  const userIndex = this.likes.indexOf(userId);
  if (userIndex > -1) {
    this.likes.splice(userIndex, 1);
  } else {
    this.likes.push(userId);
  }
  await this.save();
  return this.likes.length;
};

// Método para agregar colaborador
playlistSchema.methods.addCollaborator = async function(userId) {
  if (!this.collaborators.includes(userId) && this.user.toString() !== userId.toString()) {
    this.collaborators.push(userId);
    await this.save();
  }
  return this.collaborators;
};

// Método para verificar permisos de edición
playlistSchema.methods.canEdit = function(userId) {
  return this.user.toString() === userId.toString() ||
         this.collaborators.some(collab => collab.toString() === userId.toString());
};

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;