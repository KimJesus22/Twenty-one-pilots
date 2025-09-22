const { Product } = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const SupportTicket = require('../models/Support');
const queueService = require('../services/queueService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Inicializar Stripe solo si hay clave secreta
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (error) {
    logger.warn('Stripe no disponible:', error.message);
  }
}

// Inicializar PayPal
let paypalClient = null;
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  try {
    const paypal = require('@paypal/checkout-server-sdk');
    paypalClient = new paypal.core.PayPalHttpClient(
      new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    );
  } catch (error) {
    logger.warn('PayPal no disponible:', error.message);
  }
}

class StoreController {
  // Obtener todos los productos con filtros y paginación
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        search = '',
        sort = 'createdAt',
        order = 'desc',
        minPrice,
        maxPrice
      } = req.query;

      const query = { isAvailable: true };

      // Filtros
      if (category && category !== 'all') {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sort]: order === 'desc' ? -1 : 1 }
      };

      const result = await Product.paginate(query, options);

      res.json({
        success: true,
        data: {
          products: result.docs,
          pagination: {
            page: result.page,
            pages: result.totalPages,
            total: result.totalDocs,
            limit: result.limit
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo productos'
      });
    }
  }

  // Obtener producto específico
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: { product }
      });
    } catch (error) {
      logger.error('Error obteniendo producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo producto'
      });
    }
  }

  // Crear producto (solo admin)
  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const product = new Product(req.body);
      await product.save();

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: { product }
      });
    } catch (error) {
      logger.error('Error creando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando producto'
      });
    }
  }

  // Actualizar producto (solo admin)
  async updateProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const product = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: { product }
      });
    } catch (error) {
      logger.error('Error actualizando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando producto'
      });
    }
  }

  // Eliminar producto (solo admin)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando producto'
      });
    }
  }

  // Procesar pago con Stripe
  async processPayment(req, res) {
    try {
      // Verificar si Stripe está disponible
      if (!stripe) {
        return res.status(503).json({
          success: false,
          message: 'Sistema de pagos no disponible. Configure Stripe para procesar pagos.',
          error: 'STRIPE_NOT_CONFIGURED'
        });
      }

      const { items, successUrl, cancelUrl } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Items del carrito requeridos'
        });
      }

      // Verificar stock y calcular total
      let totalAmount = 0;
      const lineItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Producto ${item.productId} no encontrado`
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${product.name}`
          });
        }

        totalAmount += product.price * item.quantity;

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
              images: product.image ? [product.image] : [],
            },
            unit_amount: Math.round(product.price * 100), // Stripe usa centavos
          },
          quantity: item.quantity,
        });
      }

      // Crear sesión de pago
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl || `${process.env.FRONTEND_URL}/store/success`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/store/cancel`,
        metadata: {
          items: JSON.stringify(items)
        }
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url
        }
      });
    } catch (error) {
      logger.error('Error procesando pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando pago'
      });
    }
  }

  // Webhook de Stripe para confirmar pago
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const items = JSON.parse(session.metadata.items);

        // Actualizar stock
        for (const item of items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
          });
        }

        // Enviar email de confirmación de compra (asíncrono)
        try {
          await queueService.addEmailJob('purchase-confirmation', {
            userEmail: session.customer_details?.email || 'customer@example.com',
            orderId: session.id,
            items: items,
            total: session.amount_total / 100 // Convertir de centavos
          });
        } catch (emailError) {
          logger.error('Error enviando email de confirmación:', emailError);
          // No fallar el webhook por error de email
        }

        logger.info('Pago completado, stock actualizado y email enviado:', { sessionId: session.id });
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Error procesando webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  // Obtener categorías disponibles
  async getCategories(req, res) {
    try {
      const categories = await Product.distinct('category', { isAvailable: true });

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Error obteniendo categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo categorías'
      });
    }
  }

  // ===== SISTEMA DE RESEÑAS =====

  // Obtener reseñas de un producto
  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

      const reviews = await Review.getProductReviews(productId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        order
      });

      const total = await Review.countDocuments({ product: productId, status: 'approved' });

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo reseñas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo reseñas'
      });
    }
  }

  // Crear reseña
  async createReview(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { productId } = req.params;
      const { customerId, orderId, ...reviewData } = req.body;

      // Verificar que el producto existe
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar que el cliente no haya reseñado ya este producto
      const existingReview = await Review.findOne({
        product: productId,
        customer: customerId
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Ya has reseñado este producto'
        });
      }

      // Verificar compra si se proporciona orderId
      if (orderId) {
        const order = await Order.findOne({
          _id: orderId,
          customer: customerId,
          'items.product': productId
        });

        if (order) {
          reviewData.verified = true;
          reviewData.order = orderId;
        }
      }

      const review = new Review({
        product: productId,
        customer: customerId,
        ...reviewData
      });

      await review.save();

      res.status(201).json({
        success: true,
        message: 'Reseña creada exitosamente',
        data: { review }
      });
    } catch (error) {
      logger.error('Error creando reseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando reseña'
      });
    }
  }

  // Marcar reseña como útil
  async markReviewHelpful(req, res) {
    try {
      const { reviewId } = req.params;
      const { userId, helpful } = req.body;

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Reseña no encontrada'
        });
      }

      if (helpful) {
        await review.markHelpful(userId);
      } else {
        await review.markNotHelpful(userId);
      }

      res.json({
        success: true,
        message: 'Voto registrado'
      });
    } catch (error) {
      logger.error('Error marcando reseña útil:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando voto'
      });
    }
  }

  // ===== SISTEMA DE PEDIDOS =====

  // Crear pedido
  async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { customerId, items, shippingAddress, billingAddress, paymentMethod, notes } = req.body;

      // Verificar stock y calcular totales
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Producto ${item.productId} no encontrado`
          });
        }

        if (!product.isAvailable) {
          return res.status(400).json({
            success: false,
            message: `Producto ${product.name} no disponible`
          });
        }

        // Verificar stock por variante si existe
        if (item.variantCombination) {
          const variantStock = product.getVariantStock(item.variantCombination);
          if (variantStock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Stock insuficiente para la variante seleccionada de ${product.name}`
            });
          }
        } else if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${product.name}`
          });
        }

        const itemTotal = product.getDiscountedPrice() * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product: item.productId,
          variantCombination: item.variantCombination,
          quantity: item.quantity,
          price: product.getDiscountedPrice(),
          total: itemTotal,
          sku: product.sku,
          productName: product.name,
          productImage: product.images?.[0] || product.image
        });
      }

      // Calcular impuestos y envío (simplificado)
      const tax = subtotal * 0.08; // 8% de impuesto
      const shipping = subtotal > 50 ? 0 : 9.99; // Envío gratis en pedidos > $50
      const total = subtotal + tax + shipping;

      const order = new Order({
        customer: customerId,
        items: orderItems,
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        customerNotes: notes,
        consentGiven: true,
        marketingConsent: req.body.marketingConsent || false
      });

      await order.save();

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: { order }
      });
    } catch (error) {
      logger.error('Error creando pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando pedido'
      });
    }
  }

  // Obtener pedidos del usuario
  async getUserOrders(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const query = { customer: userId };
      if (status && status !== 'all') {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('items.product')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo pedidos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo pedidos'
      });
    }
  }

  // Obtener pedido específico
  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const { userId } = req.query; // Para verificar permisos

      const order = await Order.findOne({
        _id: orderId,
        customer: userId
      }).populate('items.product');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      res.json({
        success: true,
        data: { order }
      });
    } catch (error) {
      logger.error('Error obteniendo pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo pedido'
      });
    }
  }

  // Actualizar estado del pedido (admin)
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber, carrier, note } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (carrier) order.carrier = carrier;

      await order.addStatusHistory(status, note, req.body.updatedBy);

      res.json({
        success: true,
        message: 'Estado del pedido actualizado',
        data: { order }
      });
    } catch (error) {
      logger.error('Error actualizando pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando pedido'
      });
    }
  }

  // Procesar reembolso
  async processRefund(req, res) {
    try {
      const { orderId } = req.params;
      const { amount, reason } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      await order.processRefund(amount, reason, req.body.processedBy);

      res.json({
        success: true,
        message: 'Reembolso procesado exitosamente'
      });
    } catch (error) {
      logger.error('Error procesando reembolso:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando reembolso'
      });
    }
  }

  // ===== RECOMENDACIONES =====

  // Obtener recomendaciones personalizadas
  async getRecommendations(req, res) {
    try {
      const { userId, limit = 6 } = req.query;

      let recommendations = [];

      if (userId) {
        // Recomendaciones basadas en historial de compras
        const userOrders = await Order.find({ customer: userId })
          .populate('items.product')
          .sort({ createdAt: -1 })
          .limit(5);

        const purchasedCategories = new Set();
        const purchasedProducts = new Set();

        userOrders.forEach(order => {
          order.items.forEach(item => {
            if (item.product) {
              purchasedCategories.add(item.product.category);
              purchasedProducts.add(item.product._id.toString());
            }
          });
        });

        // Buscar productos similares
        const similarProducts = await Product.find({
          category: { $in: Array.from(purchasedCategories) },
          _id: { $nin: Array.from(purchasedProducts) },
          isAvailable: true
        })
        .sort({ rating: -1, purchases: -1 })
        .limit(parseInt(limit));

        recommendations = similarProducts;
      } else {
        // Recomendaciones generales (productos populares)
        recommendations = await Product.find({
          isAvailable: true,
          rating: { $gte: 4 }
        })
        .sort({ purchases: -1, rating: -1 })
        .limit(parseInt(limit));
      }

      res.json({
        success: true,
        data: { recommendations }
      });
    } catch (error) {
      logger.error('Error obteniendo recomendaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo recomendaciones'
      });
    }
  }

  // ===== SOPORTE AL CLIENTE =====

  // Crear ticket de soporte
  async createSupportTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { customerId, ...ticketData } = req.body;

      const ticket = new SupportTicket({
        customer: customerId,
        ...ticketData
      });

      await ticket.save();

      // Agregar mensaje inicial
      await ticket.addMessage(customerId, ticketData.description);

      res.status(201).json({
        success: true,
        message: 'Ticket de soporte creado exitosamente',
        data: { ticket }
      });
    } catch (error) {
      logger.error('Error creando ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando ticket'
      });
    }
  }

  // Obtener tickets del usuario
  async getUserTickets(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const query = { customer: userId };
      if (status && status !== 'all') {
        query.status = status;
      }

      const tickets = await SupportTicket.find(query)
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await SupportTicket.countDocuments(query);

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo tickets'
      });
    }
  }

  // Agregar mensaje a ticket
  async addTicketMessage(req, res) {
    try {
      const { ticketId } = req.params;
      const { senderId, message, attachments } = req.body;

      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado'
        });
      }

      // Verificar permisos (cliente o agente asignado)
      if (ticket.customer.toString() !== senderId.toString() &&
          ticket.assignedTo?.toString() !== senderId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para enviar mensajes en este ticket'
        });
      }

      await ticket.addMessage(senderId, message, 'text', attachments);

      res.json({
        success: true,
        message: 'Mensaje enviado exitosamente'
      });
    } catch (error) {
      logger.error('Error agregando mensaje:', error);
      res.status(500).json({
        success: false,
        message: 'Error enviando mensaje'
      });
    }
  }

  // ===== ESTADÍSTICAS Y REPORTES =====

  // Obtener estadísticas de la tienda
  async getStoreStats(req, res) {
    try {
      const totalProducts = await Product.countDocuments({ isAvailable: true });
      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      const recentOrders = await Order.find()
        .populate('customer', 'username')
        .sort({ createdAt: -1 })
        .limit(5);

      const topProducts = await Product.find({ isAvailable: true })
        .sort({ purchases: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          recentOrders,
          topProducts
        }
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas'
      });
    }
  }

  // ===== PRIVACIDAD Y GDPR =====

  // Solicitar eliminación de datos
  async requestDataDeletion(req, res) {
    try {
      const { userId, reason } = req.body;

      // En una implementación real, esto marcaría los datos para eliminación
      // y programaría la eliminación después del período de retención legal

      logger.info(`Solicitud de eliminación de datos para usuario ${userId}: ${reason}`);

      res.json({
        success: true,
        message: 'Solicitud de eliminación de datos registrada. Procesaremos tu solicitud según nuestras políticas de privacidad.',
        requestId: `DEL-${Date.now()}`
      });
    } catch (error) {
      logger.error('Error procesando solicitud de eliminación:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando solicitud'
      });
    }
  }

  // Exportar datos del usuario
  async exportUserData(req, res) {
    try {
      const { userId } = req.params;

      const userOrders = await Order.find({ customer: userId });
      const userReviews = await Review.find({ customer: userId });
      const userTickets = await SupportTicket.find({ customer: userId });

      const userData = {
        orders: userOrders,
        reviews: userReviews,
        supportTickets: userTickets,
        exportDate: new Date(),
        dataRetentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
      };

      res.json({
        success: true,
        data: userData
      });
    } catch (error) {
      logger.error('Error exportando datos:', error);
      res.status(500).json({
        success: false,
        message: 'Error exportando datos'
      });
    }
  }
}

module.exports = new StoreController();