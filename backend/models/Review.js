const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Pedido que originó la reseña

  // Valoración
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxLength: 100 },
  comment: { type: String, required: true, maxLength: 1000 },

  // Información adicional
  pros: [{ type: String }], // Aspectos positivos
  cons: [{ type: String }], // Aspectos negativos
  verified: { type: Boolean, default: false }, // Compra verificada
  recommended: { type: Boolean, default: true },

  // Fotos/videos de la reseña
  images: [{ type: String }],
  videos: [{ type: String }],

  // Variante específica reseñada (talla, color, etc.)
  variantCombination: { type: Map, of: String },

  // Respuesta del vendedor/admin
  response: {
    text: { type: String, maxLength: 500 },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date }
  },

  // Moderación
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  moderationReason: { type: String },

  // Engagement
  helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notHelpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reported: [{
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    reportedAt: { type: Date, default: Date.now }
  }],

  // Metadata
  ipAddress: { type: String },
  userAgent: { type: String },
  edited: { type: Boolean, default: false },
  editHistory: [{
    previousRating: { type: Number },
    previousTitle: { type: String },
    previousComment: { type: String },
    editedAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ verified: -1 });
reviewSchema.index({ 'helpful': 1 });
reviewSchema.index({ createdAt: -1 });

// Middleware para actualizar estadísticas del producto
reviewSchema.post('save', async function() {
  await updateProductStats(this.product);
});

reviewSchema.post('remove', async function() {
  await updateProductStats(this.product);
});

// Función para actualizar estadísticas del producto
async function updateProductStats(productId) {
  const Product = mongoose.model('Product');
  const Review = mongoose.model('Review');

  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
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

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stat.avgRating * 10) / 10, // Redondear a 1 decimal
      reviewCount: stat.totalReviews,
      ratingDistribution: distribution
    });
  } else {
    // No hay reseñas, resetear estadísticas
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
  }
}

// Método para marcar como útil
reviewSchema.methods.markHelpful = async function(userId) {
  const helpfulIndex = this.helpful.indexOf(userId);
  const notHelpfulIndex = this.notHelpful.indexOf(userId);

  if (helpfulIndex > -1) {
    // Ya está marcado como útil, quitar
    this.helpful.splice(helpfulIndex, 1);
  } else {
    // Marcar como útil
    this.helpful.push(userId);
    // Quitar de no útil si estaba
    if (notHelpfulIndex > -1) {
      this.notHelpful.splice(notHelpfulIndex, 1);
    }
  }

  return this.save();
};

// Método para marcar como no útil
reviewSchema.methods.markNotHelpful = async function(userId) {
  const helpfulIndex = this.helpful.indexOf(userId);
  const notHelpfulIndex = this.notHelpful.indexOf(userId);

  if (notHelpfulIndex > -1) {
    // Ya está marcado como no útil, quitar
    this.notHelpful.splice(notHelpfulIndex, 1);
  } else {
    // Marcar como no útil
    this.notHelpful.push(userId);
    // Quitar de útil si estaba
    if (helpfulIndex > -1) {
      this.helpful.splice(helpfulIndex, 1);
    }
  }

  return this.save();
};

// Método para reportar reseña
reviewSchema.methods.report = async function(userId, reason) {
  const alreadyReported = this.reported.some(report => report.reportedBy.toString() === userId.toString());

  if (!alreadyReported) {
    this.reported.push({
      reportedBy: userId,
      reason
    });
    return this.save();
  }

  throw new Error('Ya has reportado esta reseña');
};

// Método para responder reseña (solo admin/vendedor)
reviewSchema.methods.respond = async function(responseText, respondedBy) {
  this.response = {
    text: responseText,
    respondedBy,
    respondedAt: new Date()
  };

  return this.save();
};

// Método para moderar reseña (solo admin/moderador)
reviewSchema.methods.moderate = async function(status, moderatedBy, reason = '') {
  this.status = status;
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  this.moderationReason = reason;

  return this.save();
};

// Método para editar reseña
reviewSchema.methods.edit = async function(newRating, newTitle, newComment) {
  if (this.edited) {
    throw new Error('Las reseñas solo pueden editarse una vez');
  }

  this.editHistory.push({
    previousRating: this.rating,
    previousTitle: this.title,
    previousComment: this.comment,
    editedAt: new Date()
  });

  this.rating = newRating;
  this.title = newTitle;
  this.comment = newComment;
  this.edited = true;
  this.updatedAt = new Date();

  return this.save();
};

// Método estático para obtener reseñas de un producto
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', status = 'approved' } = options;

  const query = { product: productId, status };
  const sortOption = { [sort]: order === 'desc' ? -1 : 1 };

  return this.find(query)
    .populate('customer', 'username avatar')
    .populate('response.respondedBy', 'username')
    .sort(sortOption)
    .limit(limit)
    .skip((page - 1) * limit);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;