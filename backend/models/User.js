const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'moderator', 'deployer'], default: 'user' },
  // MFA/2FA fields
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  twoFactorBackupCodes: [{ type: String }],
  // Security fields
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  // RBAC permissions
  permissions: [{
    resource: { type: String, required: true },
    actions: [{ type: String, enum: ['create', 'read', 'update', 'delete', 'admin'] }]
  }],
  playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
  favoriteVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  wishlist: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
    notes: { type: String, maxlength: 500 }
  }],
  customLists: [{
    name: { type: String, required: true },
    description: { type: String },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
    isPublic: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  followedArtists: [{ type: String }], // Nombres de artistas seguidos
  watchHistory: [{
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    watchedAt: { type: Date, default: Date.now },
    watchDuration: { type: Number, default: 0 } // segundos vistos
  }],
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    concerts: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Account lock methods
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// RBAC methods
userSchema.methods.hasPermission = function(resource, action) {
  // Admin has all permissions
  if (this.role === 'admin') return true;

  // Check specific permissions
  const permission = this.permissions.find(p => p.resource === resource);
  if (!permission) return false;

  return permission.actions.includes(action) || permission.actions.includes('admin');
};

userSchema.methods.hasRole = function(requiredRole) {
  const roleHierarchy = {
    'user': 1,
    'moderator': 2,
    'deployer': 3,
    'admin': 4
  };

  return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
};

userSchema.methods.grantPermission = function(resource, action) {
  const existingPermission = this.permissions.find(p => p.resource === resource);
  if (existingPermission) {
    if (!existingPermission.actions.includes(action)) {
      existingPermission.actions.push(action);
    }
  } else {
    this.permissions.push({ resource, actions: [action] });
  }
  return this.save();
};

userSchema.methods.revokePermission = function(resource, action) {
  const permission = this.permissions.find(p => p.resource === resource);
  if (permission) {
    permission.actions = permission.actions.filter(a => a !== action);
    if (permission.actions.length === 0) {
      this.permissions = this.permissions.filter(p => p.resource !== resource);
    }
  }
  return this.save();
};

// Método para agregar video a favoritos
userSchema.methods.addToFavorites = function(videoId) {
  if (!this.favoriteVideos.includes(videoId)) {
    this.favoriteVideos.push(videoId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Método para quitar video de favoritos
userSchema.methods.removeFromFavorites = function(videoId) {
  this.favoriteVideos = this.favoriteVideos.filter(id => !id.equals(videoId));
  return this.save();
};

// Método para verificar si un video está en favoritos
userSchema.methods.isFavorite = function(videoId) {
  return this.favoriteVideos.some(id => id.equals(videoId));
};

// Método para crear lista personalizada
userSchema.methods.createCustomList = function(name, description = '', isPublic = false) {
  const newList = {
    name,
    description,
    videos: [],
    isPublic,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  this.customLists.push(newList);
  return this.save();
};

// Método para agregar video a lista personalizada
userSchema.methods.addToCustomList = function(listIndex, videoId) {
  if (this.customLists[listIndex] && !this.customLists[listIndex].videos.includes(videoId)) {
    this.customLists[listIndex].videos.push(videoId);
    this.customLists[listIndex].updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Método para quitar video de lista personalizada
userSchema.methods.removeFromCustomList = function(listIndex, videoId) {
  if (this.customLists[listIndex]) {
    this.customLists[listIndex].videos = this.customLists[listIndex].videos.filter(id => !id.equals(videoId));
    this.customLists[listIndex].updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Método para eliminar lista personalizada
userSchema.methods.deleteCustomList = function(listIndex) {
  if (this.customLists[listIndex]) {
    this.customLists.splice(listIndex, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Métodos para wishlist
userSchema.methods.addToWishlist = function(productId, notes = '') {
  // Verificar si el producto ya está en la wishlist
  const existingItem = this.wishlist.find(item => item.product.equals(productId));
  if (existingItem) {
    // Actualizar notas si es necesario
    if (notes && notes !== existingItem.notes) {
      existingItem.notes = notes;
      return this.save();
    }
    return Promise.resolve(this);
  }

  // Agregar nuevo item
  this.wishlist.push({
    product: productId,
    addedAt: new Date(),
    notes: notes
  });
  return this.save();
};

userSchema.methods.removeFromWishlist = function(productId) {
  this.wishlist = this.wishlist.filter(item => !item.product.equals(productId));
  return this.save();
};

userSchema.methods.isInWishlist = function(productId) {
  return this.wishlist.some(item => item.product.equals(productId));
};

userSchema.methods.getWishlistItem = function(productId) {
  return this.wishlist.find(item => item.product.equals(productId));
};

userSchema.methods.updateWishlistNotes = function(productId, notes) {
  const item = this.wishlist.find(item => item.product.equals(productId));
  if (item) {
    item.notes = notes;
    return this.save();
  }
  return Promise.resolve(this);
};

const User = mongoose.model('User', userSchema);

module.exports = User;