const mongoose = require('mongoose');

const musicRatingSchema = new mongoose.Schema({
  // Referencia al elemento valorado (álbum o canción)
  targetType: {
    type: String,
    enum: ['album', 'song'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Validación condicional basada en targetType
    validate: {
      validator: function(value) {
        if (this.targetType === 'album') {
          return mongoose.model('Discography').findById(value);
        } else if (this.targetType === 'song') {
          // Asumiendo que hay un modelo Song o que las canciones están embebidas en albums
          return true; // Validación simplificada
        }
        return false;
      },
      message: 'Target ID must be valid for the specified type'
    }
  },

  // Usuario que hace la valoración
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Valoración con estrellas (1-5)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },

  // Metadata
  ipAddress: { type: String },
  userAgent: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
musicRatingSchema.index({ targetType: 1, targetId: 1 });
musicRatingSchema.index({ user: 1 });
musicRatingSchema.index({ rating: -1 });
musicRatingSchema.index({ createdAt: -1 });

// Índice compuesto único: un usuario solo puede valorar una vez cada elemento
musicRatingSchema.index({ targetType: 1, targetId: 1, user: 1 }, { unique: true });

// Middleware para actualizar estadísticas después de guardar/eliminar
musicRatingSchema.post('save', async function() {
  await updateTargetStats(this.targetType, this.targetId);
});

musicRatingSchema.post('remove', async function() {
  await updateTargetStats(this.targetType, this.targetId);
});

// Función para actualizar estadísticas del elemento valorado
async function updateTargetStats(targetType, targetId) {
  const MusicRating = mongoose.model('MusicRating');

  const stats = await MusicRating.aggregate([
    {
      $match: {
        targetType: targetType,
        targetId: mongoose.Types.ObjectId(targetId)
      }
    },
    {
      $group: {
        _id: { targetType: '$targetType', targetId: '$targetId' },
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length > 0) {
    const stat = stats[0];

    // Calcular distribución de ratings
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stat.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    // Actualizar el documento correspondiente
    if (targetType === 'album') {
      const Discography = mongoose.model('Discography');
      await Discography.findByIdAndUpdate(targetId, {
        rating: Math.round(stat.avgRating * 10) / 10, // Redondear a 1 decimal
        ratingCount: stat.totalRatings,
        ratingDistribution: distribution
      });
    } else if (targetType === 'song') {
      // Para canciones, necesitaríamos actualizar el documento del álbum padre
      // o tener un modelo separado para canciones
      console.log('Song rating stats update needed:', stat);
    }
  } else {
    // No hay valoraciones, resetear estadísticas
    const resetStats = {
      rating: 0,
      ratingCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (targetType === 'album') {
      const Discography = mongoose.model('Discography');
      await Discography.findByIdAndUpdate(targetId, resetStats);
    }
  }
}

// Método para verificar si un usuario ya valoró un elemento
musicRatingSchema.statics.hasUserRated = function(targetType, targetId, userId) {
  return this.findOne({
    targetType,
    targetId,
    user: userId
  }).select('_id');
};

// Método para obtener rating de un usuario
musicRatingSchema.statics.getUserRating = function(targetType, targetId, userId) {
  return this.findOne({
    targetType,
    targetId,
    user: userId
  }).select('rating');
};

// Método estático para obtener estadísticas de ratings
musicRatingSchema.statics.getRatingStats = function(targetType, targetId) {
  return this.aggregate([
    {
      $match: {
        targetType: targetType,
        targetId: mongoose.Types.ObjectId(targetId)
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
};

// Pre-save hook
musicRatingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MusicRating = mongoose.model('MusicRating', musicRatingSchema);

module.exports = MusicRating;