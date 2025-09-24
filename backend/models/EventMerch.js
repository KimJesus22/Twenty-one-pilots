const mongoose = require('mongoose');

const eventMerchSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['clothing', 'accessories', 'music', 'collectibles', 'digital', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['t-shirt', 'hoodie', 'hat', 'poster', 'vinyl', 'cd', 'digital_album', 'bundle', 'limited_edition'],
    required: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  pricing: {
    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'MXN',
      enum: ['MXN', 'USD', 'EUR']
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  inventory: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    available: {
      type: Number,
      required: true,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    sizes: [{
      size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
      },
      quantity: {
        type: Number,
        min: 0
      }
    }],
    variants: [{
      name: String, // e.g., "Color", "Style"
      value: String, // e.g., "Black", "Limited Edition"
      quantity: {
        type: Number,
        min: 0
      }
    }]
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    isPreOrder: {
      type: Boolean,
      default: false
    },
    releaseDate: Date,
    endDate: Date, // Para ofertas limitadas
    limitedEdition: {
      type: Boolean,
      default: false
    },
    maxPerCustomer: {
      type: Number,
      min: 1
    }
  },
  shipping: {
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      min: 0
    },
    estimatedDelivery: {
      minDays: Number,
      maxDays: Number
    },
    internationalShipping: {
      type: Boolean,
      default: false
    }
  },
  externalLinks: {
    purchaseUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Purchase URL must be a valid HTTP/HTTPS URL'
      }
    },
    spotifyUrl: String,
    youtubeUrl: String,
    appleMusicUrl: String,
    deezerUrl: String
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    wishlistCount: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para consultas eficientes
eventMerchSchema.index({ event: 1, type: 1 });
eventMerchSchema.index({ event: 1, category: 1 });
eventMerchSchema.index({ event: 1, featured: 1 });
eventMerchSchema.index({ event: 1, 'availability.isAvailable': 1 });
eventMerchSchema.index({ event: 1, priority: -1 });
eventMerchSchema.index({ tags: 1 });
eventMerchSchema.index({ 'pricing.salePrice': 1 });

// Middleware para actualizar updatedAt
eventMerchSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Calcular porcentaje de descuento si hay precio de venta
  if (this.pricing.salePrice && this.pricing.originalPrice) {
    this.pricing.discountPercentage = Math.round(
      ((this.pricing.originalPrice - this.pricing.salePrice) / this.pricing.originalPrice) * 100
    );
  }

  next();
});

// Método para verificar si está en stock
eventMerchSchema.methods.isInStock = function(quantity = 1, size = null, variant = null) {
  if (!this.availability.isAvailable) return false;
  if (this.inventory.available < quantity) return false;

  // Verificar tamaño específico
  if (size && this.inventory.sizes.length > 0) {
    const sizeStock = this.inventory.sizes.find(s => s.size === size);
    if (!sizeStock || sizeStock.quantity < quantity) return false;
  }

  // Verificar variante específica
  if (variant && this.inventory.variants.length > 0) {
    const variantStock = this.inventory.variants.find(v => v.name === variant.name && v.value === variant.value);
    if (!variantStock || variantStock.quantity < quantity) return false;
  }

  return true;
};

// Método para reducir inventario
eventMerchSchema.methods.reduceStock = async function(quantity = 1, size = null, variant = null) {
  if (!this.isInStock(quantity, size, variant)) {
    throw new Error('Insufficient stock');
  }

  this.inventory.available -= quantity;

  // Reducir stock de tamaño específico
  if (size && this.inventory.sizes.length > 0) {
    const sizeStock = this.inventory.sizes.find(s => s.size === size);
    if (sizeStock) {
      sizeStock.quantity -= quantity;
    }
  }

  // Reducir stock de variante específica
  if (variant && this.inventory.variants.length > 0) {
    const variantStock = this.inventory.variants.find(v => v.name === variant.name && v.value === variant.value);
    if (variantStock) {
      variantStock.quantity -= quantity;
    }
  }

  this.stats.purchases += quantity;
  return this.save();
};

// Método para incrementar vistas
eventMerchSchema.methods.incrementViews = async function() {
  this.stats.views += 1;
  return this.save();
};

// Método para agregar a wishlist
eventMerchSchema.methods.addToWishlist = async function() {
  this.stats.wishlistCount += 1;
  return this.save();
};

// Método para quitar de wishlist
eventMerchSchema.methods.removeFromWishlist = async function() {
  this.stats.wishlistCount = Math.max(0, this.stats.wishlistCount - 1);
  return this.save();
};

// Método para agregar rating
eventMerchSchema.methods.addRating = async function(rating) {
  const newCount = this.stats.rating.count + 1;
  const newAverage = ((this.stats.rating.average * this.stats.rating.count) + rating) / newCount;

  this.stats.rating.count = newCount;
  this.stats.rating.average = Math.round(newAverage * 10) / 10; // Redondear a 1 decimal

  return this.save();
};

// Método estático para obtener productos de un evento
eventMerchSchema.statics.getEventMerch = function(eventId, options = {}) {
  const query = { event: eventId };

  if (options.type) query.type = options.type;
  if (options.category) query.category = options.category;
  if (options.availableOnly) query['availability.isAvailable'] = true;
  if (options.featuredOnly) query.featured = true;

  const merchQuery = this.find(query)
    .sort({ priority: -1, featured: -1, createdAt: -1 });

  if (options.limit) merchQuery.limit(options.limit);
  if (options.skip) merchQuery.skip(options.skip);

  return merchQuery;
};

// Método estático para obtener productos destacados
eventMerchSchema.statics.getFeaturedMerch = function(eventId, limit = 6) {
  return this.find({
    event: eventId,
    featured: true,
    'availability.isAvailable': true
  })
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit);
};

// Método estático para buscar productos
eventMerchSchema.statics.searchMerch = function(eventId, searchTerm, limit = 20) {
  const searchRegex = new RegExp(searchTerm, 'i');

  return this.find({
    event: eventId,
    'availability.isAvailable': true,
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ]
  })
  .sort({ priority: -1, featured: -1 })
  .limit(limit);
};

// Método estático para obtener estadísticas de merchandising
eventMerchSchema.statics.getMerchStats = async function(eventId) {
  const stats = await this.aggregate([
    { $match: { event: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        availableProducts: {
          $sum: { $cond: ['$availability.isAvailable', 1, 0] }
        },
        totalRevenue: {
          $sum: {
            $multiply: ['$stats.purchases', { $ifNull: ['$pricing.salePrice', '$pricing.originalPrice'] }]
          }
        },
        totalViews: { $sum: '$stats.views' },
        totalPurchases: { $sum: '$stats.purchases' },
        avgRating: { $avg: '$stats.rating.average' },
        featuredCount: {
          $sum: { $cond: ['$featured', 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalProducts: 0,
    availableProducts: 0,
    totalRevenue: 0,
    totalViews: 0,
    totalPurchases: 0,
    avgRating: 0,
    featuredCount: 0
  };
};

const EventMerch = mongoose.model('EventMerch', eventMerchSchema);

module.exports = EventMerch;