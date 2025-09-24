const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderType: { type: String, enum: ['customer', 'agent', 'system'], required: true },
  message: { type: String, required: true },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    filename: { type: String },
    url: { type: String },
    fileType: { type: String },
    fileSize: { type: Number }
  }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Información del ticket
  subject: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'order_issue', 'product_question', 'shipping', 'returns', 'refund',
      'payment', 'account', 'technical', 'feedback', 'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'waiting_agent', 'resolved', 'closed'],
    default: 'open'
  },

  // Contenido del ticket
  description: { type: String, required: true },
  messages: [messageSchema],

  // Asignación
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: {
    type: String,
    enum: ['sales', 'support', 'technical', 'returns', 'billing'],
    default: 'support'
  },

  // Relaciones
  relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },

  // Metadata
  source: { type: String, enum: ['website', 'email', 'chat', 'phone', 'api'], default: 'website' },
  tags: [{ type: String }],
  satisfaction: { type: Number, min: 1, max: 5 }, // Calificación del cliente
  satisfactionComment: { type: String },

  // Tiempos
  firstResponseTime: { type: Number }, // en minutos
  resolutionTime: { type: Number }, // en minutos
  reopenedCount: { type: Number, default: 0 },

  // Historial de estados
  statusHistory: [{
    status: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String }
  }],

  // Información de contacto adicional
  contactEmail: { type: String },
  contactPhone: { type: String },

  // Configuración de privacidad
  gdprConsent: { type: Boolean, default: true },
  dataRetentionUntil: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  closedAt: { type: Date }
});

// Índices para búsquedas eficientes
// ticketNumber ya tiene índice único por unique: true
supportTicketSchema.index({ customer: 1, createdAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ department: 1 });
supportTicketSchema.index({ 'messages.createdAt': -1 });

// Generar número de ticket único
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Buscar el último ticket del día
    const lastTicket = await mongoose.model('SupportTicket').findOne({
      ticketNumber: new RegExp(`^T-${year}${month}${day}`)
    }).sort({ ticketNumber: -1 });

    let sequence = 1;
    if (lastTicket) {
      const lastSequence = parseInt(lastTicket.ticketNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    this.ticketNumber = `T-${year}${month}${day}-${sequence.toString().padStart(4, '0')}`;
  }

  this.updatedAt = new Date();
  next();
});

// Método para agregar mensaje
supportTicketSchema.methods.addMessage = async function(sender, message, messageType = 'text', attachments = []) {
  const newMessage = {
    sender,
    senderType: sender === this.customer ? 'customer' : 'agent',
    message,
    messageType,
    attachments
  };

  this.messages.push(newMessage);

  // Actualizar tiempo de primera respuesta si es la primera respuesta de agente
  if (sender !== this.customer && !this.firstResponseTime) {
    this.firstResponseTime = Math.floor((new Date() - this.createdAt) / (1000 * 60)); // minutos
  }

  return this.save();
};

// Método para cambiar estado
supportTicketSchema.methods.changeStatus = async function(newStatus, changedBy, note = '') {
  const oldStatus = this.status;
  this.status = newStatus;

  this.statusHistory.push({
    status: newStatus,
    changedBy,
    note
  });

  // Actualizar tiempos
  if (newStatus === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
    this.resolutionTime = Math.floor((this.resolvedAt - this.createdAt) / (1000 * 60)); // minutos
  }

  if (newStatus === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }

  // Si se reabre un ticket resuelto/cerrado
  if ((oldStatus === 'resolved' || oldStatus === 'closed') && newStatus === 'open') {
    this.reopenedCount += 1;
    this.resolvedAt = null;
    this.resolutionTime = null;
  }

  return this.save();
};

// Método para asignar agente
supportTicketSchema.methods.assignTo = async function(agentId, assignedBy) {
  this.assignedTo = agentId;
  await this.addMessage(assignedBy, `Ticket asignado a agente`, 'system');
  return this.save();
};

// Método para calificar satisfacción
supportTicketSchema.methods.rateSatisfaction = async function(rating, comment = '') {
  this.satisfaction = rating;
  this.satisfactionComment = comment;
  return this.save();
};

// Método para obtener mensajes no leídos
supportTicketSchema.methods.getUnreadCount = function(userId) {
  return this.messages.filter(message =>
    !message.readBy.includes(userId) && message.sender.toString() !== userId.toString()
  ).length;
};

// Método para marcar mensajes como leídos
supportTicketSchema.methods.markAsRead = async function(userId) {
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && !message.readBy.includes(userId)) {
      message.readBy.push(userId);
    }
  });

  return this.save();
};

// Método estático para obtener estadísticas de soporte
supportTicketSchema.statics.getSupportStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalTickets: { $sum: 1 },
        openTickets: {
          $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress', 'waiting_customer', 'waiting_agent']] }, 1, 0] }
        },
        resolvedTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        avgFirstResponseTime: { $avg: '$firstResponseTime' },
        avgResolutionTime: { $avg: '$resolutionTime' },
        satisfactionAvg: { $avg: '$satisfaction' },
        ticketsByCategory: {
          $push: '$category'
        },
        ticketsByPriority: {
          $push: '$priority'
        }
      }
    }
  ]);

  if (stats.length > 0) {
    const stat = stats[0];

    // Calcular distribución por categoría y prioridad
    const categoryCount = {};
    const priorityCount = {};

    stat.ticketsByCategory.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    stat.ticketsByPriority.forEach(pri => {
      priorityCount[pri] = (priorityCount[pri] || 0) + 1;
    });

    return {
      ...stat,
      categoryBreakdown: categoryCount,
      priorityBreakdown: priorityCount
    };
  }

  return null;
};

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;