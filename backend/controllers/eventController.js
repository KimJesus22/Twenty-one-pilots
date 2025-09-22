const Event = require('../models/Event');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class EventController {
  // Obtener eventos con filtros avanzados
  async getEvents(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        sort = 'date',
        order = 'asc',
        search = '',
        genre,
        type,
        startDate,
        endDate,
        minPrice,
        maxPrice,
        isFree,
        latitude,
        longitude,
        maxDistance,
        city,
        country
      } = req.query;

      const query = { status: { $in: ['upcoming', 'ongoing'] } };

      // Búsqueda por texto
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { artist: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'venue.name': { $regex: search, $options: 'i' } },
          { 'venue.city': { $regex: search, $options: 'i' } }
        ];
      }

      // Filtros
      if (genre && genre !== 'all') query.genre = genre;
      if (type && type !== 'all') query.type = type;
      if (city) query['venue.city'] = { $regex: city, $options: 'i' };
      if (country) query['venue.country'] = { $regex: country, $options: 'i' };

      // Filtro por precio
      if (isFree === 'true') {
        query.isFree = true;
      } else if (minPrice || maxPrice) {
        query.isFree = false;
        if (minPrice || maxPrice) {
          query['price.min'] = {};
          if (minPrice) query['price.min'].$gte = parseFloat(minPrice);
          if (maxPrice) query['price.min'].$lte = parseFloat(maxPrice);
        }
      }

      // Filtro por fecha
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      // Filtro por distancia (requiere coordenadas del usuario)
      if (latitude && longitude && maxDistance) {
        query['venue.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance) * 1000 // Convertir km a metros
          }
        };
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        populate: ['relatedAlbums']
      };

      const result = await Event.paginate(query, options);

      res.json({
        success: true,
        data: {
          events: result.docs,
          pagination: {
            page: result.page,
            pages: result.totalPages,
            total: result.totalDocs,
            limit: result.limit
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo eventos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo eventos'
      });
    }
  }

  // Obtener evento específico
  async getEventById(req, res) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id)
        .populate('relatedAlbums')
        .populate('likes', 'username')
        .populate('attending', 'username');

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      // Incrementar contador de vistas
      await Event.findByIdAndUpdate(id, { $inc: { views: 1 } });

      res.json({
        success: true,
        data: { event }
      });
    } catch (error) {
      logger.error('Error obteniendo evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo evento'
      });
    }
  }

  // Crear evento (solo admin)
  async createEvent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const event = new Event(req.body);
      await event.save();

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: { event }
      });
    } catch (error) {
      logger.error('Error creando evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando evento'
      });
    }
  }

  // Actualizar evento (solo admin)
  async updateEvent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const event = await Event.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Evento actualizado exitosamente',
        data: { event }
      });
    } catch (error) {
      logger.error('Error actualizando evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando evento'
      });
    }
  }

  // Eliminar evento (solo admin)
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;

      const event = await Event.findByIdAndDelete(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Evento eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando evento'
      });
    }
  }

  // Dar/quitar like a evento
  async toggleEventLike(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      const userIndex = event.likes.indexOf(userId);
      if (userIndex > -1) {
        event.likes.splice(userIndex, 1);
      } else {
        event.likes.push(userId);
      }

      await event.save();

      res.json({
        success: true,
        data: {
          likes: event.likes.length,
          isLiked: userIndex === -1
        }
      });
    } catch (error) {
      logger.error('Error toggling event like:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando like'
      });
    }
  }

  // Marcar asistencia a evento
  async toggleAttendance(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      const userIndex = event.attending.indexOf(userId);
      if (userIndex > -1) {
        event.attending.splice(userIndex, 1);
      } else {
        event.attending.push(userId);
      }

      await event.save();

      res.json({
        success: true,
        data: {
          attending: event.attending.length,
          isAttending: userIndex === -1
        }
      });
    } catch (error) {
      logger.error('Error toggling attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando asistencia'
      });
    }
  }

  // Generar enlace de calendario
  async getCalendarLink(req, res) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      const calendarLink = event.generateCalendarLink();

      res.json({
        success: true,
        data: { calendarLink }
      });
    } catch (error) {
      logger.error('Error generando calendar link:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando enlace de calendario'
      });
    }
  }

  // Generar archivo iCalendar
  async getICalendar(req, res) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      const icalData = event.generateICalendar();

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${event.title}.ics"`);
      res.send(icalData);
    } catch (error) {
      logger.error('Error generando iCalendar:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando archivo de calendario'
      });
    }
  }

  // Obtener estadísticas de eventos
  async getEventStats(req, res) {
    try {
      const stats = await Event.aggregate([
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            totalViews: { $sum: '$views' },
            totalLikes: { $sum: { $size: '$likes' } },
            totalAttending: { $sum: { $size: '$attending' } },
            avgPopularity: { $avg: '$popularity' },
            eventsByGenre: {
              $push: '$genre'
            },
            eventsByType: {
              $push: '$type'
            }
          }
        }
      ]);

      // Contar por género y tipo
      const genreCount = {};
      const typeCount = {};

      if (stats[0]) {
        stats[0].eventsByGenre.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
        stats[0].eventsByType.forEach(type => {
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
      }

      res.json({
        success: true,
        data: {
          ...stats[0],
          genreBreakdown: genreCount,
          typeBreakdown: typeCount
        }
      });
    } catch (error) {
      logger.error('Error getting event stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas'
      });
    }
  }

  // Obtener eventos cercanos (basado en geolocalización)
  async getNearbyEvents(req, res) {
    try {
      const { latitude, longitude, maxDistance = 50 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas requeridas'
        });
      }

      const events = await Event.find({
        'venue.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance) * 1000
          }
        },
        status: { $in: ['upcoming', 'ongoing'] },
        date: { $gte: new Date() }
      }).limit(20);

      res.json({
        success: true,
        data: { events }
      });
    } catch (error) {
      logger.error('Error getting nearby events:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo eventos cercanos'
      });
    }
  }
}

module.exports = new EventController();