const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class PlaylistsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/playlists`;
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

  // Obtener playlists del usuario con paginación
  async getUserPlaylists(userId, page = 1, limit = 10) {
    const response = await this.request(`/user/${userId}?page=${page}&limit=${limit}`);
    return response;
  }

  // Obtener playlist específica
  async getPlaylist(id) {
    const response = await this.request(`/${id}`);
    return response;
  }

  // Crear nueva playlist
  async createPlaylist(playlistData) {
    const response = await this.request('', {
      method: 'POST',
      body: JSON.stringify(playlistData),
    });
    return response;
  }

  // Actualizar playlist
  async updatePlaylist(id, playlistData) {
    const response = await this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playlistData),
    });
    return response;
  }

  // Eliminar playlist
  async deletePlaylist(id, userId) {
    const response = await this.request(`/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
    return response;
  }

  // Agregar canción a playlist
  async addSongToPlaylist(playlistId, songId, userId) {
    const response = await this.request(`/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ songId, userId }),
    });
    return response;
  }

  // Eliminar canción de playlist
  async removeSongFromPlaylist(playlistId, songId, userId) {
    const response = await this.request(`/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
    return response;
  }

  // Obtener playlists públicas
  async getPublicPlaylists(page = 1, limit = 10) {
    const response = await this.request(`/public/all?page=${page}&limit=${limit}`);
    return response;
  }

  // Clonar playlist pública
  async clonePlaylist(playlistId, userId, name = null) {
    const response = await this.request(`/${playlistId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ userId, name }),
    });
    return response;
  }
}

export default new PlaylistsAPI();