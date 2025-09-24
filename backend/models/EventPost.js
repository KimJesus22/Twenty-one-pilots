const mongoose = require('mongoose');

const eventPostSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'review'],
    default: 'text',
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    caption: {
      type: String,
      maxlength: 300
    },
    alt: String,
    metadata: {
      width: Number,
      height: Number,
      size: Number,
      duration: Number // para videos
    }
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  location: {
    type: {
      type: String,
      enum: ['venue', 'custom'],
      default: 'venue'
    },
    customLocation: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: {
        type: String,
        enum: ['like', 'love', 'laugh'],
        required: true
      }
    }],
    replies: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: 300
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
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
eventPostSchema.index({ event: 1, createdAt: -1 });
eventPostSchema.index({ author: 1, createdAt: -1 });
eventPostSchema.index({ type: 1, createdAt: -1 });
eventPostSchema.index({ tags: 1 });
eventPostSchema.index({ 'reactions.user': 1 });
eventPostSchema.index({ isFeatured: 1, createdAt: -1 });

// Middleware para actualizar updatedAt
eventPostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para agregar reacción
eventPostSchema.methods.addReaction = async function(userId, reactionType) {
  const existingReaction = this.reactions.find(r =>
    r.user.equals(userId) && r.type === reactionType
  );

  if (existingReaction) {
    // Remover reacción si ya existe
    this.reactions = this.reactions.filter(r =>
      !(r.user.equals(userId) && r.type === reactionType)
    );
  } else {
    // Agregar nueva reacción
    this.reactions.push({
      user: userId,
      type: reactionType
    });
  }

  return this.save();
};

// Método para agregar comentario
eventPostSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    author: userId,
    content: content
  });

  return this.save();
};

// Método para incrementar vistas
eventPostSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  return this.save();
};

// Método para incrementar shares
eventPostSchema.methods.incrementShares = async function() {
  this.shareCount += 1;
  return this.save();
};

// Método estático para obtener posts de un evento
eventPostSchema.statics.getEventPosts = function(eventId, options = {}) {
  const query = { event: eventId, isPublished: true };

  if (options.type) query.type = options.type;
  if (options.author) query.author = options.author;

  const postsQuery = this.find(query)
    .populate('author', 'username')
    .populate('comments.author', 'username')
    .populate('reactions.user', 'username')
    .sort({ createdAt: -1 });

  if (options.limit) postsQuery.limit(options.limit);
  if (options.skip) postsQuery.skip(options.skip);

  return postsQuery;
};

// Método estático para obtener posts destacados
eventPostSchema.statics.getFeaturedPosts = function(limit = 10) {
  return this.find({ isFeatured: true, isPublished: true })
    .populate('author', 'username')
    .populate('event', 'title venue')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Método estático para obtener estadísticas de engagement
eventPostSchema.statics.getEngagementStats = async function(eventId) {
  const stats = await this.aggregate([
    { $match: { event: mongoose.Types.ObjectId(eventId), isPublished: true } },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalReactions: { $sum: { $size: '$reactions' } },
        totalComments: { $sum: { $size: '$comments' } },
        totalViews: { $sum: '$viewCount' },
        totalShares: { $sum: '$shareCount' },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  return stats[0] || {
    totalPosts: 0,
    totalReactions: 0,
    totalComments: 0,
    totalViews: 0,
    totalShares: 0,
    avgRating: 0
  };
};

// Método estático para buscar posts por tags
eventPostSchema.statics.searchByTags = function(tags, limit = 20) {
  return this.find({
    tags: { $in: tags },
    isPublished: true
  })
  .populate('author', 'username')
  .populate('event', 'title venue')
  .sort({ createdAt: -1 })
  .limit(limit);
};

const EventPost = mongoose.model('EventPost', eventPostSchema);

module.exports = EventPost;