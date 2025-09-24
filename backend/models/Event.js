const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  artist: { type: String, default: 'Twenty One Pilots' },
  date: { type: Date, required: true },
  endDate: { type: Date }, // Para eventos de múltiples días
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    // Información adicional del venue
    capacity: { type: Number },
    venueType: {
      type: String,
      enum: ['arena', 'stadium', 'theater', 'club', 'outdoor', 'festival'],
      default: 'arena'
    },
    layout: {
      image: { type: String }, // URL de imagen del layout
      sections: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['seated', 'standing', 'vip', 'general'],
          default: 'seated'
        },
        capacity: { type: Number, required: true },
        price: {
          min: { type: Number },
          max: { type: Number },
          currency: { type: String, default: 'MXN' }
        },
        color: { type: String }, // Color para visualización
        coordinates: {
          x: { type: Number },
          y: { type: Number },
          width: { type: Number },
          height: { type: Number }
        }
      }]
    }
  },
  genre: {
    type: String,
    enum: ['rock', 'alternative', 'indie', 'pop', 'electronic', 'other'],
    default: 'alternative'
  },
  type: {
    type: String,
    enum: ['concert', 'festival', 'album-release', 'tour', 'special-event'],
    default: 'concert'
  },
  price: {
    min: { type: Number, default: 0 },
    max: { type: Number },
    currency: { type: String, default: 'USD' }
  },
  isFree: { type: Boolean, default: false },
  ticketUrl: { type: String }, // Eventbrite or external link
  eventbriteId: { type: String },
  ticketmasterId: { type: String },
  image: { type: String },
  capacity: { type: Number },
  soldOut: { type: Boolean, default: false },

  // Información de ticketing
  ticketing: {
    enabled: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: ['eventbrite', 'ticketmaster', 'internal'],
      default: 'internal'
    },
    externalEventId: { type: String }, // ID en el servicio externo
    ticketTypes: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      description: { type: String },
      price: {
        amount: { type: Number, required: true },
        currency: { type: String, default: 'MXN' }
      },
      quantity: { type: Number, required: true },
      sold: { type: Number, default: 0 },
      maxPerOrder: { type: Number, default: 10 },
      salesStart: { type: Date },
      salesEnd: { type: Date },
      isActive: { type: Boolean, default: true }
    }],
    salesStart: { type: Date },
    salesEnd: { type: Date },
    refundPolicy: {
      allowed: { type: Boolean, default: true },
      deadlineHours: { type: Number, default: 24 }, // Horas antes del evento
      fee: { type: Number, default: 0 }, // Cargo por reembolso
      conditions: { type: String }
    }
  },
  popularity: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attending: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  relatedAlbums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
  spotifyPlaylist: { type: String },
  youtubeVideo: { type: String },
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
eventSchema.index({ 'venue.coordinates': '2dsphere' });
eventSchema.index({ date: 1 });
eventSchema.index({ genre: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ popularity: -1 });
eventSchema.index({ 'venue.city': 1 });
eventSchema.index({ 'venue.country': 1 });

// Índices para ticketing
eventSchema.index({ 'ticketing.enabled': 1 });
eventSchema.index({ 'ticketing.provider': 1 });
eventSchema.index({ eventbriteId: 1 });
eventSchema.index({ ticketmasterId: 1 });
eventSchema.index({ 'ticketing.ticketTypes.isActive': 1 });

// Método para calcular distancia desde una ubicación
eventSchema.methods.calculateDistance = function(userLat, userLng) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (this.venue.coordinates.latitude - userLat) * Math.PI / 180;
  const dLng = (this.venue.coordinates.longitude - userLng) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(this.venue.coordinates.latitude * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
};

// Método para generar enlace de calendario
eventSchema.methods.generateCalendarLink = function() {
  const startDate = this.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = this.endDate
    ? this.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    : new Date(this.date.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = encodeURIComponent(`${this.artist} - ${this.title}`);
  const location = encodeURIComponent(`${this.venue.name}, ${this.venue.address}, ${this.venue.city}`);
  const details = encodeURIComponent(`Evento musical: ${this.description || 'Concierto de ' + this.artist}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&location=${location}&details=${details}`;
};

// Método para generar archivo iCalendar
eventSchema.methods.generateICalendar = function() {
  const startDate = this.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = this.endDate
    ? this.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    : new Date(this.date.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${this.artist} - ${this.title}
LOCATION:${this.venue.name}, ${this.venue.address}, ${this.venue.city}
DESCRIPTION:Evento musical: ${this.description || 'Concierto de ' + this.artist}
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n');
};

// Métodos para ticketing
eventSchema.methods.isTicketingEnabled = function() {
  return this.ticketing && this.ticketing.enabled;
};

eventSchema.methods.getAvailableTickets = function(ticketTypeId = null) {
  if (!this.isTicketingEnabled()) return [];

  if (ticketTypeId) {
    const ticketType = this.ticketing.ticketTypes.find(t => t.id === ticketTypeId && t.isActive);
    return ticketType ? Math.max(0, ticketType.quantity - ticketType.sold) : 0;
  }

  return this.ticketing.ticketTypes
    .filter(t => t.isActive)
    .map(t => ({
      ...t.toObject(),
      available: Math.max(0, t.quantity - t.sold)
    }));
};

eventSchema.methods.checkTicketAvailability = function(ticketTypeId, quantity = 1) {
  const available = this.getAvailableTickets(ticketTypeId);
  return available >= quantity;
};

eventSchema.methods.reserveTickets = async function(ticketTypeId, quantity, userId) {
  if (!this.checkTicketAvailability(ticketTypeId, quantity)) {
    throw new Error('Tickets no disponibles');
  }

  const ticketType = this.ticketing.ticketTypes.find(t => t.id === ticketTypeId);
  ticketType.sold += quantity;

  // Marcar como agotado si es necesario
  if (ticketType.sold >= ticketType.quantity) {
    ticketType.isActive = false;
  }

  await this.save();
  return ticketType;
};

eventSchema.methods.canRefundTickets = function() {
  if (!this.ticketing.refundPolicy.allowed) return false;

  const deadline = new Date(this.date.getTime() - (this.ticketing.refundPolicy.deadlineHours * 60 * 60 * 1000));
  return new Date() < deadline;
};

eventSchema.methods.getVenueSections = function() {
  return this.venue.layout?.sections || [];
};

eventSchema.methods.getSectionInfo = function(sectionId) {
  return this.venue.layout?.sections.find(s => s.id === sectionId);
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;