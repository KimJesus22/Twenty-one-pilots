const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  // Referencias principales
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },

  // Información del ticket
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  externalTicketId: {
    type: String,
    index: true // ID del ticket en Eventbrite/Ticketmaster
  },

  // Información del asiento
  seat: {
    section: { type: String, required: true },
    row: { type: String, required: true },
    seat: { type: String, required: true },
    zone: { type: String }, // Zona general (VIP, General, etc.)
    coordinates: {
      x: { type: Number }, // Para visualización interactiva
      y: { type: Number }
    }
  },

  // Información de precio y pago
  price: {
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'MXN' },
    originalAmount: { type: Number }, // Precio original antes de descuentos
    fees: { type: Number, default: 0 }, // Cargos adicionales
    taxes: { type: Number, default: 0 }
  },

  // Estado del ticket
  status: {
    type: String,
    enum: ['reserved', 'confirmed', 'paid', 'delivered', 'used', 'cancelled', 'refunded', 'transferred'],
    default: 'reserved',
    index: true
  },

  // Información de entrega
  deliveryMethod: {
    type: String,
    enum: ['digital', 'physical', 'pickup'],
    default: 'digital'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },

  // Códigos de validación
  qrCode: {
    type: String,
    unique: true
  },
  barcode: {
    type: String
  },
  validationCode: {
    type: String,
    unique: true
  },

  // Información de reembolso
  refund: {
    eligible: { type: Boolean, default: true },
    requestedAt: { type: Date },
    processedAt: { type: Date },
    amount: { type: Number },
    reason: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalRefundId: { type: String } // ID de reembolso en servicio externo
  },

  // Transferencias de tickets
  transfers: [{
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transferredAt: { type: Date, default: Date.now },
    transferFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    }
  }],

  // Metadatos
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },

  // Integración con servicios externos
  provider: {
    type: String,
    enum: ['eventbrite', 'ticketmaster', 'internal'],
    default: 'internal'
  },
  providerData: {
    type: mongoose.Schema.Types.Mixed // Datos adicionales del proveedor
  },

  // Información adicional
  notes: { type: String },
  tags: [{ type: String }],

  // Control de acceso
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para búsquedas eficientes
ticketSchema.index({ event: 1, status: 1 });
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ order: 1 });
ticketSchema.index({ 'seat.section': 1, 'seat.row': 1, 'seat.seat': 1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ qrCode: 1 });
ticketSchema.index({ purchaseDate: -1 });
ticketSchema.index({ 'refund.eligible': 1 });

// Virtual para verificar si el ticket es válido
ticketSchema.virtual('isValid').get(function() {
  return ['confirmed', 'paid', 'delivered'].includes(this.status);
});

// Virtual para verificar si puede ser reembolsado
ticketSchema.virtual('canRefund').get(function() {
  return this.refund.eligible &&
         !['used', 'refunded', 'cancelled'].includes(this.status) &&
         this.event.date > new Date(Date.now() + 24 * 60 * 60 * 1000); // Al menos 24h antes
});

// Método para generar código QR único
ticketSchema.methods.generateQRCode = function() {
  if (!this.qrCode) {
    this.qrCode = `TKT${this.ticketNumber}${Date.now().toString(36).toUpperCase()}`;
  }
  return this.qrCode;
};

// Método para generar código de validación
ticketSchema.methods.generateValidationCode = function() {
  if (!this.validationCode) {
    this.validationCode = Math.random().toString(36).substring(2, 15).toUpperCase();
  }
  return this.validationCode;
};

// Método para validar ticket
ticketSchema.methods.validateTicket = async function() {
  if (this.status !== 'delivered') {
    throw new Error('Ticket no está en estado válido para usar');
  }

  this.status = 'used';
  this.accessCount += 1;
  this.lastAccessed = new Date();
  await this.save();

  return true;
};

// Método para solicitar reembolso
ticketSchema.methods.requestRefund = async function(reason, processedBy = null) {
  if (!this.canRefund) {
    throw new Error('Ticket no es elegible para reembolso');
  }

  this.refund.requestedAt = new Date();
  this.refund.reason = reason;
  if (processedBy) {
    this.refund.processedBy = processedBy;
  }

  await this.save();
  return this.refund;
};

// Método para procesar reembolso
ticketSchema.methods.processRefund = async function(amount, processedBy) {
  if (this.status === 'refunded') {
    throw new Error('Ticket ya fue reembolsado');
  }

  this.refund.processedAt = new Date();
  this.refund.amount = amount;
  this.refund.processedBy = processedBy;
  this.status = 'refunded';

  await this.save();
  return this.refund;
};

// Método para transferir ticket
ticketSchema.methods.transferTo = async function(toUserId, transferFee = 0) {
  if (!this.isValid) {
    throw new Error('Ticket no es válido para transferir');
  }

  const transfer = {
    fromUser: this.user,
    toUser: toUserId,
    transferFee: transferFee,
    status: 'completed'
  };

  this.transfers.push(transfer);
  this.user = toUserId;
  this.lastModified = new Date();

  await this.save();
  return transfer;
};

// Método estático para buscar tickets por evento
ticketSchema.statics.findByEvent = function(eventId, status = null) {
  const query = { event: eventId };
  if (status) query.status = status;
  return this.find(query).populate('user', 'username email').sort({ purchaseDate: -1 });
};

// Método estático para buscar tickets por usuario
ticketSchema.statics.findByUser = function(userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;
  return this.find(query).populate('event', 'title date venue').sort({ purchaseDate: -1 });
};

// Método estático para verificar disponibilidad de asiento
ticketSchema.statics.checkSeatAvailability = async function(eventId, section, row, seat) {
  const existingTicket = await this.findOne({
    event: eventId,
    'seat.section': section,
    'seat.row': row,
    'seat.seat': seat,
    status: { $nin: ['cancelled', 'refunded'] }
  });

  return !existingTicket;
};

// Método estático para obtener mapa de asientos ocupados
ticketSchema.statics.getOccupiedSeats = async function(eventId) {
  const tickets = await this.find({
    event: eventId,
    status: { $nin: ['cancelled', 'refunded'] }
  }, { 'seat.section': 1, 'seat.row': 1, 'seat.seat': 1 });

  return tickets.map(ticket => ({
    section: ticket.seat.section,
    row: ticket.seat.row,
    seat: ticket.seat.seat
  }));
};

// Pre-save middleware
ticketSchema.pre('save', function(next) {
  this.lastModified = new Date();

  // Generar códigos si no existen
  if (!this.qrCode) {
    this.generateQRCode();
  }
  if (!this.validationCode) {
    this.generateValidationCode();
  }

  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;