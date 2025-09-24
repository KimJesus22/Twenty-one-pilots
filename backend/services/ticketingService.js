const axios = require('axios');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const eventbriteService = require('./eventbriteService');
const paymentService = require('./paymentService');
const logger = require('../utils/logger');

class TicketingService {
  constructor() {
    // Configuración de proveedores externos
    this.providers = {
      eventbrite: {
        apiKey: process.env.EVENTBRITE_API_KEY,
        baseUrl: 'https://www.eventbriteapi.com/v3',
        enabled: !!process.env.EVENTBRITE_API_KEY
      },
      ticketmaster: {
        apiKey: process.env.TICKETMASTER_API_KEY,
        baseUrl: 'https://app.ticketmaster.com/discovery/v2',
        enabled: !!process.env.TICKETMASTER_API_KEY
      }
    };
  }

  // Buscar eventos con ticketing disponible
  async searchEventsWithTickets(query = 'Twenty One Pilots', location = 'Mexico', options = {}) {
    try {
      const results = {
        internal: [],
        eventbrite: [],
        ticketmaster: []
      };

      // Buscar eventos internos con ticketing habilitado
      const internalEvents = await Event.find({
        'ticketing.enabled': true,
        $or: [
          { title: new RegExp(query, 'i') },
          { artist: new RegExp(query, 'i') },
          { description: new RegExp(query, 'i') }
        ],
        date: { $gte: new Date() },
        status: 'upcoming'
      }).limit(options.limit || 20);

      results.internal = internalEvents.map(event => ({
        id: event._id,
        provider: 'internal',
        title: event.title,
        artist: event.artist,
        date: event.date,
        venue: event.venue,
        availableTickets: event.getAvailableTickets(),
        price: event.price,
        image: event.image
      }));

      // Buscar en Eventbrite si está habilitado
      if (this.providers.eventbrite.enabled) {
        try {
          const eventbriteResults = await eventbriteService.searchEvents(query, location, options.limit || 20);
          results.eventbrite = eventbriteResults.data.map(event => ({
            ...event,
            provider: 'eventbrite',
            externalId: event.id
          }));
        } catch (error) {
          logger.warn('Error buscando en Eventbrite:', error.message);
        }
      }

      // Buscar en Ticketmaster si está habilitado
      if (this.providers.ticketmaster.enabled) {
        try {
          const ticketmasterResults = await this.searchTicketmasterEvents(query, location, options);
          results.ticketmaster = ticketmasterResults;
        } catch (error) {
          logger.warn('Error buscando en Ticketmaster:', error.message);
        }
      }

      return {
        success: true,
        data: {
          ...results,
          total: results.internal.length + results.eventbrite.length + results.ticketmaster.length
        }
      };
    } catch (error) {
      logger.error('Error en searchEventsWithTickets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Buscar eventos en Ticketmaster
  async searchTicketmasterEvents(query, location, options = {}) {
    try {
      const response = await axios.get(`${this.providers.ticketmaster.baseUrl}/events.json`, {
        params: {
          apikey: this.providers.ticketmaster.apiKey,
          keyword: query,
          city: location,
          classificationName: 'music',
          size: options.limit || 20,
          sort: 'date,asc'
        },
        timeout: 10000
      });

      return response.data._embedded?.events?.map(event => ({
        id: event.id,
        provider: 'ticketmaster',
        title: event.name,
        artist: event._embedded?.attractions?.[0]?.name || 'Artista desconocido',
        date: event.dates?.start?.dateTime,
        venue: event._embedded?.venues?.[0] ? {
          name: event._embedded.venues[0].name,
          city: event._embedded.venues[0].city?.name,
          address: event._embedded.venues[0].address?.line1
        } : null,
        price: event.priceRanges?.[0] ? {
          min: event.priceRanges[0].min,
          max: event.priceRanges[0].max,
          currency: event.priceRanges[0].currency
        } : null,
        image: event.images?.[0]?.url,
        url: event.url
      })) || [];
    } catch (error) {
      logger.error('Error en Ticketmaster API:', error);
      throw error;
    }
  }

  // Obtener detalles de evento con información de ticketing
  async getEventTicketingDetails(eventId, provider = 'internal') {
    try {
      let event;

      if (provider === 'internal') {
        event = await Event.findById(eventId);
        if (!event) {
          throw new Error('Evento no encontrado');
        }

        return {
          success: true,
          data: {
            id: event._id,
            provider: 'internal',
            title: event.title,
            artist: event.artist,
            date: event.date,
            venue: event.venue,
            ticketing: {
              enabled: event.isTicketingEnabled(),
              ticketTypes: event.getAvailableTickets(),
              refundPolicy: event.ticketing?.refundPolicy
            },
            seating: {
              sections: event.getVenueSections(),
              layout: event.venue.layout
            }
          }
        };
      } else if (provider === 'eventbrite') {
        const result = await eventbriteService.getEventDetails(eventId);
        if (result.success) {
          return {
            success: true,
            data: {
              ...result.data,
              provider: 'eventbrite',
              ticketing: {
                enabled: true,
                externalUrl: result.data.url
              }
            }
          };
        }
      } else if (provider === 'ticketmaster') {
        // Implementar obtención de detalles de Ticketmaster
        throw new Error('Ticketmaster integration not fully implemented');
      }

      throw new Error('Proveedor no soportado');
    } catch (error) {
      logger.error('Error obteniendo detalles de ticketing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener disponibilidad de asientos para un evento
  async getSeatAvailability(eventId, provider = 'internal') {
    try {
      if (provider === 'internal') {
        const occupiedSeats = await Ticket.getOccupiedSeats(eventId);
        const event = await Event.findById(eventId);

        if (!event) {
          throw new Error('Evento no encontrado');
        }

        const sections = event.getVenueSections().map(section => ({
          ...section.toObject(),
          occupiedSeats: occupiedSeats.filter(seat =>
            seat.section === section.id
          ).length,
          availableSeats: section.capacity - occupiedSeats.filter(seat =>
            seat.section === section.id
          ).length
        }));

        return {
          success: true,
          data: {
            eventId,
            sections,
            occupiedSeats,
            totalAvailable: sections.reduce((sum, section) => sum + section.availableSeats, 0)
          }
        };
      } else {
        // Para proveedores externos, devolver información básica
        return {
          success: true,
          data: {
            eventId,
            provider,
            message: 'Disponibilidad manejada por proveedor externo'
          }
        };
      }
    } catch (error) {
      logger.error('Error obteniendo disponibilidad de asientos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Reservar asientos para un evento
  async reserveSeats(eventId, seatSelections, userId, provider = 'internal') {
    try {
      if (provider === 'internal') {
        const event = await Event.findById(eventId);
        if (!event) {
          throw new Error('Evento no encontrado');
        }

        // Verificar disponibilidad de cada asiento
        for (const seat of seatSelections) {
          const isAvailable = await Ticket.checkSeatAvailability(
            eventId,
            seat.section,
            seat.row,
            seat.seat
          );

          if (!isAvailable) {
            throw new Error(`Asiento ${seat.section}-${seat.row}-${seat.seat} no disponible`);
          }
        }

        // Crear tickets temporales (reservados)
        const tickets = [];
        for (const seat of seatSelections) {
          const sectionInfo = event.getSectionInfo(seat.section);
          const ticket = new Ticket({
            event: eventId,
            user: userId,
            seat: {
              section: seat.section,
              row: seat.row,
              seat: seat.seat,
              zone: sectionInfo?.name || seat.section
            },
            status: 'reserved',
            price: {
              amount: sectionInfo?.price?.min || event.price.min || 0,
              currency: sectionInfo?.price?.currency || event.price.currency || 'MXN'
            },
            provider: 'internal'
          });

          await ticket.save();
          tickets.push(ticket);
        }

        // Establecer expiración de reserva (15 minutos)
        setTimeout(async () => {
          try {
            await Ticket.updateMany(
              {
                event: eventId,
                user: userId,
                status: 'reserved',
                createdAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) }
              },
              { status: 'cancelled' }
            );
          } catch (error) {
            logger.error('Error expirando reservas:', error);
          }
        }, 15 * 60 * 1000);

        return {
          success: true,
          data: {
            tickets: tickets.map(t => ({
              id: t._id,
              ticketNumber: t.ticketNumber,
              seat: t.seat,
              price: t.price
            })),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            totalAmount: tickets.reduce((sum, t) => sum + t.price.amount, 0)
          }
        };
      } else {
        throw new Error('Reserva externa no implementada');
      }
    } catch (error) {
      logger.error('Error reservando asientos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Confirmar compra de tickets
  async purchaseTickets(reservationId, paymentMethod, userId) {
    try {
      // Buscar tickets reservados
      const tickets = await Ticket.find({
        user: userId,
        status: 'reserved',
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Últimos 15 minutos
      }).populate('event');

      if (tickets.length === 0) {
        throw new Error('No se encontraron tickets reservados');
      }

      const event = tickets[0].event;
      const totalAmount = tickets.reduce((sum, t) => sum + t.price.amount, 0);

      // Crear orden
      const order = new Order({
        customer: userId,
        items: tickets.map(ticket => ({
          product: ticket._id, // Referencia al ticket
          productName: `${event.title} - ${ticket.seat.section}${ticket.seat.row}${ticket.seat.seat}`,
          productImage: event.image,
          quantity: 1,
          price: ticket.price.amount,
          total: ticket.price.amount
        })),
        total: totalAmount,
        currency: tickets[0].price.currency,
        status: 'pending',
        paymentMethod: paymentMethod,
        type: 'ticket_purchase'
      });

      await order.save();

      // Actualizar tickets con referencia a la orden
      await Ticket.updateMany(
        { _id: { $in: tickets.map(t => t._id) } },
        {
          order: order._id,
          status: 'confirmed'
        }
      );

      // Crear pago
      const paymentResult = await paymentService.createPayment({
        orderNumber: order.orderNumber,
        total: totalAmount,
        currency: order.currency,
        customerEmail: 'user@example.com', // Debería obtenerse del usuario
        description: `Compra de ${tickets.length} boletos para ${event.title}`
      }, paymentMethod);

      return {
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          tickets: tickets.length,
          totalAmount,
          paymentId: paymentResult.paymentId,
          approvalUrl: paymentResult.approvalUrl
        }
      };
    } catch (error) {
      logger.error('Error en purchaseTickets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Procesar reembolso de tickets
  async refundTickets(ticketIds, reason, userId) {
    try {
      const tickets = await Ticket.find({
        _id: { $in: ticketIds },
        user: userId,
        status: { $in: ['confirmed', 'paid', 'delivered'] }
      }).populate('event order');

      if (tickets.length === 0) {
        throw new Error('No se encontraron tickets válidos para reembolso');
      }

      const event = tickets[0].event;
      if (!event.canRefundTickets()) {
        throw new Error('Los tickets no son elegibles para reembolso');
      }

      const totalRefund = tickets.reduce((sum, t) => sum + t.price.amount, 0);
      const refundFee = event.ticketing.refundPolicy.fee || 0;
      const finalRefund = Math.max(0, totalRefund - refundFee);

      // Procesar reembolso para cada ticket
      for (const ticket of tickets) {
        await ticket.processRefund(finalRefund / tickets.length, userId);
      }

      // Procesar reembolso en el sistema de pagos
      const order = tickets[0].order;
      if (order && finalRefund > 0) {
        await paymentService.refundPayment(
          order.paypalOrderId || order.mercadopagoPaymentId || order.stripePaymentIntentId,
          finalRefund,
          order.paymentMethod
        );
      }

      return {
        success: true,
        data: {
          refundedTickets: tickets.length,
          totalRefund: finalRefund,
          refundFee,
          reason
        }
      };
    } catch (error) {
      logger.error('Error procesando reembolso:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar ticket para entrada al evento
  async validateTicket(ticketNumber, eventId) {
    try {
      const ticket = await Ticket.findOne({
        ticketNumber,
        event: eventId
      }).populate('event user');

      if (!ticket) {
        return {
          success: false,
          error: 'Ticket no encontrado'
        };
      }

      if (!ticket.isValid) {
        return {
          success: false,
          error: 'Ticket no válido',
          status: ticket.status
        };
      }

      // Marcar como usado
      await ticket.validateTicket();

      return {
        success: true,
        data: {
          ticketNumber: ticket.ticketNumber,
          seat: ticket.seat,
          user: {
            name: ticket.user.username,
            email: ticket.user.email
          },
          event: {
            title: ticket.event.title,
            date: ticket.event.date
          },
          validatedAt: new Date()
        }
      };
    } catch (error) {
      logger.error('Error validando ticket:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener estadísticas de ticketing
  async getTicketingStats(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Evento no encontrado');
      }

      const ticketStats = await Ticket.aggregate([
        { $match: { event: event._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$price.amount' }
          }
        }
      ]);

      const stats = {
        totalTickets: 0,
        soldTickets: 0,
        availableTickets: 0,
        revenue: 0,
        byStatus: {}
      };

      ticketStats.forEach(stat => {
        stats.byStatus[stat._id] = {
          count: stat.count,
          revenue: stat.totalRevenue
        };
        stats.totalTickets += stat.count;

        if (['confirmed', 'paid', 'delivered', 'used'].includes(stat._id)) {
          stats.soldTickets += stat.count;
          stats.revenue += stat.totalRevenue;
        }
      });

      if (event.ticketing?.ticketTypes) {
        stats.availableTickets = event.ticketing.ticketTypes.reduce(
          (sum, type) => sum + Math.max(0, type.quantity - type.sold), 0
        );
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new TicketingService();