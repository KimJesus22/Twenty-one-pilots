const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class EventsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/events`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Obtener eventos con filtros avanzados
  async getEvents(params = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `?${queryString}`;

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener evento específico
  async getEventById(id) {
    const response = await this.request(`/${id}`);
    return response;
  }

  // Obtener eventos cercanos
  async getNearbyEvents(latitude, longitude, maxDistance = 50) {
    const response = await this.request(`/nearby/events?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`);
    return response;
  }

  // Crear evento (solo admin)
  async createEvent(eventData) {
    const response = await this.request('', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    return response;
  }

  // Actualizar evento (solo admin)
  async updateEvent(id, eventData) {
    const response = await this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    return response;
  }

  // Eliminar evento (solo admin)
  async deleteEvent(id) {
    const response = await this.request(`/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Dar/quitar like a evento
  async toggleEventLike(eventId, userId) {
    const response = await this.request(`/${eventId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return response;
  }

  // Marcar asistencia a evento
  async toggleAttendance(eventId, userId) {
    const response = await this.request(`/${eventId}/attend`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return response;
  }

  // Obtener enlace de calendario
  async getCalendarLink(eventId) {
    const response = await this.request(`/${eventId}/calendar`);
    return response;
  }

  // Descargar archivo iCalendar
  async downloadICalendar(eventId) {
    const response = await fetch(`${this.baseURL}/${eventId}/icalendar`);
    if (!response.ok) {
      throw new Error('Error descargando archivo de calendario');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event.ics';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Obtener estadísticas de eventos
  async getEventStats() {
    const response = await this.request('/stats/overview');
    return response;
  }

  // ===== FUNCIONES DE TICKETING =====

  // Buscar eventos con ticketing
  async searchEventsWithTickets(query = '', location = '', limit = 20) {
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('query', query);
    if (location) queryParams.append('location', location);
    if (limit) queryParams.append('limit', limit);

    const response = await this.request(`/ticketing/search?${queryParams}`);
    return response;
  }

  // Obtener detalles de ticketing de un evento
  async getEventTicketingDetails(eventId, provider = 'internal') {
    const response = await this.request(`/${eventId}/ticketing?provider=${provider}`);
    return response;
  }

  // Obtener disponibilidad de asientos
  async getSeatAvailability(eventId, provider = 'internal') {
    const response = await this.request(`/${eventId}/seats/availability?provider=${provider}`);
    return response;
  }

  // Reservar asientos
  async reserveSeats(eventId, seats, provider = 'internal') {
    const response = await this.request(`/${eventId}/seats/reserve`, {
      method: 'POST',
      body: JSON.stringify({ seats, provider }),
    });
    return response;
  }

  // Comprar tickets
  async purchaseTickets(eventId, reservationId, paymentMethod, seats = null) {
    const response = await this.request(`/${eventId}/tickets/purchase`, {
      method: 'POST',
      body: JSON.stringify({ reservationId, paymentMethod, seats }),
    });
    return response;
  }

  // Solicitar reembolso
  async refundTickets(eventId, ticketIds, reason) {
    const response = await this.request(`/${eventId}/tickets/refund`, {
      method: 'POST',
      body: JSON.stringify({ ticketIds, reason }),
    });
    return response;
  }

  // Validar ticket
  async validateTicket(eventId, ticketNumber) {
    const response = await this.request(`/${eventId}/tickets/validate`, {
      method: 'POST',
      body: JSON.stringify({ ticketNumber }),
    });
    return response;
  }

  // Obtener estadísticas de ticketing
  async getTicketingStats(eventId) {
    const response = await this.request(`/${eventId}/ticketing/stats`);
    return response;
  }
}

export default new EventsAPI();