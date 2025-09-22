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
  image: { type: String },
  capacity: { type: Number },
  soldOut: { type: Boolean, default: false },
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

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;