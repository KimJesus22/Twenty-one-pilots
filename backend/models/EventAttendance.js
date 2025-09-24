const mongoose = require('mongoose');

const eventAttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['going', 'interested', 'not_going'],
    default: 'going',
    required: true
  },
  attendingWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  reminderSettings: {
    enabled: { type: Boolean, default: true },
    calendarExported: { type: Boolean, default: false },
    reminderType: {
      type: String,
      enum: ['push', 'email', 'location'],
      default: 'push'
    },
    reminderTime: {
      value: { type: Number, default: 60 },
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'minutes'
      }
    }
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

// Índices compuestos para consultas eficientes
eventAttendanceSchema.index({ user: 1, event: 1 }, { unique: true });
eventAttendanceSchema.index({ event: 1, status: 1 });
eventAttendanceSchema.index({ user: 1, createdAt: -1 });

// Middleware para actualizar updatedAt
eventAttendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para cambiar status
eventAttendanceSchema.methods.changeStatus = async function(newStatus) {
  this.status = newStatus;
  this.updatedAt = new Date();
  return this.save();
};

// Método para agregar acompañante
eventAttendanceSchema.methods.addAttendee = async function(userId) {
  if (!this.attendingWith.includes(userId)) {
    this.attendingWith.push(userId);
    this.updatedAt = new Date();
    return this.save();
  }
  return this;
};

// Método para quitar acompañante
eventAttendanceSchema.methods.removeAttendee = async function(userId) {
  this.attendingWith = this.attendingWith.filter(id => !id.equals(userId));
  this.updatedAt = new Date();
  return this.save();
};

// Método estático para obtener estadísticas de asistencia
eventAttendanceSchema.statics.getAttendanceStats = async function(eventId) {
  const stats = await this.aggregate([
    { $match: { event: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAttendees: { $sum: { $size: '$attendingWith' } }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAttendees: stat.totalAttendees + stat.count // incluir el usuario principal
    };
    return acc;
  }, { going: { count: 0, totalAttendees: 0 }, interested: { count: 0, totalAttendees: 0 }, not_going: { count: 0, totalAttendees: 0 } });
};

// Método estático para obtener eventos de un usuario
eventAttendanceSchema.statics.getUserEvents = function(userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;

  return this.find(query)
    .populate('event', 'title date venue artist')
    .sort({ createdAt: -1 });
};

const EventAttendance = mongoose.model('EventAttendance', eventAttendanceSchema);

module.exports = EventAttendance;