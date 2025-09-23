const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class DiscographyAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/discography`;
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

  // Obtener todos los álbumes con filtros y paginación
  async getAlbums(params = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/albums${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener un álbum específico
  async getAlbumById(id) {
    const response = await this.request(`/albums/${id}`);
    return response;
  }

  // Obtener todas las canciones con filtros y paginación
  async getSongs(params = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/songs${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener una canción específica
  async getSongById(id) {
    const response = await this.request(`/songs/${id}`);
    return response;
  }

  // Crear álbum (solo admin)
  async createAlbum(albumData) {
    const response = await this.request('/albums', {
      method: 'POST',
      body: JSON.stringify(albumData),
    });
    return response;
  }

  // Actualizar álbum (solo admin)
  async updateAlbum(id, albumData) {
    const response = await this.request(`/albums/${id}`, {
      method: 'PUT',
      body: JSON.stringify(albumData),
    });
    return response;
  }

  // Eliminar álbum (solo admin)
  async deleteAlbum(id) {
    const response = await this.request(`/albums/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Crear canción (solo admin)
  async createSong(songData) {
    const response = await this.request('/songs', {
      method: 'POST',
      body: JSON.stringify(songData),
    });
    return response;
  }

  // Actualizar canción (solo admin)
  async updateSong(id, songData) {
    const response = await this.request(`/songs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(songData),
    });
    return response;
  }

  // Eliminar canción (solo admin)
  async deleteSong(id) {
    const response = await this.request(`/songs/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Incrementar contador de reproducciones
  async incrementPlayCount(type, id) {
    const response = await this.request(`/${type}/${id}/play`, {
      method: 'POST',
    });
    return response;
  }
}

export default new DiscographyAPI();