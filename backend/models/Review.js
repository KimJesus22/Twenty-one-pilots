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

  // Moderación automática
  autoModerated: { type: Boolean, default: false },
  moderationSeverity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  profanityDetected: { type: Boolean, default: false },
  badWords: [{ type: String }],
  autoModerationAction: {
    type: String,
    enum: ['none', 'censored', 'hidden', 'user_warned', 'user_suspended']
  },

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

// Método para aplicar moderación automática
reviewSchema.methods.applyAutoModeration = async function() {
  try {
    // Importar dinámicamente para evitar problemas en SSR
    const Filter = require('bad-words');
    const filter = new Filter();

    // Analizar título y comentario
    const titleAnalysis = this.analyzeContent(this.title);
    const commentAnalysis = this.analyzeContent(this.comment);

    // Combinar análisis
    const hasProfanity = titleAnalysis.hasProfanity || commentAnalysis.hasProfanity;
    const allBadWords = [...titleAnalysis.badWords, ...commentAnalysis.badWords];
    const severity = this.calculateSeverity(titleAnalysis, commentAnalysis);

    // Actualizar campos de moderación
    this.profanityDetected = hasProfanity;
    this.badWords = [...new Set(allBadWords)]; // Eliminar duplicados
    this.moderationSeverity = severity;
    this.autoModerated = true;

    // Aplicar acción automática basada en severidad
    const action = this.getAutoModerationAction(severity, hasProfanity);
    this.autoModerationAction = action;

    // Aplicar acción
    switch (action) {
      case 'censored':
        this.comment = filter.clean(this.comment);
        this.title = filter.clean(this.title);
        this.status = 'approved';
        break;
      case 'hidden':
        this.status = 'hidden';
        break;
      case 'user_warned':
        // Aquí se podría integrar con sistema de warnings del usuario
        this.status = 'approved';
        break;
      case 'user_suspended':
        // Aquí se podría integrar con sistema de suspensiones
        this.status = 'hidden';
        break;
      default:
        this.status = 'approved';
    }

    return this.save();
  } catch (error) {
    console.warn('Error en moderación automática:', error);
    this.status = 'pending'; // Dejar pendiente para revisión manual
    return this.save();
  }
};

// Método helper para analizar contenido
reviewSchema.methods.analyzeContent = function(text) {
  try {
    const Filter = require('bad-words');
    const filter = new Filter();

    const hasProfanity = filter.isProfane(text);
    const badWords = [];

    if (hasProfanity) {
      const words = text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (filter.isProfane(word)) {
          badWords.push(word);
        }
      });
    }

    return {
      hasProfanity,
      badWords,
      severity: badWords.length > 2 ? 'high' : badWords.length > 0 ? 'medium' : 'low'
    };
  } catch (error) {
    return { hasProfanity: false, badWords: [], severity: 'low' };
  }
};

// Método para calcular severidad combinada
reviewSchema.methods.calculateSeverity = function(titleAnalysis, commentAnalysis) {
  const severities = ['low', 'medium', 'high'];
  const titleLevel = severities.indexOf(titleAnalysis.severity);
  const commentLevel = severities.indexOf(commentAnalysis.severity);

  return severities[Math.max(titleLevel, commentLevel)];
};

// Método para determinar acción automática
reviewSchema.methods.getAutoModerationAction = function(severity, hasProfanity) {
  if (!hasProfanity) return 'none';

  switch (severity) {
    case 'low':
      return 'censored';
    case 'medium':
      return 'censored';
    case 'high':
      return 'hidden';
    default:
      return 'none';
  }
};

// Método estático para obtener reseñas de un producto con filtros avanzados
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc',
    status = 'approved',
    rating,
    verified,
    hasImages,
    dateFrom,
    dateTo,
    search
  } = options;

  let query = { product: productId };

  // Filtro por estado
  if (status !== 'all') {
    query.status = status;
  }

  // Filtro por calificación
  if (rating && rating !== 'all') {
    query.rating = parseInt(rating);
  }

  // Filtro por compra verificada
  if (verified === 'true') {
    query.verified = true;
  } else if (verified === 'false') {
    query.verified = false;
  }

  // Filtro por reseñas con imágenes
  if (hasImages === 'true') {
    query.images = { $exists: true, $ne: [] };
  }

  // Filtro por fecha
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  // Búsqueda en título y comentario
  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { comment: new RegExp(search, 'i') }
    ];
  }

  // Ordenamiento
  let sortOption = {};
  switch (sort) {
    case 'rating':
      sortOption = { rating: order === 'desc' ? -1 : 1, createdAt: -1 };
      break;
    case 'helpful':
      sortOption = { helpfulCount: order === 'desc' ? -1 : 1, createdAt: -1 };
      break;
    case 'verified':
      sortOption = { verified: order === 'desc' ? -1 : 1, createdAt: -1 };
      break;
    case 'relevance':
      // Ordenar por combinación de factores
      sortOption = {
        verified: -1,
        helpfulCount: -1,
        rating: -1,
        createdAt: -1
      };
      break;
    default:
      sortOption = { [sort]: order === 'desc' ? -1 : 1 };
  }

  return this.find(query)
    .populate('customer', 'username avatar')
    .populate('response.respondedBy', 'username')
    .sort(sortOption)
    .limit(limit)
    .skip((page - 1) * limit);
};

// Método estático para obtener estadísticas detalladas de reseñas
reviewSchema.statics.getProductReviewStats = async function(productId) {
  try {
    // Obtener todas las reseñas aprobadas
    const reviews = await this.find({ product: productId, status: 'approved' });

    if (reviews.length === 0) {
      return {
        avgRating: 0,
        totalReviews: 0,
        verifiedReviews: 0,
        reviewsWithImages: 0,
        recommendedCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        ratingPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        helpfulVotes: 0,
        notHelpfulVotes: 0,
        reportedCount: 0,
        avgHelpfulScore: 0
      };
    }

    // Calcular estadísticas básicas
    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    // Calcular distribución de ratings
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    // Calcular porcentajes
    const ratingPercentages = {};
    Object.keys(distribution).forEach(rating => {
      ratingPercentages[rating] = totalReviews > 0
        ? Math.round((distribution[rating] / totalReviews) * 100)
        : 0;
    });

    // Calcular otras estadísticas
    const verifiedReviews = reviews.filter(r => r.verified).length;
    const reviewsWithImages = reviews.filter(r => r.images && r.images.length > 0).length;
    const recommendedCount = reviews.filter(r => r.recommended).length;
    const helpfulVotes = reviews.reduce((sum, r) => sum + r.helpful.length, 0);
    const notHelpfulVotes = reviews.reduce((sum, r) => sum + r.notHelpful.length, 0);
    const reportedCount = reviews.reduce((sum, r) => sum + r.reported.length, 0);

    // Calcular promedio de puntuación útil
    const avgHelpfulScore = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.helpful.length - r.notHelpful.length), 0) / reviews.length
      : 0;

    return {
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews,
      verifiedReviews,
      reviewsWithImages,
      recommendedCount,
      ratingDistribution: distribution,
      ratingPercentages,
      helpfulVotes,
      notHelpfulVotes,
      reportedCount,
      avgHelpfulScore: Math.round(avgHelpfulScore * 100) / 100
    };
  } catch (error) {
    console.error('Error calculando estadísticas de reseñas:', error);
    return {
      avgRating: 0,
      totalReviews: 0,
      verifiedReviews: 0,
      reviewsWithImages: 0,
      recommendedCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratingPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      helpfulVotes: 0,
      notHelpfulVotes: 0,
      reportedCount: 0,
      avgHelpfulScore: 0
    };
  }
};

// Método estático para obtener reseñas destacadas
reviewSchema.statics.getFeaturedReviews = function(productId, limit = 3) {
  return this.find({
    product: productId,
    status: 'approved',
    $or: [
      { verified: true },
      { helpful: { $exists: true, $ne: [] } },
      { images: { $exists: true, $ne: [] } }
    ]
  })
  .populate('customer', 'username avatar')
  .sort({
    verified: -1,
    helpfulCount: -1,
    rating: -1,
    createdAt: -1
  })
  .limit(limit);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;