const axios = require('axios');
const logger = require('../utils/logger');

class EventbriteService {
  constructor() {
    this.apiKey = process.env.EVENTBRITE_API_KEY;
    this.baseUrl = 'https://www.eventbriteapi.com/v3';
    this.maxResults = 20;
  }

  // Buscar conciertos/eventos
  async searchEvents(query = 'Twenty One Pilots', location = 'all', maxResults = this.maxResults) {
    try {
      if (!this.apiKey) {
        throw new Error('Eventbrite API key no configurada');
      }

      const response = await axios.get(`${this.baseUrl}/events/search/`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          q: query,
          categories: '103', // Music category
          'location.address': location,
          sort_by: 'date',
          status: 'live',
          expand: 'venue,organizer',
          page_size: maxResults
        },
        timeout: 15000 // 15 segundos timeout
      });

      // Transformar respuesta para incluir solo datos necesarios
      const events = response.data.events.map(event => ({
        id: event.id,
        name: event.name.text,
        description: event.description?.text || '',
        url: event.url,
        start: event.start,
        end: event.end,
        timezone: event.start.timezone,
        venue: event.venue ? {
          name: event.venue.name,
          address: event.venue.address,
          city: event.venue.address?.city,
          region: event.venue.address?.region,
          country: event.venue.address?.country
        } : null,
        organizer: event.organizer ? {
          name: event.organizer.name,
          description: event.organizer.description
        } : null,
        logo: event.logo?.url || null,
        isFree: event.is_free,
        price: event.ticket_availability?.minimum_ticket_price?.display || 'N/A',
        capacity: event.capacity,
        status: event.status
      }));

      return {
        success: true,
        data: events,
        pagination: response.data.pagination
      };
    } catch (error) {
      logger.error('Error buscando eventos en Eventbrite:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Obtener detalles de un evento específico
  async getEventDetails(eventId) {
    try {
      if (!this.apiKey) {
        throw new Error('Eventbrite API key no configurada');
      }

      const response = await axios.get(`${this.baseUrl}/events/${eventId}/`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          expand: 'venue,organizer,ticket_availability'
        },
        timeout: 10000
      });

      const event = response.data;
      const details = {
        id: event.id,
        name: event.name.text,
        description: event.description?.text || '',
        summary: event.summary || '',
        url: event.url,
        start: event.start,
        end: event.end,
        timezone: event.start.timezone,
        venue: event.venue ? {
          name: event.venue.name,
          address: event.venue.address,
          city: event.venue.address?.city,
          region: event.venue.address?.region,
          country: event.venue.address?.country,
          latitude: event.venue.address?.latitude,
          longitude: event.venue.address?.longitude
        } : null,
        organizer: event.organizer ? {
          name: event.organizer.name,
          description: event.organizer.description,
          website: event.organizer.website
        } : null,
        logo: event.logo?.url || null,
        images: event.image ? [event.image] : [],
        isFree: event.is_free,
        currency: event.currency,
        ticketAvailability: event.ticket_availability,
        capacity: event.capacity,
        status: event.status,
        tags: event.tags || [],
        category: event.category
      };

      return {
        success: true,
        data: details
      };
    } catch (error) {
      logger.error('Error obteniendo detalles del evento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Buscar eventos por ubicación
  async searchEventsByLocation(location, radius = 50, maxResults = this.maxResults) {
    try {
      if (!this.apiKey) {
        throw new Error('Eventbrite API key no configurada');
      }

      const response = await axios.get(`${this.baseUrl}/events/search/`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params: {
          'location.within': `${radius}km`,
          'location.address': location,
          categories: '103', // Music
          sort_by: 'date',
          status: 'live',
          expand: 'venue',
          page_size: maxResults
        },
        timeout: 15000
      });

      const events = response.data.events.map(event => ({
        id: event.id,
        name: event.name.text,
        venue: event.venue?.name || 'Ubicación no especificada',
        city: event.venue?.address?.city || '',
        start: event.start,
        url: event.url,
        isFree: event.is_free
      }));

      return {
        success: true,
        data: events,
        location,
        radius
      };
    } catch (error) {
      logger.error('Error buscando eventos por ubicación:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Obtener eventos próximos
  async getUpcomingEvents(organizerId = null, maxResults = this.maxResults) {
    try {
      if (!this.apiKey) {
        throw new Error('Eventbrite API key no configurada');
      }

      const params = {
        categories: '103', // Music
        sort_by: 'date',
        status: 'live',
        expand: 'venue,organizer',
        page_size: maxResults
      };

      if (organizerId) {
        params.organizer_id = organizerId;
      }

      const response = await axios.get(`${this.baseUrl}/events/search/`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        params,
        timeout: 15000
      });

      const events = response.data.events.map(event => ({
        id: event.id,
        name: event.name.text,
        start: event.start,
        venue: event.venue?.name || 'Por confirmar',
        city: event.venue?.address?.city || '',
        url: event.url,
        organizer: event.organizer?.name || ''
      }));

      return {
        success: true,
        data: events
      };
    } catch (error) {
      logger.error('Error obteniendo eventos próximos:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Validar API key
  async validateApiKey() {
    try {
      if (!this.apiKey) {
        return { valid: false, error: 'API key no configurada' };
      }

      await axios.get(`${this.baseUrl}/users/me/`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 5000
      });

      return { valid: true };
    } catch (error) {
      logger.error('Error validando API key de Eventbrite:', error);
      return {
        valid: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  // Obtener información del organizador
  async getOrganizerInfo(organizerId) {
    try {
      if (!this.apiKey) {
        throw new Error('Eventbrite API key no configurada');
      }

      const response = await axios.get(`${this.baseUrl}/organizers/${organizerId}/`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error obteniendo información del organizador:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EventbriteService();