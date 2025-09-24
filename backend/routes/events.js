const express = require('express');
const { query, param, body } = require('express-validator');
const eventController = require('../controllers/eventController');
const authService = require('../services/authService');
const ticketingService = require('../services/ticketingService');
const logger = require('../utils/logger');

const router = express.Router();

// Obtener eventos con filtros avanzados
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe estar entre 1 y 50'),
  query('sort').optional().isIn(['date', 'popularity', 'views', 'title']).withMessage('Sort inválido'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order debe ser asc o desc'),
  query('search').optional().isString().withMessage('Search debe ser un string'),
  query('genre').optional().isIn(['rock', 'alternative', 'indie', 'pop', 'electronic', 'other']).withMessage('Género inválido'),
  query('type').optional().isIn(['concert', 'festival', 'album-release', 'tour', 'special-event']).withMessage('Tipo inválido'),
  query('startDate').optional().isISO8601().withMessage('startDate debe ser una fecha válida'),
  query('endDate').optional().isISO8601().withMessage('endDate debe ser una fecha válida'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice debe ser un número positivo'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice debe ser un número positivo'),
  query('isFree').optional().isIn(['true', 'false']).withMessage('isFree debe ser true o false'),
  query('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude inválida'),
  query('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude inválida'),
  query('maxDistance').optional().isInt({ min: 1, max: 500 }).withMessage('maxDistance debe estar entre 1 y 500 km'),
  query('city').optional().isString().withMessage('City debe ser un string'),
  query('country').optional().isString().withMessage('Country debe ser un string'),
], eventController.getEvents);

// Obtener evento específico
router.get('/:id', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
], eventController.getEventById);

// Obtener eventos cercanos
router.get('/nearby/events', [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude requerida'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude requerida'),
  query('maxDistance').optional().isInt({ min: 1, max: 500 }).withMessage('maxDistance inválida'),
], eventController.getNearbyEvents);

// Crear evento (solo admin)
router.post('/', authService.authenticateToken, authService.requireAdmin, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Título requerido (1-200 caracteres)'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Descripción muy larga'),
  body('artist').optional().trim().isLength({ max: 100 }).withMessage('Artista muy largo'),
  body('date').isISO8601().withMessage('Fecha requerida y válida'),
  body('endDate').optional().isISO8601().withMessage('endDate debe ser una fecha válida'),
  body('venue.name').trim().isLength({ min: 1, max: 200 }).withMessage('Nombre del venue requerido'),
  body('venue.address').trim().isLength({ min: 1, max: 300 }).withMessage('Dirección requerida'),
  body('venue.city').trim().isLength({ min: 1, max: 100 }).withMessage('Ciudad requerida'),
  body('venue.state').optional().trim().isLength({ max: 100 }).withMessage('Estado muy largo'),
  body('venue.country').trim().isLength({ min: 1, max: 100 }).withMessage('País requerido'),
  body('venue.coordinates.latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude inválida'),
  body('venue.coordinates.longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude inválida'),
  body('genre').optional().isIn(['rock', 'alternative', 'indie', 'pop', 'electronic', 'other']).withMessage('Género inválido'),
  body('type').optional().isIn(['concert', 'festival', 'album-release', 'tour', 'special-event']).withMessage('Tipo inválido'),
  body('price.min').optional().isFloat({ min: 0 }).withMessage('Precio mínimo inválido'),
  body('price.max').optional().isFloat({ min: 0 }).withMessage('Precio máximo inválido'),
  body('price.currency').optional().isIn(['USD', 'EUR', 'MXN']).withMessage('Moneda inválida'),
  body('isFree').optional().isBoolean().withMessage('isFree debe ser un booleano'),
  body('ticketUrl').optional().isURL().withMessage('ticketUrl debe ser una URL válida'),
  body('eventbriteId').optional().isString().withMessage('eventbriteId debe ser un string'),
  body('image').optional().isURL().withMessage('image debe ser una URL válida'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('capacity debe ser un número positivo'),
  body('relatedAlbums').optional().isArray().withMessage('relatedAlbums debe ser un array'),
  body('spotifyPlaylist').optional().isString().withMessage('spotifyPlaylist debe ser un string'),
  body('youtubeVideo').optional().isString().withMessage('youtubeVideo debe ser un string'),
  body('tags').optional().isArray().withMessage('tags debe ser un array'),
], eventController.createEvent);

// Actualizar evento (solo admin)
router.put('/:id', authService.authenticateToken, authService.requireAdmin, [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Título inválido'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Descripción muy larga'),
  body('date').optional().isISO8601().withMessage('Fecha inválida'),
  body('endDate').optional().isISO8601().withMessage('endDate inválido'),
  body('venue.name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Nombre del venue inválido'),
  body('venue.address').optional().trim().isLength({ min: 1, max: 300 }).withMessage('Dirección inválida'),
  body('venue.city').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Ciudad inválida'),
  body('venue.country').optional().trim().isLength({ min: 1, max: 100 }).withMessage('País inválido'),
  body('venue.coordinates.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude inválida'),
  body('venue.coordinates.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude inválida'),
  body('genre').optional().isIn(['rock', 'alternative', 'indie', 'pop', 'electronic', 'other']).withMessage('Género inválido'),
  body('type').optional().isIn(['concert', 'festival', 'album-release', 'tour', 'special-event']).withMessage('Tipo inválido'),
  body('price.min').optional().isFloat({ min: 0 }).withMessage('Precio mínimo inválido'),
  body('price.max').optional().isFloat({ min: 0 }).withMessage('Precio máximo inválido'),
  body('isFree').optional().isBoolean().withMessage('isFree debe ser un booleano'),
  body('ticketUrl').optional().isURL().withMessage('ticketUrl inválida'),
  body('image').optional().isURL().withMessage('image inválida'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('capacity inválido'),
  body('soldOut').optional().isBoolean().withMessage('soldOut debe ser un booleano'),
  body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']).withMessage('Status inválido'),
], eventController.updateEvent);

// Eliminar evento (solo admin)
router.delete('/:id', authService.authenticateToken, authService.requireAdmin, [
  param('id').isMongoId().withMessage('ID de evento inválido'),
], eventController.deleteEvent);

// Dar/quitar like a evento
router.post('/:id/like', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
], eventController.toggleEventLike);

// Marcar asistencia a evento
router.post('/:id/attend', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  body('userId').isMongoId().withMessage('ID de usuario inválido'),
], eventController.toggleAttendance);

// Obtener enlace de calendario
router.get('/:id/calendar', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
], eventController.getCalendarLink);

// Descargar archivo iCalendar
router.get('/:id/icalendar', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
], eventController.getICalendar);

// Obtener estadísticas de eventos
router.get('/stats/overview', eventController.getEventStats);

// ===== RUTAS DE TICKETING =====

// Buscar eventos con ticketing disponible
router.get('/ticketing/search', [
  query('query').optional().isString().withMessage('Query debe ser un string'),
  query('location').optional().isString().withMessage('Location debe ser un string'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit debe estar entre 1 y 50'),
], async (req, res) => {
  try {
    const result = await ticketingService.searchEventsWithTickets(
      req.query.query,
      req.query.location,
      { limit: req.query.limit }
    );
    res.json(result);
  } catch (error) {
    logger.error('Error buscando eventos con ticketing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener detalles de ticketing de un evento
router.get('/:id/ticketing', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  query('provider').optional().isIn(['internal', 'eventbrite', 'ticketmaster']).withMessage('Provider inválido'),
], async (req, res) => {
  try {
    const result = await ticketingService.getEventTicketingDetails(
      req.params.id,
      req.query.provider || 'internal'
    );
    res.json(result);
  } catch (error) {
    logger.error('Error obteniendo detalles de ticketing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener disponibilidad de asientos
router.get('/:id/seats/availability', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  query('provider').optional().isIn(['internal', 'eventbrite', 'ticketmaster']).withMessage('Provider inválido'),
], async (req, res) => {
  try {
    const result = await ticketingService.getSeatAvailability(
      req.params.id,
      req.query.provider || 'internal'
    );
    res.json(result);
  } catch (error) {
    logger.error('Error obteniendo disponibilidad de asientos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reservar asientos (requiere autenticación)
router.post('/:id/seats/reserve', authService.authenticateToken, [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  body('seats').isArray({ min: 1, max: 10 }).withMessage('Debe seleccionar entre 1 y 10 asientos'),
  body('seats.*.section').isString().notEmpty().withMessage('Sección requerida'),
  body('seats.*.row').isString().notEmpty().withMessage('Fila requerida'),
  body('seats.*.seat').isString().notEmpty().withMessage('Asiento requerido'),
  body('provider').optional().isIn(['internal', 'eventbrite', 'ticketmaster']).withMessage('Provider inválido'),
], async (req, res) => {
  try {
    const result = await ticketingService.reserveSeats(
      req.params.id,
      req.body.seats,
      req.user._id,
      req.body.provider || 'internal'
    );
    res.json(result);
  } catch (error) {
    logger.error('Error reservando asientos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comprar tickets (requiere autenticación)
router.post('/:id/tickets/purchase', authService.authenticateToken, [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  body('reservationId').optional().isString().withMessage('ID de reserva inválido'),
  body('paymentMethod').isIn(['paypal', 'mercadopago', 'stripe', 'bank_transfer', 'cash_on_delivery']).withMessage('Método de pago inválido'),
  body('seats').optional().isArray().withMessage('Asientos deben ser un array'),
], async (req, res) => {
  try {
    const result = await ticketingService.purchaseTickets(
      req.body.reservationId,
      req.body.paymentMethod,
      req.user._id
    );
    res.json(result);
  } catch (error) {
    logger.error('Error comprando tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Solicitar reembolso de tickets (requiere autenticación)
router.post('/:id/tickets/refund', authService.authenticateToken, [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  body('ticketIds').isArray({ min: 1 }).withMessage('Debe proporcionar al menos un ticket'),
  body('ticketIds.*').isMongoId().withMessage('ID de ticket inválido'),
  body('reason').isString().notEmpty().withMessage('Razón del reembolso requerida'),
], async (req, res) => {
  try {
    const result = await ticketingService.refundTickets(
      req.body.ticketIds,
      req.body.reason,
      req.user._id
    );
    res.json(result);
  } catch (error) {
    logger.error('Error procesando reembolso:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validar ticket para entrada
router.post('/:id/tickets/validate', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
  body('ticketNumber').isString().notEmpty().withMessage('Número de ticket requerido'),
], async (req, res) => {
  try {
    const result = await ticketingService.validateTicket(
      req.body.ticketNumber,
      req.params.id
    );
    res.json(result);
  } catch (error) {
    logger.error('Error validando ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas de ticketing
router.get('/:id/ticketing/stats', [
  param('id').isMongoId().withMessage('ID de evento inválido'),
], async (req, res) => {
  try {
    const result = await ticketingService.getTicketingStats(req.params.id);
    res.json(result);
  } catch (error) {
    logger.error('Error obteniendo estadísticas de ticketing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;