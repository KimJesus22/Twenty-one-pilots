const express = require('express');
const { query, param, body } = require('express-validator');
const authService = require('../services/authService');
const Ticket = require('../models/Ticket');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware para verificar autenticación
const requireAuth = authService.authenticateToken;

// Validaciones comunes
const handleValidationErrors = (req, res, next) => {
  const errors = require('express-validator').validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en tickets:', {
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

// Obtener tickets del usuario
router.get('/user/:userId', requireAuth, [
  param('userId').isMongoId().withMessage('ID de usuario inválido'),
  query('status').optional().isIn(['reserved', 'confirmed', 'paid', 'delivered', 'used', 'cancelled', 'refunded']).withMessage('Status inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Verificar que el usuario solo vea sus propios tickets
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver estos tickets'
      });
    }

    const result = await Ticket.findByUser(userId, status)
      .populate('event', 'title date venue artist')
      .sort({ purchaseDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Ticket.countDocuments(
      status ? { user: userId, status } : { user: userId }
    );

    res.json({
      success: true,
      data: result,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Error obteniendo tickets del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener ticket específico
router.get('/:ticketId', requireAuth, [
  param('ticketId').isMongoId().withMessage('ID de ticket inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('event', 'title date venue artist')
      .populate('user', 'username email')
      .populate('order');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario
    if (ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver este ticket'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    logger.error('Error obteniendo ticket específico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Transferir ticket
router.post('/:ticketId/transfer', requireAuth, [
  param('ticketId').isMongoId().withMessage('ID de ticket inválido'),
  body('toUserId').isMongoId().withMessage('ID de usuario destino inválido'),
  body('transferFee').optional().isFloat({ min: 0 }).withMessage('Cargo de transferencia inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario
    if (ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para transferir este ticket'
      });
    }

    // Verificar que el ticket sea transferible
    if (!ticket.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Este ticket no puede ser transferido'
      });
    }

    await ticket.transferTo(req.body.toUserId, req.body.transferFee || 0);

    res.json({
      success: true,
      message: 'Ticket transferido exitosamente',
      data: ticket
    });
  } catch (error) {
    logger.error('Error transfiriendo ticket:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// Obtener tickets por evento (para administradores)
router.get('/event/:eventId', requireAuth, authService.requireAdmin, [
  param('eventId').isMongoId().withMessage('ID de evento inválido'),
  query('status').optional().isIn(['reserved', 'confirmed', 'paid', 'delivered', 'used', 'cancelled', 'refunded']).withMessage('Status inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;

    const result = await Ticket.findByEvent(eventId, status)
      .populate('user', 'username email')
      .sort({ purchaseDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Ticket.countDocuments(
      status ? { event: eventId, status } : { event: eventId }
    );

    res.json({
      success: true,
      data: result,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Error obteniendo tickets por evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Buscar ticket por número
router.get('/search/:ticketNumber', [
  param('ticketNumber').isString().notEmpty().withMessage('Número de ticket requerido'),
], async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketNumber: req.params.ticketNumber })
      .populate('event', 'title date venue artist')
      .populate('user', 'username');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    // Solo mostrar información básica para búsqueda
    res.json({
      success: true,
      data: {
        ticketNumber: ticket.ticketNumber,
        event: ticket.event,
        seat: ticket.seat,
        status: ticket.status,
        purchaseDate: ticket.purchaseDate
      }
    });
  } catch (error) {
    logger.error('Error buscando ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;