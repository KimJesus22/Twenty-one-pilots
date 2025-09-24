const mongoose = require('mongoose');

const shippingUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
    required: true
  },
  description: { type: String, required: true },
  location: {
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String }
  },
  timestamp: { type: Date, default: Date.now },
  carrierSpecificData: { type: mongoose.Schema.Types.Mixed } // Para datos específicos del carrier
});

const shippingSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  trackingNumber: { type: String, required: true, unique: true },
  carrier: {
    type: String,
    enum: ['ups', 'fedex', 'dhl', 'usps', 'dpd', 'hermes', 'gls', 'other'],
    required: true
  },
  carrierName: { type: String }, // Nombre completo del carrier

  // Estado actual
  currentStatus: {
    type: String,
    enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
    default: 'pending'
  },
  currentDescription: { type: String },
  currentLocation: {
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String }
  },

  // Información del envío
  serviceType: { type: String }, // Standard, Express, etc.
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },

  // Historial de actualizaciones
  updates: [shippingUpdateSchema],

  // Información del destinatario (snapshot)
  recipient: {
    name: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String }
    },
    phone: { type: String },
    email: { type: String }
  },

  // Información del remitente
  shipper: {
    name: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String }
    }
  },

  // Peso y dimensiones
  weight: {
    value: { type: Number },
    unit: { type: String, enum: ['kg', 'lb', 'g', 'oz'], default: 'kg' }
  },
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    unit: { type: String, enum: ['cm', 'in', 'm', 'ft'], default: 'cm' }
  },

  // URLs de seguimiento
  trackingUrl: { type: String }, // URL directa al seguimiento del carrier
  apiTrackingUrl: { type: String }, // URL de la API del carrier

  // Estado de sincronización
  lastSync: { type: Date },
  syncStatus: {
    type: String,
    enum: ['active', 'inactive', 'error', 'completed'],
    default: 'active'
  },
  syncError: { type: String },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices
shippingSchema.index({ order: 1 });
shippingSchema.index({ trackingNumber: 1 });
shippingSchema.index({ carrier: 1 });
shippingSchema.index({ currentStatus: 1 });
shippingSchema.index({ estimatedDelivery: 1 });
shippingSchema.index({ lastSync: 1 });

// Método para agregar actualización
shippingSchema.methods.addUpdate = function(status, description, location = null, carrierData = null) {
  const update = {
    status,
    description,
    location,
    carrierSpecificData: carrierData
  };

  this.updates.push(update);
  this.currentStatus = status;
  this.currentDescription = description;
  if (location) {
    this.currentLocation = location;
  }

  // Si se entrega, actualizar fecha de entrega
  if (status === 'delivered') {
    this.actualDelivery = new Date();
  }

  this.updatedAt = new Date();
  return this.save();
};

// Método para obtener el progreso del envío
shippingSchema.methods.getProgress = function() {
  const statusOrder = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(this.currentStatus);
  return currentIndex >= 0 ? (currentIndex + 1) / statusOrder.length * 100 : 0;
};

// Método para verificar si está retrasado
shippingSchema.methods.isDelayed = function() {
  if (!this.estimatedDelivery) return false;
  return new Date() > this.estimatedDelivery && this.currentStatus !== 'delivered';
};

// Método para obtener tiempo estimado restante
shippingSchema.methods.getEstimatedTimeRemaining = function() {
  if (!this.estimatedDelivery || this.currentStatus === 'delivered') return null;

  const now = new Date();
  const diff = this.estimatedDelivery - now;

  if (diff <= 0) return 'Retrasado';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} día${days > 1 ? 's' : ''} ${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    return 'Menos de 1 hora';
  }
};

// Método estático para sincronizar con APIs de carriers
shippingSchema.statics.syncWithCarrier = async function(trackingNumber, carrier) {
  // Aquí iría la lógica para llamar a las APIs de los carriers
  // Por ahora es un placeholder
  console.log(`Sincronizando ${trackingNumber} con ${carrier}`);

  // Simular actualización
  const shipping = await this.findOne({ trackingNumber });
  if (shipping) {
    shipping.lastSync = new Date();
    shipping.syncStatus = 'active';
    await shipping.save();
  }

  return shipping;
};

const Shipping = mongoose.model('Shipping', shippingSchema);

module.exports = Shipping;