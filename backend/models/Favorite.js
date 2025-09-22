const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['song', 'album', 'video', 'article', 'concert', 'playlist'],
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  itemData: {
    // Datos denormalizados para acceso rápido
    title: String,
    artist: String,
    coverImage: String,
    duration: String,
    releaseYear: Number,
    category: String,
    url: String,
    description: String
  },
  tags: [String], // Tags personalizados del usuario
  notes: String, // Notas personales del usuario
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices compuestos para consultas eficientes
favoriteSchema.index({ user: 1, itemType: 1 });
favoriteSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });
favoriteSchema.index({ user: 1, addedAt: -1 });
favoriteSchema.index({ itemType: 1, itemId: 1 });

// Método para actualizar último acceso
favoriteSchema.methods.updateLastAccessed = function() {
  this.lastAccessedAt = new Date();
  return this.save();
};

// Método para agregar tags
favoriteSchema.methods.addTags = function(tags) {
  if (Array.isArray(tags)) {
    this.tags = [...new Set([...this.tags, ...tags])];
  } else if (typeof tags === 'string') {
    if (!this.tags.includes(tags)) {
      this.tags.push(tags);
    }
  }
  return this.save();
};

// Método para remover tags
favoriteSchema.methods.removeTags = function(tags) {
  if (Array.isArray(tags)) {
    this.tags = this.tags.filter(tag => !tags.includes(tag));
  } else if (typeof tags === 'string') {
    this.tags = this.tags.filter(tag => tag !== tags);
  }
  return this.save();
};

// Método estático para obtener estadísticas de usuario
favoriteSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$itemType',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        lastAdded: { $max: '$addedAt' },
        tags: { $addToSet: '$tags' }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      avgRating: stat.avgRating,
      lastAdded: stat.lastAdded,
      uniqueTags: [...new Set(stat.tags.flat())].filter(Boolean)
    };
    return acc;
  }, {});
};

// Método estático para obtener favoritos populares
favoriteSchema.statics.getPopularItems = async function(itemType, limit = 10) {
  return await this.aggregate([
    { $match: { itemType } },
    {
      $group: {
        _id: { itemType: '$itemType', itemId: '$itemId' },
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        itemData: { $first: '$itemData' }
      }
    },
    { $sort: { count: -1, avgRating: -1 } },
    { $limit: limit }
  ]);
};

// Método estático para buscar favoritos
favoriteSchema.statics.searchFavorites = async function(userId, query, filters = {}) {
  const searchQuery = { user: userId };

  // Filtros
  if (filters.itemType) {
    searchQuery.itemType = filters.itemType;
  }

  if (filters.rating) {
    searchQuery.rating = { $gte: filters.rating };
  }

  if (filters.tags && filters.tags.length > 0) {
    searchQuery.tags = { $in: filters.tags };
  }

  if (filters.dateFrom || filters.dateTo) {
    searchQuery.addedAt = {};
    if (filters.dateFrom) searchQuery.addedAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) searchQuery.addedAt.$lte = new Date(filters.dateTo);
  }

  // Búsqueda de texto
  if (query) {
    searchQuery.$or = [
      { 'itemData.title': { $regex: query, $options: 'i' } },
      { 'itemData.artist': { $regex: query, $options: 'i' } },
      { 'itemData.description': { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
      { notes: { $regex: query, $options: 'i' } }
    ];
  }

  return await this.find(searchQuery)
    .sort({ addedAt: -1 })
    .limit(filters.limit || 50);
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;