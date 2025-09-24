const mongoose = require('mongoose');

const eventGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    }
  }],
  maxMembers: {
    type: Number,
    default: 20,
    min: 2,
    max: 50
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  meetingPoint: {
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
    },
    notes: String
  },
  transportation: {
    type: {
      type: String,
      enum: ['car', 'public', 'walking', 'mixed'],
      default: 'mixed'
    },
    details: String
  },
  groupChat: {
    enabled: { type: Boolean, default: true },
    messages: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: {
        type: String,
        required: true,
        maxlength: 500
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['text', 'image', 'system'],
        default: 'text'
      }
    }]
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
eventGroupSchema.index({ event: 1, createdAt: -1 });
eventGroupSchema.index({ creator: 1 });
eventGroupSchema.index({ 'members.user': 1 });

// Middleware para actualizar updatedAt
eventGroupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para agregar miembro
eventGroupSchema.methods.addMember = async function(userId, role = 'member') {
  if (this.members.length >= this.maxMembers) {
    throw new Error('Group is full');
  }

  if (this.members.some(m => m.user.equals(userId))) {
    throw new Error('User is already a member');
  }

  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });

  // Agregar mensaje de sistema
  if (this.groupChat.enabled) {
    this.groupChat.messages.push({
      user: userId,
      message: 'se unió al grupo',
      type: 'system'
    });
  }

  return this.save();
};

// Método para quitar miembro
eventGroupSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(m => m.user.equals(userId));
  if (memberIndex === -1) {
    throw new Error('User is not a member');
  }

  this.members.splice(memberIndex, 1);

  // Agregar mensaje de sistema
  if (this.groupChat.enabled) {
    this.groupChat.messages.push({
      user: userId,
      message: 'salió del grupo',
      type: 'system'
    });
  }

  return this.save();
};

// Método para verificar si usuario es miembro
eventGroupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.equals(userId));
};

// Método para verificar permisos
eventGroupSchema.methods.canManage = function(userId) {
  const member = this.members.find(m => m.user.equals(userId));
  return member && (member.role === 'admin' || member.role === 'moderator' || this.creator.equals(userId));
};

// Método para enviar mensaje
eventGroupSchema.methods.addMessage = async function(userId, message, type = 'text') {
  if (!this.isMember(userId)) {
    throw new Error('User is not a member of this group');
  }

  this.groupChat.messages.push({
    user: userId,
    message: message,
    type: type
  });

  return this.save();
};

// Método estático para obtener grupos de un evento
eventGroupSchema.statics.getEventGroups = function(eventId, userId = null) {
  const query = { event: eventId };
  if (userId) {
    query.$or = [
      { isPrivate: false },
      { 'members.user': userId }
    ];
  } else {
    query.isPrivate = false;
  }

  return this.find(query)
    .populate('creator', 'username')
    .populate('members.user', 'username')
    .populate('event', 'title date venue')
    .sort({ createdAt: -1 });
};

// Método estático para obtener grupos de un usuario
eventGroupSchema.statics.getUserGroups = function(userId) {
  return this.find({ 'members.user': userId })
    .populate('event', 'title date venue')
    .populate('creator', 'username')
    .sort({ updatedAt: -1 });
};

const EventGroup = mongoose.model('EventGroup', eventGroupSchema);

module.exports = EventGroup;