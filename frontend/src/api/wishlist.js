const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class WishlistAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/wishlist`;
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
      console.error('Wishlist API request failed:', error);
      throw error;
    }
  }

  // Obtener wishlist del usuario
  async getUserWishlist(userId) {
    const response = await this.request(`/user/${userId}`);
    return response;
  }

  // Agregar producto a wishlist
  async addToWishlist(userId, productId, notes = '') {
    const response = await this.request('', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        productId,
        notes
      }),
    });
    return response;
  }

  // Remover producto de wishlist
  async removeFromWishlist(userId, productId) {
    const response = await this.request(`/${userId}/${productId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Verificar si producto está en wishlist
  async checkWishlistStatus(userId, productId) {
    const response = await this.request(`/check/${userId}/${productId}`);
    return response;
  }

  // Toggle producto en wishlist
  async toggleWishlist(userId, productId, notes = '') {
    const response = await this.request('/toggle', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        productId,
        notes
      }),
    });
    return response;
  }

  // Actualizar notas de un producto en wishlist
  async updateWishlistNotes(userId, productId, notes) {
    const response = await this.request(`/notes/${userId}/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        notes
      }),
    });
    return response;
  }

  // Limpiar wishlist completa
  async clearWishlist(userId) {
    const response = await this.request(`/clear/${userId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Obtener estadísticas de wishlist
  async getWishlistStats(userId) {
    const response = await this.request(`/stats/${userId}`);
    return response;
  }

  // Obtener recomendaciones basadas en wishlist
  async getWishlistRecommendations(userId) {
    const response = await this.request(`/recommendations/${userId}`);
    return response;
  }
}

export default new WishlistAPI();