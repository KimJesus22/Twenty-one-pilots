const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class NotificationsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/notifications`;
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

  // Crear notificación manual
  async createNotification(notificationData) {
    const response = await this.request('', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
    return response;
  }

  // Obtener notificaciones del usuario
  async getUserNotifications(filters = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener conteo de notificaciones no leídas
  async getUnreadCount() {
    const response = await this.request('/unread-count');
    return response;
  }

  // Marcar notificación como leída
  async markAsRead(notificationId) {
    const response = await this.request(`/${notificationId}/read`, {
      method: 'PUT',
    });
    return response;
  }

  // Marcar todas como leídas
  async markAllAsRead() {
    const response = await this.request('/mark-all-read', {
      method: 'PUT',
    });
    return response;
  }

  // Eliminar notificación
  async deleteNotification(notificationId) {
    const response = await this.request(`/${notificationId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats(userId = null) {
    const queryString = userId ? `?userId=${userId}` : '';
    const response = await this.request(`/stats${queryString}`);
    return response;
  }

  // Actualizar preferencias de notificación
  async updateNotificationPreferences(preferences) {
    const response = await this.request('/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
    return response;
  }

  // Obtener preferencias de notificación
  async getNotificationPreferences() {
    const response = await this.request('/preferences');
    return response;
  }

  // Probar envío de notificación
  async testNotification(channel = 'in_app', type = 'system_announcement') {
    const response = await this.request('/test', {
      method: 'POST',
      body: JSON.stringify({ channel, type }),
    });
    return response;
  }
}

export default new NotificationsAPI();
