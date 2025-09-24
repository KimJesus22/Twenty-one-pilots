const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxLength: 100 },
  description: { type: String, maxLength: 500 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Contenido de la playlist
  videos: [{
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Number, default: 0 }
  }],

  // Configuración de privacidad y colaboración
  isPublic: { type: Boolean, default: false },
  isCollaborative: { type: Boolean, default: false },
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor', 'admin'], default: 'viewer' },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Sistema de compartir
  shareUrl: { type: String, unique: true, sparse: true },
  shareSettings: {
    isEnabled: { type: Boolean, default: false },
    allowCopy: { type: Boolean, default: true },
    password: { type: String }, // Para compartir protegido
    expiresAt: { type: Date },
    maxViews: { type: Number },
    currentViews: { type: Number, default: 0 }
  },

  // Metadatos y organización
  tags: [{ type: String, trim: true, lowercase: true }],
  category: { type: String, enum: ['favorites', 'workout', 'party', 'study', 'custom'], default: 'custom' },
  rating: { type: Number, min: 1, max: 5 }, // Clasificación del usuario
  coverImage: { type: String }, // URL de imagen de portada

  // Estadísticas y engagement
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  playCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Moderación y estado
  status: { type: String, enum: ['active', 'pending', 'moderated', 'banned'], default: 'active' },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  moderationReason: { type: String },

  // Sincronización y exportación
  syncSettings: {
    spotifyId: { type: String },
    youtubeId: { type: String },
    lastSyncedAt: { type: Date },
    syncEnabled: { type: Boolean, default: false },
    autoSync: { type: Boolean, default: false }
  },

  // Auditoría
  auditLog: [{
    action: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
  }],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastPlayedAt: { type: Date }
});

// Generar URL de compartir única antes de guardar
playlistSchema.pre('save', function(next) {
  if (this.isNew && !this.shareUrl && this.shareSettings.isEnabled) {
    this.shareUrl = `playlist_${this._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

// Índices para búsquedas eficientes
playlistSchema.index({ user: 1, createdAt: -1 });
playlistSchema.index({ isPublic: 1, createdAt: -1 });
playlistSchema.index({ tags: 1 });
playlistSchema.index({ category: 1 });
playlistSchema.index({ status: 1 });
playlistSchema.index({ shareUrl: 1 });
playlistSchema.index({ 'syncSettings.spotifyId': 1 });
playlistSchema.index({ 'syncSettings.youtubeId': 1 });

// Plugin de paginación
playlistSchema.plugin(mongoosePaginate);

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
  const userIdStr = userId.toString();

  // Propietario siempre puede editar
  if (this.user.toString() === userIdStr) {
    return true;
  }

  // Verificar colaboradores con rol editor o admin
  return this.collaborators.some(collab =>
    collab.user.toString() === userIdStr &&
    (collab.role === 'editor' || collab.role === 'admin')
  );
};

// Método para verificar permisos de visualización
playlistSchema.methods.canView = function(userId) {
  // Pública o es el propietario
  if (this.isPublic || this.user.toString() === userId?.toString()) {
    return true;
  }

  // Verificar si es colaborador
  return this.collaborators.some(collab =>
    collab.user.toString() === userId?.toString()
  );
};

// Método para agregar video
playlistSchema.methods.addVideo = async function(videoId, userId, order = null) {
  const videoExists = this.videos.some(v => v.video.toString() === videoId.toString());

  if (!videoExists) {
    const maxOrder = Math.max(...this.videos.map(v => v.order), 0);
    this.videos.push({
      video: videoId,
      addedBy: userId,
      order: order !== null ? order : maxOrder + 1
    });
    this.updatedAt = new Date();

    // Agregar entrada de auditoría
    this.auditLog.push({
      action: 'video_added',
      user: userId,
      details: { videoId },
      timestamp: new Date()
    });

    await this.save();
  }
  return this.videos;
};

// Método para quitar video
playlistSchema.methods.removeVideo = async function(videoId, userId) {
  const index = this.videos.findIndex(v => v.video.toString() === videoId.toString());

  if (index > -1) {
    this.videos.splice(index, 1);
    this.updatedAt = new Date();

    // Agregar entrada de auditoría
    this.auditLog.push({
      action: 'video_removed',
      user: userId,
      details: { videoId },
      timestamp: new Date()
    });

    await this.save();
  }
  return this.videos;
};

// Método para reordenar videos
playlistSchema.methods.reorderVideos = async function(videoOrder, userId) {
  // Validar que todos los videos estén en la playlist
  const currentVideoIds = this.videos.map(v => v.video.toString());
  const newVideoIds = Object.keys(videoOrder);

  if (currentVideoIds.length !== newVideoIds.length ||
      !newVideoIds.every(id => currentVideoIds.includes(id))) {
    throw new Error('Invalid video order');
  }

  // Actualizar el orden de los videos
  this.videos.forEach(video => {
    const newOrder = videoOrder[video.video.toString()];
    if (newOrder !== undefined) {
      video.order = newOrder;
    }
  });

  // Reordenar el array por orden
  this.videos.sort((a, b) => a.order - b.order);

  this.updatedAt = new Date();

  // Agregar entrada de auditoría
  this.auditLog.push({
    action: 'videos_reordered',
    user: userId,
    details: { videoOrder },
    timestamp: new Date()
  });

  await this.save();
  return this.videos;
};

// Método para agregar colaborador
playlistSchema.methods.addCollaborator = async function(userId, addedBy, role = 'viewer') {
  const collabExists = this.collaborators.some(collab =>
    collab.user.toString() === userId.toString()
  );

  if (!collabExists && this.user.toString() !== userId.toString()) {
    this.collaborators.push({
      user: userId,
      role,
      addedBy
    });

    // Agregar entrada de auditoría
    this.auditLog.push({
      action: 'collaborator_added',
      user: addedBy,
      details: { collaboratorId: userId, role },
      timestamp: new Date()
    });

    await this.save();
  }
  return this.collaborators;
};

// Método para actualizar configuración de compartir
playlistSchema.methods.updateShareSettings = async function(settings, userId) {
  this.shareSettings = { ...this.shareSettings, ...settings };

  if (settings.isEnabled && !this.shareUrl) {
    this.shareUrl = `playlist_${this._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Agregar entrada de auditoría
  this.auditLog.push({
    action: 'share_settings_updated',
    user: userId,
    details: settings,
    timestamp: new Date()
  });

  await this.save();
  return this.shareSettings;
};

// Método para moderar playlist
playlistSchema.methods.moderate = async function(status, moderatorId, reason = '') {
  this.status = status;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();

  if (reason) {
    this.moderationReason = reason;
  }

  // Agregar entrada de auditoría
  this.auditLog.push({
    action: 'moderated',
    user: moderatorId,
    details: { status, reason },
    timestamp: new Date()
  });

  await this.save();
  return this;
};

// Método para actualizar sincronización
playlistSchema.methods.updateSyncSettings = async function(settings, userId) {
  this.syncSettings = { ...this.syncSettings, ...settings };
  this.syncSettings.lastSyncedAt = new Date();

  // Agregar entrada de auditoría
  this.auditLog.push({
    action: 'sync_settings_updated',
    user: userId,
    details: settings,
    timestamp: new Date()
  });

  await this.save();
  return this.syncSettings;
};

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;