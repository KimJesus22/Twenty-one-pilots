const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class DataRequestsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/data-requests`;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Data Requests API request failed:', error);
      throw error;
    }
  }

  // Solicitar acceso a datos personales (GDPR Art. 15)
  async requestDataAccess() {
    return this.request('/access', {
      method: 'POST',
      body: JSON.stringify({
        type: 'access',
        reason: 'User requested access to personal data'
      }),
    });
  }

  // Solicitar eliminación de datos (GDPR Art. 17, CCPA)
  async requestDataDeletion() {
    return this.request('/deletion', {
      method: 'POST',
      body: JSON.stringify({
        type: 'deletion',
        reason: 'User requested account and data deletion',
        confirmationRequired: true
      }),
    });
  }

  // Solicitar portabilidad de datos (GDPR Art. 20)
  async requestDataPortability() {
    return this.request('/portability', {
      method: 'POST',
      body: JSON.stringify({
        type: 'portability',
        format: 'json', // json, csv, xml
        reason: 'User requested data portability'
      }),
    });
  }

  // Solicitar rectificación de datos (GDPR Art. 16)
  async requestDataRectification(data) {
    return this.request('/rectification', {
      method: 'POST',
      body: JSON.stringify({
        type: 'rectification',
        corrections: data,
        reason: 'User requested data correction'
      }),
    });
  }

  // Solicitar restricción de procesamiento (GDPR Art. 18)
  async requestProcessingRestriction(restrictionType) {
    return this.request('/restriction', {
      method: 'POST',
      body: JSON.stringify({
        type: 'restriction',
        restrictionType, // 'marketing', 'analytics', 'all'
        reason: 'User requested processing restriction'
      }),
    });
  }

  // Obtener historial de solicitudes del usuario
  async getUserRequests() {
    return this.request('/user-requests');
  }

  // Obtener detalles de una solicitud específica
  async getRequestDetails(requestId) {
    return this.request(`/${requestId}`);
  }

  // Cancelar una solicitud pendiente
  async cancelRequest(requestId) {
    return this.request(`/${requestId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        reason: 'User cancelled the request'
      }),
    });
  }

  // Descargar datos de una solicitud completada
  async downloadRequestData(requestId, format = 'json') {
    const response = await fetch(`${this.baseURL}/${requestId}/download?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download data');
    }

    return response.blob();
  }

  // Verificar estado de una solicitud
  async checkRequestStatus(requestId) {
    return this.request(`/${requestId}/status`);
  }

  // Enviar apelación para solicitud rechazada
  async appealRequest(requestId, reason) {
    return this.request(`/${requestId}/appeal`, {
      method: 'POST',
      body: JSON.stringify({
        reason,
        additionalInfo: 'User appealed the decision'
      }),
    });
  }
}

export default new DataRequestsAPI();