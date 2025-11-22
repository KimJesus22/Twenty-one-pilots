const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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

  // Obtener playlists del usuario autenticado con paginación
  async getUserPlaylists(page = 1, limit = 10, category = '', sort = 'createdAt', order = 'desc') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
      order
    });
    if (category && category !== 'all') {
      params.append('category', category);
    }
    const response = await this.request(`?${params.toString()}`);
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
  async deletePlaylist(id) {
    const response = await this.request(`/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Agregar video a playlist
  async addVideoToPlaylist(playlistId, videoId) {
    const response = await this.request(`/${playlistId}/videos`, {
      method: 'POST',
      body: JSON.stringify({ videoId }),
    });
    return response;
  }

  // Eliminar video de playlist
  async removeVideoFromPlaylist(playlistId, videoId) {
    const response = await this.request(`/${playlistId}/videos/${videoId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Reordenar videos en playlist
  async reorderPlaylistVideos(playlistId, videoOrder) {
    const response = await this.request(`/${playlistId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ videoOrder }),
    });
    return response;
  }

  // Obtener playlists públicas (sin autenticación requerida)
  async getPublicPlaylists(page = 1, limit = 10, category = '', tags = '', sort = 'createdAt', order = 'desc') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
      order
    });
    if (category && category !== 'all') {
      params.append('category', category);
    }
    if (tags) {
      params.append('tags', tags);
    }

    // Para rutas públicas, no enviar token de autenticación
    const url = `${this.baseURL}/public?${params.toString()}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        // No incluir Authorization header para rutas públicas
      },
    };

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

  // Dar/quitar like a playlist
  async togglePlaylistLike(playlistId) {
    const response = await this.request(`/${playlistId}/like`, {
      method: 'POST',
    });
    return response;
  }

  // Agregar colaborador a playlist
  async addCollaborator(playlistId, userId, role = 'viewer') {
    const response = await this.request(`/${playlistId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
    return response;
  }

  // Actualizar configuración de compartir
  async updateShareSettings(playlistId, settings) {
    const response = await this.request(`/${playlistId}/share`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return response;
  }

  // Obtener playlist compartida por URL (sin autenticación requerida)
  async getSharedPlaylist(shareUrl) {
    const url = `${this.baseURL}/shared/${shareUrl}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        // No incluir Authorization header para rutas públicas
      },
    };

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

  // Exportar playlist
  async exportPlaylist(playlistId, format = 'json') {
    const response = await fetch(`${this.baseURL}/${playlistId}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (format === 'json') {
      return await response.json();
    } else {
      // Para otros formatos, devolver el blob
      return await response.blob();
    }
  }

  // Importar playlist desde JSON
  async importPlaylist(playlistData) {
    const response = await this.request('/import', {
      method: 'POST',
      body: JSON.stringify({ data: playlistData }),
    });
    return response;
  }

  // Obtener estadísticas de playlist
  async getPlaylistStats(playlistId) {
    const response = await this.request(`/${playlistId}/stats`);
    return response;
  }

  // Obtener log de auditoría de playlist
  async getPlaylistAuditLog(playlistId, page = 1, limit = 20) {
    const response = await this.request(`/${playlistId}/audit?page=${page}&limit=${limit}`);
    return response;
  }

  // Suscribirse a notificaciones en tiempo real
  async subscribeToPlaylist(playlistId) {
    const response = await this.request(`/${playlistId}/subscribe`, {
      method: 'POST',
    });
    return response;
  }

  // Cancelar suscripción a notificaciones
  async unsubscribeFromPlaylist(playlistId, connectionId) {
    const response = await this.request(`/${playlistId}/unsubscribe`, {
      method: 'POST',
      body: JSON.stringify({ connectionId }),
    });
    return response;
  }

  // Obtener estadísticas del servicio en tiempo real (solo admin)
  async getRealtimeStats() {
    const response = await this.request('/realtime/stats');
    return response;
  }

  // Obtener notificaciones pendientes
  async getPendingNotifications(since = null) {
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    const response = await this.request(`/notifications/pending${params}`);
    return response;
  }

  // Moderar playlist (solo administradores)
  async moderatePlaylist(playlistId, status, reason = '') {
    const response = await this.request(`/${playlistId}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    return response;
  }
}

export default new PlaylistsAPI();
