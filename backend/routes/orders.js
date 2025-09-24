const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const orderController = require('../controllers/orderController');
const { validateMongoId } = require('../middleware/security');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware para verificar autenticación (simplificado)
const requireAuth = (req, res, next) => {
  // En producción, verificar JWT token
  next();
};

// Validaciones
const paginationValidations = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  query('status').optional().isIn(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned', 'completed']).withMessage('Estado inválido'),
  query('sortBy').optional().isIn(['createdAt', 'total', 'status']).withMessage('Campo de ordenamiento inválido'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Orden inválido')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en orders:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Obtener historial de pedidos del usuario
router.get('/user/:userId', [
  requireAuth,
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  ...paginationValidations,
  handleValidationErrors
], orderController.getUserOrders);

// Obtener estadísticas de pedidos del usuario
router.get('/user/:userId/stats', [
  requireAuth,
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  handleValidationErrors
], orderController.getOrderStats);

// Obtener detalles de un pedido específico
router.get('/:orderId', [
  requireAuth,
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  query('userId').isMongoId().withMessage('ID de usuario inválido'),
  handleValidationErrors
], orderController.getOrderDetails);

// Obtener seguimiento de envío
router.get('/:orderId/tracking', [
  requireAuth,
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  query('userId').isMongoId().withMessage('ID de usuario inválido'),
  handleValidationErrors
], orderController.getOrderTracking);

// Reordenar productos de un pedido anterior
router.post('/:orderId/reorder', [
  requireAuth,
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
  handleValidationErrors
], orderController.reorderOrder);

// Crear un pago para un pedido
router.post('/:orderId/payment', [
  requireAuth,
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  body('paymentMethod').isIn(['paypal', 'apple_pay', 'mercadopago', 'conekta', 'stripe', 'bank_transfer', 'cash_on_delivery']).withMessage('Método de pago inválido'),
  handleValidationErrors
], orderController.createPayment);

// Confirmar un pago completado
router.post('/:orderId/payment/confirm', [
  requireAuth,
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  body('paymentId').isString().notEmpty().withMessage('ID de pago requerido'),
  handleValidationErrors
], orderController.confirmPayment);

// Procesar reembolso
router.post('/:orderId/refund', [
  requireAuth,
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Monto de reembolso inválido'),
  body('reason').isString().notEmpty().withMessage('Razón del reembolso requerida'),
  handleValidationErrors
], orderController.processRefund);

// Obtener métodos de pago disponibles
router.get('/payment-methods', [
  query('country').optional().isString().withMessage('País inválido'),
  handleValidationErrors
], orderController.getPaymentMethods);

module.exports = router;