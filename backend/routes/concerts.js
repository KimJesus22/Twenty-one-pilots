const express = require('express');
const { query, param } = require('express-validator');
const eventbriteService = require('../services/eventbriteService');
const { concertsCache } = require('../middleware/cache');
const queueService = require('../services/queueService');
const logger = require('../utils/logger');

const router = express.Router();

// Ruta para buscar conciertos
router.get('/search',
  concertsCache, // Aplicar caché
  [
    query('q').optional().isString().withMessage('Query debe ser un string'),
    query('location').optional().isString().withMessage('Location debe ser un string'),
    query('maxResults').optional().isInt({ min: 1, max: 50 }).withMessage('maxResults debe ser entre 1 y 50'),
  ],
  async (req, res) => {
    try {
      const { q, location, maxResults = 20 } = req.query;

      const result = await eventbriteService.searchEvents(q, location, parseInt(maxResults));

      if (!result.success) {
        logger.externalApi('Eventbrite', 'search', false, { query: q, location, error: result.error });
        return res.status(500).json({
          success: false,
          message: 'Error buscando conciertos',
          error: result.error
        });
      }

      logger.externalApi('Eventbrite', 'search', true, {
        query: q,
        location,
        resultsCount: result.data.length
      });

      // Enviar métricas de búsqueda a la cola de analytics (asíncrono)
      try {
        await queueService.addAnalyticsJob('search-analytics', {
          query: q,
          location,
          results: result.data.length,
          userId: req.user?.id,
          filters: { location, maxResults },
          searchType: 'concerts'
        });
      } catch (analyticsError) {
        logger.error('Error sending search analytics:', analyticsError);
        // No fallar la respuesta por error en analytics
      }

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error en ruta /concerts/search:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Ruta para obtener detalles de un concierto específico
router.get('/:id',
  [
    param('id').isString().notEmpty().withMessage('ID de concierto requerido'),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await eventbriteService.getEventDetails(id);

      if (!result.success) {
        logger.externalApi('Eventbrite', 'getEventDetails', false, { eventId: id, error: result.error });
        return res.status(404).json({
          success: false,
          message: 'Concierto no encontrado',
          error: result.error
        });
      }

      logger.externalApi('Eventbrite', 'getEventDetails', true, { eventId: id });
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Error en ruta /concerts/:id:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Ruta para buscar conciertos por ubicación
router.get('/location/search',
  [
    query('location').isString().notEmpty().withMessage('Location requerida'),
    query('radius').optional().isInt({ min: 1, max: 100 }).withMessage('Radius debe ser entre 1 y 100 km'),
    query('maxResults').optional().isInt({ min: 1, max: 50 }).withMessage('maxResults debe ser entre 1 y 50'),
  ],
  async (req, res) => {
    try {
      const { location, radius = 50, maxResults = 20 } = req.query;

      const result = await eventbriteService.searchEventsByLocation(
        location,
        parseInt(radius),
        parseInt(maxResults)
      );

      if (!result.success) {
        logger.externalApi('Eventbrite', 'searchByLocation', false, {
          location,
          radius,
          error: result.error
        });
        return res.status(500).json({
          success: false,
          message: 'Error buscando conciertos por ubicación',
          error: result.error
        });
      }

      logger.externalApi('Eventbrite', 'searchByLocation', true, {
        location,
        radius,
        resultsCount: result.data.length
      });

      res.json({
        success: true,
        data: result.data,
        location: result.location,
        radius: result.radius
      });
    } catch (error) {
      logger.error('Error en ruta /concerts/location/search:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Ruta para obtener conciertos próximos
router.get('/upcoming/list',
  [
    query('organizerId').optional().isString().withMessage('Organizer ID debe ser un string'),
    query('maxResults').optional().isInt({ min: 1, max: 50 }).withMessage('maxResults debe ser entre 1 y 50'),
  ],
  async (req, res) => {
    try {
      const { organizerId, maxResults = 20 } = req.query;

      const result = await eventbriteService.getUpcomingEvents(organizerId, parseInt(maxResults));

      if (!result.success) {
        logger.externalApi('Eventbrite', 'getUpcomingEvents', false, {
          organizerId,
          error: result.error
        });
        return res.status(500).json({
          success: false,
          message: 'Error obteniendo conciertos próximos',
          error: result.error
        });
      }

      logger.externalApi('Eventbrite', 'getUpcomingEvents', true, {
        organizerId,
        resultsCount: result.data.length
      });

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Error en ruta /concerts/upcoming/list:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;