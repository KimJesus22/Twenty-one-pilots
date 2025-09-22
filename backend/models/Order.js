const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantCombination: { type: Map, of: String }, // Talla, color, etc.
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Precio al momento de la compra
  total: { type: Number, required: true },
  sku: { type: String },
  productName: { type: String }, // Snapshot del nombre
  productImage: { type: String }, // Snapshot de la imagen
  downloadableFiles: [{ // Para productos digitales
    name: { type: String },
    url: { type: String },
    downloadsRemaining: { type: Number, default: 3 }, // Descargas permitidas
    expiresAt: { type: Date }
  }]
});

const shippingAddressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  company: { type: String },
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Items del pedido
  items: [orderItemSchema],
  itemCount: { type: Number, default: 0 },

  // Totales
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // Moneda y método de pago
  currency: { type: String, default: 'USD' },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  paymentIntentId: { type: String }, // Para Stripe
  paypalOrderId: { type: String }, // Para PayPal

  // Estado del pago
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },

  // Estado del pedido
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing', 'shipped', 'delivered',
      'cancelled', 'refunded', 'returned', 'completed'
    ],
    default: 'pending'
  },

  // Información de envío
  shippingAddress: shippingAddressSchema,
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'free', 'pickup', 'digital'],
    default: 'standard'
  },
  trackingNumber: { type: String },
  carrier: { type: String }, // UPS, FedEx, DHL, etc.
  shippedAt: { type: Date },
  deliveredAt: { type: Date },

  // Información de facturación
  billingAddress: shippingAddressSchema,

  // Notas y comentarios
  customerNotes: { type: String },
  internalNotes: { type: String },

  // Descuentos aplicados
  coupons: [{
    code: { type: String },
    discount: { type: Number },
    type: { type: String, enum: ['percentage', 'fixed'] }
  }],

  // Historial de estados
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Información de reembolso
  refunds: [{
    amount: { type: Number, required: true },
    reason: { type: String },
    processedAt: { type: Date, default: Date.now },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stripeRefundId: { type: String },
    paypalRefundId: { type: String }
  }],

  // Información de GDPR/CCPA
  consentGiven: { type: Boolean, default: false },
  marketingConsent: { type: Boolean, default: false },
  dataRetentionUntil: { type: Date },

  // Metadata adicional
  source: { type: String, enum: ['website', 'mobile_app', 'api'] },
  ipAddress: { type: String },
  userAgent: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shippingAddress.country': 1 });

// Generar número de orden único
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Buscar el último número de orden del día
    const lastOrder = await mongoose.model('Order').findOne({
      orderNumber: new RegExp(`^${year}${month}${day}`)
    }).sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    this.orderNumber = `${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
  }

  // Calcular totales
  this.itemCount = this.items.reduce((total, item) => total + item.quantity, 0);
  this.subtotal = this.items.reduce((total, item) => total + item.total, 0);

  this.updatedAt = new Date();
  next();
});

// Método para calcular total del reembolso
orderSchema.methods.getTotalRefunded = function() {
  return this.refunds.reduce((total, refund) => total + refund.amount, 0);
};

// Método para verificar si se puede reembolsar
orderSchema.methods.canRefund = function(amount = null) {
  const totalRefunded = this.getTotalRefunded();
  const remainingAmount = this.total - totalRefunded;

  if (amount) {
    return remainingAmount >= amount;
  }

  return remainingAmount > 0;
};

// Método para agregar al historial de estados
orderSchema.methods.addStatusHistory = function(status, note = '', updatedBy = null) {
  this.statusHistory.push({
    status,
    note,
    updatedBy
  });
  this.status = status;
  return this.save();
};

// Método para procesar reembolso
orderSchema.methods.processRefund = async function(amount, reason, processedBy) {
  if (!this.canRefund(amount)) {
    throw new Error('Monto de reembolso excede el disponible');
  }

  // Aquí iría la lógica de reembolso con Stripe/PayPal
  // Por ahora solo guardamos el registro

  this.refunds.push({
    amount,
    reason,
    processedBy
  });

  if (this.getTotalRefunded() >= this.total) {
    this.paymentStatus = 'refunded';
  } else {
    this.paymentStatus = 'partially_refunded';
  }

  await this.addStatusHistory('refunded', `Reembolso procesado: $${amount} - ${reason}`, processedBy);
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;