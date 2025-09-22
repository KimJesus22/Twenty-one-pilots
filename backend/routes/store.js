const express = require('express');
const { query, param, body } = require('express-validator');
const storeController = require('../controllers/storeController');
const { productsCache, productsInvalidation } = require('../middleware/cache');
const queueService = require('../services/queueService');
const authService = require('../services/authService');
const logger = require('../utils/logger');

const router = express.Router();

// Obtener productos con filtros y paginación
router.get('/products',
  productsCache, // Aplicar caché
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe estar entre 1 y 50'),
    query('category').optional().isIn(['clothing', 'accessories', 'music', 'posters', 'other']).withMessage('Categoría inválida'),
    query('search').optional().isString().withMessage('Search debe ser un string'),
    query('sort').optional().isIn(['name', 'price', 'createdAt']).withMessage('Sort inválido'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order debe ser asc o desc'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice debe ser un número positivo'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice debe ser un número positivo'),
  ],
  storeController.getProducts
);

// Obtener producto específico
router.get('/products/:id', [
  param('id').isMongoId().withMessage('ID de producto inválido'),
], storeController.getProductById);

// Obtener categorías
router.get('/categories', storeController.getCategories);

// Crear producto (solo admin)
router.post('/products',
  authService.authenticateToken,
  authService.requireAdmin,
  productsInvalidation, // Invalidar caché cuando se crea producto
  [
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Nombre requerido (1-200 caracteres)'),
    body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Descripción requerida (1-1000 caracteres)'),
    body('price').isFloat({ min: 0.01 }).withMessage('Precio debe ser mayor a 0'),
    body('category').isIn(['clothing', 'accessories', 'music', 'posters', 'other']).withMessage('Categoría inválida'),
    body('stock').isInt({ min: 0 }).withMessage('Stock debe ser un número entero no negativo'),
    body('image').optional().isURL().withMessage('URL de imagen inválida'),
  ],
  storeController.createProduct
);

// Actualizar producto (solo admin)
router.put('/products/:id',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    param('id').isMongoId().withMessage('ID de producto inválido'),
    body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Nombre inválido'),
    body('description').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Descripción inválida'),
    body('price').optional().isFloat({ min: 0.01 }).withMessage('Precio debe ser mayor a 0'),
    body('category').optional().isIn(['clothing', 'accessories', 'music', 'posters', 'other']).withMessage('Categoría inválida'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock debe ser un número entero no negativo'),
    body('image').optional().isURL().withMessage('URL de imagen inválida'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable debe ser un booleano'),
  ],
  storeController.updateProduct
);

// Eliminar producto (solo admin)
router.delete('/products/:id',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    param('id').isMongoId().withMessage('ID de producto inválido'),
  ],
  storeController.deleteProduct
);

// Procesar pago
router.post('/checkout', [
  body('items').isArray({ min: 1 }).withMessage('Items requeridos'),
  body('items.*.productId').isMongoId().withMessage('ID de producto inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('successUrl').optional().isURL().withMessage('successUrl debe ser una URL válida'),
  body('cancelUrl').optional().isURL().withMessage('cancelUrl debe ser una URL válida'),
], storeController.processPayment);

// Webhook de Stripe (no requiere autenticación)
router.post('/webhook', express.raw({ type: 'application/json' }), storeController.handleWebhook);

// ===== RESEÑAS =====
// Obtener reseñas de un producto
router.get('/products/:productId/reviews', [
  param('productId').isMongoId().withMessage('ID de producto inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe estar entre 1 y 50'),
  query('sort').optional().isIn(['createdAt', 'rating', 'helpful']).withMessage('Sort inválido'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order debe ser asc o desc'),
], storeController.getProductReviews);

// Crear reseña
router.post('/products/:productId/reviews', [
  param('productId').isMongoId().withMessage('ID de producto inválido'),
  body('customerId').isMongoId().withMessage('ID de cliente inválido'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe estar entre 1 y 5'),
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Título requerido (1-100 caracteres)'),
  body('comment').trim().isLength({ min: 1, max: 1000 }).withMessage('Comentario requerido (1-1000 caracteres)'),
  body('orderId').optional().isMongoId().withMessage('ID de pedido inválido'),
  body('pros').optional().isArray().withMessage('Pros debe ser un array'),
  body('cons').optional().isArray().withMessage('Cons debe ser un array'),
  body('recommended').optional().isBoolean().withMessage('Recommended debe ser un booleano'),
], storeController.createReview);

// Marcar reseña como útil
router.post('/reviews/:reviewId/helpful', [
  param('reviewId').isMongoId().withMessage('ID de reseña inválido'),
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
  body('helpful').isBoolean().withMessage('Helpful debe ser un booleano'),
], storeController.markReviewHelpful);

// ===== PEDIDOS =====
// Crear pedido
router.post('/orders', [
  body('customerId').isMongoId().withMessage('ID de cliente inválido'),
  body('items').isArray({ min: 1 }).withMessage('Items requeridos'),
  body('items.*.productId').isMongoId().withMessage('ID de producto inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('shippingAddress.firstName').trim().isLength({ min: 1 }).withMessage('Nombre requerido'),
  body('shippingAddress.lastName').trim().isLength({ min: 1 }).withMessage('Apellido requerido'),
  body('shippingAddress.address1').trim().isLength({ min: 1 }).withMessage('Dirección requerida'),
  body('shippingAddress.city').trim().isLength({ min: 1 }).withMessage('Ciudad requerida'),
  body('shippingAddress.postalCode').trim().isLength({ min: 1 }).withMessage('Código postal requerido'),
  body('shippingAddress.country').trim().isLength({ min: 1 }).withMessage('País requerido'),
  body('paymentMethod').isIn(['stripe', 'paypal', 'bank_transfer', 'cash_on_delivery']).withMessage('Método de pago inválido'),
], storeController.createOrder);

// Obtener pedidos del usuario
router.get('/orders/user/:userId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe estar entre 1 y 50'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned']).withMessage('Status inválido'),
], storeController.getUserOrders);

// Obtener pedido específico
router.get('/orders/:orderId', [
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  query('userId').isMongoId().withMessage('ID de usuario requerido para verificación'),
], storeController.getOrderById);

// Actualizar estado del pedido (admin)
router.put('/orders/:orderId/status', authService.authenticateToken, authService.requireAdmin, [
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned']).withMessage('Status inválido'),
  body('trackingNumber').optional().isString().withMessage('Número de seguimiento inválido'),
  body('carrier').optional().isString().withMessage('Transportista inválido'),
  body('note').optional().isString().withMessage('Nota inválida'),
], storeController.updateOrderStatus);

// Procesar reembolso (admin)
router.post('/orders/:orderId/refund', authService.authenticateToken, authService.requireAdmin, [
  param('orderId').isMongoId().withMessage('ID de pedido inválido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('reason').trim().isLength({ min: 1 }).withMessage('Razón requerida'),
], storeController.processRefund);

// ===== RECOMENDACIONES =====
// Obtener recomendaciones personalizadas
router.get('/recommendations', [
  query('userId').optional().isMongoId().withMessage('ID de usuario inválido'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit debe estar entre 1 y 20'),
], storeController.getRecommendations);

// ===== SOPORTE AL CLIENTE =====
// Crear ticket de soporte
router.post('/support/tickets', [
  body('customerId').isMongoId().withMessage('ID de cliente inválido'),
  body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Asunto requerido (1-200 caracteres)'),
  body('category').isIn(['order_issue', 'product_question', 'shipping', 'returns', 'refund', 'payment', 'account', 'technical', 'feedback', 'other']).withMessage('Categoría inválida'),
  body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Descripción requerida (1-1000 caracteres)'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Prioridad inválida'),
  body('relatedOrder').optional().isMongoId().withMessage('ID de pedido inválido'),
  body('relatedProduct').optional().isMongoId().withMessage('ID de producto inválido'),
], storeController.createSupportTicket);

// Obtener tickets del usuario
router.get('/support/tickets/user/:userId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe estar entre 1 y 50'),
  query('status').optional().isIn(['open', 'in_progress', 'waiting_customer', 'waiting_agent', 'resolved', 'closed']).withMessage('Status inválido'),
], storeController.getUserTickets);

// Agregar mensaje a ticket
router.post('/support/tickets/:ticketId/messages', [
  param('ticketId').isMongoId().withMessage('ID de ticket inválido'),
  body('senderId').isMongoId().withMessage('ID de remitente inválido'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Mensaje requerido (1-1000 caracteres)'),
  body('attachments').optional().isArray().withMessage('Attachments debe ser un array'),
], storeController.addTicketMessage);

// ===== ESTADÍSTICAS =====
// Obtener estadísticas de la tienda (admin)
router.get('/stats', authService.authenticateToken, authService.requireAdmin, storeController.getStoreStats);

// ===== PRIVACIDAD GDPR/CCPA =====
// Solicitar eliminación de datos
router.post('/privacy/delete-data', [
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
  body('reason').trim().isLength({ min: 1 }).withMessage('Razón requerida'),
], storeController.requestDataDeletion);

// Exportar datos del usuario
router.get('/privacy/export-data/:userId', [
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
], storeController.exportUserData);

// Ruta de compatibilidad
router.get('/', (req, res) => {
  res.json({
    message: 'Store API - Advanced E-commerce',
    version: '2.0',
    features: [
      'Productos con variantes (tallas, colores)',
      'Sistema de reseñas y valoraciones',
      'Pedidos con seguimiento completo',
      'Sistema de soporte al cliente',
      'Recomendaciones personalizadas',
      'Integración Stripe/PayPal',
      'Cumplimiento GDPR/CCPA'
    ],
    endpoints: [
      'GET /api/store/products - Obtener productos con filtros avanzados',
      'GET /api/store/products/:id - Detalles de producto',
      'GET /api/store/products/:id/reviews - Reseñas del producto',
      'POST /api/store/products/:id/reviews - Crear reseña',
      'POST /api/store/orders - Crear pedido',
      'GET /api/store/orders/user/:userId - Pedidos del usuario',
      'GET /api/store/orders/:orderId - Detalles de pedido',
      'GET /api/store/recommendations - Recomendaciones personalizadas',
      'POST /api/store/support/tickets - Crear ticket de soporte',
      'GET /api/store/support/tickets/user/:userId - Tickets del usuario',
      'POST /api/store/checkout - Procesar pago',
      'POST /api/store/webhook - Webhook de pagos'
    ]
  });
});

module.exports = router;