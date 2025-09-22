const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number }, // Precio anterior para mostrar descuento
  images: [{ type: String }], // Múltiples imágenes
  image: { type: String }, // Imagen principal (para compatibilidad)
  category: {
    type: String,
    enum: ['clothing', 'accessories', 'music', 'posters', 'merchandise', 'tickets', 'digital', 'other'],
    required: true
  },
  subcategory: { type: String }, // Subcategorías específicas
  brand: { type: String, default: 'Twenty One Pilots' },
  sku: { type: String, unique: true }, // Código único del producto
  barcode: { type: String },

  // Atributos variables (tallas, colores, etc.)
  variants: [{
    name: { type: String, required: true }, // ej: "Talla", "Color"
    values: [{ type: String, required: true }] // ej: ["S", "M", "L"], ["Rojo", "Azul"]
  }],

  // Inventario por variante
  inventory: [{
    variantCombination: { type: Map, of: String }, // ej: { "Talla": "M", "Color": "Rojo" }
    sku: { type: String },
    stock: { type: Number, default: 0 },
    price: { type: Number }, // Precio específico por variante
    weight: { type: Number }, // Para envíos
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number }
    }
  }],

  // Stock total (calculado dinámicamente)
  stock: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  isDigital: { type: Boolean, default: false }, // Productos digitales (downloads)
  downloadableFiles: [{ // Para productos digitales
    name: { type: String },
    url: { type: String },
    fileType: { type: String }
  }],

  // Información de envío
  weight: { type: Number }, // en gramos
  dimensions: {
    length: { type: Number }, // en cm
    width: { type: Number },
    height: { type: Number }
  },
  shippingClass: { type: String, enum: ['standard', 'express', 'free', 'digital'] },

  // SEO y marketing
  seoTitle: { type: String },
  seoDescription: { type: String },
  tags: [{ type: String }],
  featured: { type: Boolean, default: false }, // Producto destacado
  onSale: { type: Boolean, default: false },
  saleStart: { type: Date },
  saleEnd: { type: Date },

  // Estadísticas y engagement
  views: { type: Number, default: 0 },
  purchases: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Relaciones con otros modelos
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  relatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  relatedAlbums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],

  // Información adicional
  careInstructions: { type: String }, // Para ropa
  materials: [{ type: String }], // Composición del producto
  warranty: { type: String }, // Garantía
  returnPolicy: { type: String }, // Política de devoluciones

  // Control de versiones y auditoría
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Índices para búsquedas eficientes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ featured: -1, createdAt: -1 });
productSchema.index({ 'inventory.variantCombination': 1 });

// Middleware para actualizar stock total
productSchema.pre('save', function(next) {
  if (this.inventory && this.inventory.length > 0) {
    this.stock = this.inventory.reduce((total, item) => total + item.stock, 0);
  }
  this.updatedAt = new Date();
  next();
});

// Método para calcular precio con descuento
productSchema.methods.getDiscountedPrice = function() {
  if (this.onSale && this.compareAtPrice && this.compareAtPrice > this.price) {
    return this.price;
  }
  return this.price;
};

// Método para verificar si hay descuento activo
productSchema.methods.hasActiveDiscount = function() {
  if (!this.onSale || !this.compareAtPrice) return false;

  const now = new Date();
  if (this.saleStart && now < this.saleStart) return false;
  if (this.saleEnd && now > this.saleEnd) return false;

  return this.compareAtPrice > this.price;
};

// Método para obtener porcentaje de descuento
productSchema.methods.getDiscountPercentage = function() {
  if (!this.hasActiveDiscount()) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
};

// Método para verificar stock de variante específica
productSchema.methods.getVariantStock = function(variantCombination) {
  const variant = this.inventory.find(inv =>
    JSON.stringify(inv.variantCombination) === JSON.stringify(variantCombination)
  );
  return variant ? variant.stock : 0;
};

// Método para actualizar stock de variante
productSchema.methods.updateVariantStock = function(variantCombination, newStock) {
  const variant = this.inventory.find(inv =>
    JSON.stringify(inv.variantCombination) === JSON.stringify(variantCombination)
  );
  if (variant) {
    variant.stock = newStock;
    this.stock = this.inventory.reduce((total, item) => total + item.stock, 0);
    return this.save();
  }
  throw new Error('Variant not found');
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;