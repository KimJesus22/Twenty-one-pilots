const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class FavoritesAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/favorites`;
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

  // Agregar item a favoritos
  async addToFavorites(itemType, itemId, itemData = {}, options = {}) {
    const response = await this.request('', {
      method: 'POST',
      body: JSON.stringify({
        itemType,
        itemId,
        itemData,
        tags: options.tags,
        notes: options.notes,
        rating: options.rating,
        isPublic: options.isPublic
      }),
    });
    return response;
  }

  // Remover item de favoritos
  async removeFromFavorites(itemType, itemId) {
    const response = await this.request(`/${itemType}/${itemId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Verificar si está en favoritos
  async checkFavorite(itemType, itemId) {
    const response = await this.request(`/check/${itemType}/${itemId}`);
    return response;
  }

  // Toggle favorito
  async toggleFavorite(itemType, itemId, itemData = {}, options = {}) {
    const response = await this.request('/toggle', {
      method: 'POST',
      body: JSON.stringify({
        itemType,
        itemId,
        itemData,
        tags: options.tags,
        notes: options.notes,
        rating: options.rating,
        isPublic: options.isPublic
      }),
    });
    return response;
  }

  // Obtener favoritos del usuario
  async getUserFavorites(filters = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';

    const response = await this.request(endpoint);
    return response;
  }

  // Actualizar favorito
  async updateFavorite(favoriteId, updates) {
    const response = await this.request(`/${favoriteId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response;
  }

  // Agregar tags a favorito
  async addTags(favoriteId, tags) {
    const response = await this.request(`/${favoriteId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags }),
    });
    return response;
  }

  // Remover tags de favorito
  async removeTags(favoriteId, tags) {
    const response = await this.request(`/${favoriteId}/tags`, {
      method: 'DELETE',
      body: JSON.stringify({ tags }),
    });
    return response;
  }

  // Obtener estadísticas del usuario
  async getUserStats() {
    const response = await this.request('/stats');
    return response;
  }

  // Obtener items populares
  async getPopularItems(itemType, limit = 10) {
    const response = await this.request(`/popular/${itemType}?limit=${limit}`);
    return response;
  }

  // Buscar en favoritos
  async searchFavorites(query, filters = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    const response = await this.request(`/search?${queryParams.toString()}`);
    return response;
  }
}

export default new FavoritesAPI();
