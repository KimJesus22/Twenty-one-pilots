const mongoose = require('mongoose');
const Order = require('../models/Order');
const Shipping = require('../models/Shipping');
const User = require('../models/User');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

/**
 * Obtener historial de pedidos del usuario
 */
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir query
    const query = { customer: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Construir opciones de ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .populate('items.product', 'name images price')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Order.countDocuments(query);

    // Agregar información de shipping a cada orden
    const ordersWithShipping = await Promise.all(
      orders.map(async (order) => {
        const shipping = await Shipping.findOne({ order: order._id }).lean();
        return {
          ...order,
          shipping: shipping ? {
            trackingNumber: shipping.trackingNumber,
            carrier: shipping.carrier,
            carrierName: shipping.carrierName,
            currentStatus: shipping.currentStatus,
            currentDescription: shipping.currentDescription,
            estimatedDelivery: shipping.estimatedDelivery,
            trackingUrl: shipping.trackingUrl,
            progress: shipping ? shipping.getProgress() : 0,
            isDelayed: shipping ? shipping.isDelayed() : false,
            timeRemaining: shipping ? shipping.getEstimatedTimeRemaining() : null
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: ordersWithShipping,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    logger.error('Error obteniendo pedidos del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener detalles de un pedido específico
 */
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.query; // Para verificar permisos

    const order = await Order.findById(orderId)
      .populate('items.product', 'name images price category')
      .populate('customer', 'username email')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario del pedido
    if (order.customer._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver este pedido'
      });
    }

    // Obtener información de shipping
    const shipping = await Shipping.findOne({ order: orderId }).lean();

    const orderWithShipping = {
      ...order,
      shipping: shipping ? {
        trackingNumber: shipping.trackingNumber,
        carrier: shipping.carrier,
        carrierName: shipping.carrierName,
        currentStatus: shipping.currentStatus,
        currentDescription: shipping.currentDescription,
        currentLocation: shipping.currentLocation,
        estimatedDelivery: shipping.estimatedDelivery,
        actualDelivery: shipping.actualDelivery,
        trackingUrl: shipping.trackingUrl,
        updates: shipping.updates,
        progress: shipping.getProgress(),
        isDelayed: shipping.isDelayed(),
        timeRemaining: shipping.getEstimatedTimeRemaining()
      } : null
    };

    res.json({
      success: true,
      data: orderWithShipping
    });
  } catch (error) {
    logger.error('Error obteniendo detalles del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener seguimiento de envío en tiempo real
 */
const getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.query;

    // Verificar que el pedido existe y pertenece al usuario
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    if (order.customer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Obtener información de shipping
    const shipping = await Shipping.findOne({ order: orderId });
    if (!shipping) {
      return res.status(404).json({
        success: false,
        message: 'Información de envío no disponible'
      });
    }

    // Intentar sincronizar con el carrier si no se ha hecho recientemente
    const now = new Date();
    const lastSync = shipping.lastSync;
    const shouldSync = !lastSync || (now - lastSync) > (5 * 60 * 1000); // 5 minutos

    if (shouldSync && shipping.syncStatus === 'active') {
      try {
        await Shipping.syncWithCarrier(shipping.trackingNumber, shipping.carrier);
        // Recargar shipping con datos actualizados
        await shipping.reload();
      } catch (syncError) {
        logger.warn('Error sincronizando con carrier:', syncError);
      }
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        trackingNumber: shipping.trackingNumber,
        carrier: shipping.carrier,
        carrierName: shipping.carrierName,
        currentStatus: shipping.currentStatus,
        currentDescription: shipping.currentDescription,
        currentLocation: shipping.currentLocation,
        estimatedDelivery: shipping.estimatedDelivery,
        actualDelivery: shipping.actualDelivery,
        trackingUrl: shipping.trackingUrl,
        updates: shipping.updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        progress: shipping.getProgress(),
        isDelayed: shipping.isDelayed(),
        timeRemaining: shipping.getEstimatedTimeRemaining(),
        lastSync: shipping.lastSync
      }
    });
  } catch (error) {
    logger.error('Error obteniendo seguimiento del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Reordenar productos de un pedido anterior
 */
const reorderOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    if (order.customer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Crear items para el carrito basados en el pedido anterior
    const cartItems = order.items.map(item => ({
      product: item.product,
      variantCombination: item.variantCombination,
      quantity: item.quantity,
      price: item.price, // Usar precio actual si es necesario
      productName: item.productName,
      productImage: item.productImage
    }));

    // Aquí normalmente se agregarían al carrito del usuario
    // Por ahora devolvemos los items para que el frontend los maneje

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        items: cartItems,
        totalItems: cartItems.length
      },
      message: 'Items del pedido agregados al carrito'
    });
  } catch (error) {
    logger.error('Error reordenando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener estadísticas de pedidos del usuario
 */
const getOrderStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Order.aggregate([
      { $match: { customer: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          lastOrderDate: { $max: '$createdAt' },
          ordersByStatus: {
            $push: '$status'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: null,
          statusBreakdown: {}
        }
      });
    }

    const statusBreakdown = stats[0].ordersByStatus.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalOrders: stats[0].totalOrders,
        totalSpent: stats[0].totalSpent,
        averageOrderValue: stats[0].averageOrderValue,
        lastOrderDate: stats[0].lastOrderDate,
        statusBreakdown
      }
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas de pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear un pago para un pedido
 */
const createPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario del pedido
    const refundUserId = req.user?._id || req.body.userId; // Fallback para desarrollo
    if (order.customer.toString() !== refundUserId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para procesar reembolsos de este pedido'
      });
    }

    // Verificar que el usuario sea el propietario del pedido
    const confirmUserId = req.user?._id || req.body.userId; // Fallback para desarrollo
    if (order.customer.toString() !== confirmUserId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para confirmar pagos de este pedido'
      });
    }

    // Verificar que el usuario sea el propietario del pedido
    // Nota: En producción, req.user debería venir del middleware de autenticación
    let currentUserId = req.user?._id || req.body.userId; // Fallback para desarrollo
    if (order.customer.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para procesar pagos de este pedido'
      });
    }

    // Verificar que el pedido esté en estado pendiente
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'El pedido no está en estado pendiente de pago'
      });
    }

    // Preparar datos para el pago
    const paymentData = {
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency,
      customerEmail: req.user?.email || 'customer@example.com', // Debería venir del auth
      description: `Pago del pedido ${order.orderNumber}`
    };

    // Crear el pago usando el servicio
    const paymentResult = await paymentService.createPayment(paymentData, paymentMethod);

    // Actualizar el pedido con la información del pago
    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'processing';

    // Guardar IDs específicos según el método
    switch (paymentMethod) {
      case 'paypal':
        order.paypalOrderId = paymentResult.paymentId;
        break;
      case 'mercadopago':
        order.mercadopagoPaymentId = paymentResult.paymentId;
        break;
      case 'conekta':
        order.conektaChargeId = paymentResult.paymentId;
        break;
      case 'apple_pay':
        order.applePayTransactionId = paymentResult.paymentId;
        break;
      case 'stripe':
        order.paymentIntentId = paymentResult.paymentId;
        break;
    }

    await order.save();

    res.json({
      success: true,
      data: {
        paymentId: paymentResult.paymentId,
        status: paymentResult.status,
        approvalUrl: paymentResult.approvalUrl,
        paymentUrl: paymentResult.paymentUrl,
        clientSecret: paymentResult.clientSecret
      }
    });
  } catch (error) {
    logger.error('Error creando pago:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Confirmar un pago completado
 */
const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Confirmar el pago usando el servicio
    const confirmationResult = await paymentService.confirmPayment(paymentId, order.paymentMethod);

    // Actualizar el estado del pedido
    if (confirmationResult.status === 'succeeded' || confirmationResult.status === 'COMPLETED') {
      order.paymentStatus = 'completed';
      order.status = 'confirmed';

      // Agregar al historial
      await order.addStatusHistory('confirmed', 'Pago confirmado exitosamente');
    }

    // Guardar el ID de transacción
    order.paymentReference = confirmationResult.transactionId;

    await order.save();

    res.json({
      success: true,
      data: {
        status: confirmationResult.status,
        transactionId: confirmationResult.transactionId
      }
    });
  } catch (error) {
    logger.error('Error confirmando pago:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Procesar reembolso de un pedido
 */
const processRefund = async (req, res) => {
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

    // Obtener el ID de pago según el método usado
    let paymentId;
    switch (order.paymentMethod) {
      case 'paypal':
        paymentId = order.paypalOrderId;
        break;
      case 'mercadopago':
        paymentId = order.mercadopagoPaymentId;
        break;
      case 'conekta':
        paymentId = order.conektaChargeId;
        break;
      case 'apple_pay':
        paymentId = order.applePayTransactionId;
        break;
      case 'stripe':
        paymentId = order.paymentIntentId;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Método de pago no soportado para reembolso'
        });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'ID de pago no encontrado'
      });
    }

    // Procesar el reembolso
    const refundResult = await paymentService.refundPayment(paymentId, amount, order.paymentMethod);

    // Actualizar el pedido con la información del reembolso
    await order.processRefund(amount, reason, req.user?._id);

    res.json({
      success: true,
      data: {
        refundId: refundResult.refundId,
        status: refundResult.status,
        amount: amount
      }
    });
  } catch (error) {
    logger.error('Error procesando reembolso:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Obtener métodos de pago disponibles
 */
const getPaymentMethods = async (req, res) => {
  try {
    const { country } = req.query;

    const methods = paymentService.getAvailableMethods(country);

    // Formatear respuesta con información adicional
    const formattedMethods = methods.map(method => ({
      id: method,
      name: getPaymentMethodName(method),
      description: getPaymentMethodDescription(method),
      currencies: getSupportedCurrencies(method),
      requiresSetup: !paymentService.providers[method]
    }));

    res.json({
      success: true,
      data: formattedMethods
    });
  } catch (error) {
    logger.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Funciones auxiliares
const getPaymentMethodName = (method) => {
  const names = {
    paypal: 'PayPal',
    apple_pay: 'Apple Pay',
    mercadopago: 'MercadoPago',
    conekta: 'Conekta',
    stripe: 'Stripe',
    bank_transfer: 'Transferencia Bancaria',
    cash_on_delivery: 'Pago contra entrega'
  };
  return names[method] || method;
};

const getPaymentMethodDescription = (method) => {
  const descriptions = {
    paypal: 'Paga de forma segura con tu cuenta PayPal',
    apple_pay: 'Pago rápido y seguro con Apple Pay',
    mercadopago: 'Paga con MercadoPago (México)',
    conekta: 'Tarjeta de crédito/débito con Conekta',
    stripe: 'Pago con tarjeta a través de Stripe',
    bank_transfer: 'Transferencia bancaria directa',
    cash_on_delivery: 'Paga al recibir tu pedido'
  };
  return descriptions[method] || '';
};

const getSupportedCurrencies = (method) => {
  const currencies = {
    paypal: ['USD', 'MXN', 'EUR'],
    apple_pay: ['USD', 'MXN', 'EUR'],
    mercadopago: ['MXN'],
    conekta: ['MXN'],
    stripe: ['USD', 'MXN', 'EUR'],
    bank_transfer: ['MXN'],
    cash_on_delivery: ['MXN']
  };
  return currencies[method] || ['USD'];
};

module.exports = {
  getUserOrders,
  getOrderDetails,
  getOrderTracking,
  reorderOrder,
  getOrderStats,
  createPayment,
  confirmPayment,
  processRefund,
  getPaymentMethods
};