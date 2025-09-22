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
}

export default new EventsAPI();