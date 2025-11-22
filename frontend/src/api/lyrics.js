const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class LyricsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/lyrics`;
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

  // Obtener letras de una canción
  async getLyrics(songId, artist, title, lang = null) {
    const params = new URLSearchParams();
    if (songId) params.append('songId', songId);
    params.append('artist', artist);
    params.append('title', title);
    if (lang) params.append('lang', lang);

    const response = await this.request(`?${params.toString()}`);
    return response;
  }

  // Traducir letras
  async translateLyrics(lyrics, fromLang = 'en', toLang = 'es') {
    const response = await this.request('/translate', {
      method: 'POST',
      body: JSON.stringify({
        lyrics,
        fromLang,
        toLang
      }),
    });
    return response;
  }

  // Buscar canciones
  async searchSongs(query, filters = {}) {
    const params = new URLSearchParams();
    params.append('q', query);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await this.request(`/search?${params.toString()}`);
    return response;
  }

  // Obtener información de artista
  async getArtistInfo(artistName) {
    const response = await this.request(`/artist/${encodeURIComponent(artistName)}`);
    return response;
  }

  // Agregar letras a favoritos
  async addLyricsToFavorites(songData) {
    const response = await this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify(songData),
    });
    return response;
  }

  // Verificar si letras están en favoritos
  async checkLyricsFavorite(songId, artist, title) {
    let endpoint;
    if (songId) {
      endpoint = `/favorites/check/${songId}`;
    } else {
      endpoint = `/favorites/check/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    }

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener letras favoritas del usuario
  async getFavoriteLyrics(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/favorites?${queryString}` : '/favorites';

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener idiomas soportados
  async getSupportedLanguages() {
    const response = await this.request('/languages');
    return response;
  }

  // Obtener estadísticas de letras
  async getLyricsStats() {
    const response = await this.request('/stats');
    return response;
  }

  // Verificar estado de APIs
  async checkAPIStatus() {
    const response = await this.request('/api-status');
    return response;
  }

  // Obtener sugerencias de búsqueda
  async getSearchSuggestions(query, limit = 5) {
    const response = await this.request(`/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response;
  }

  // Obtener letras populares
  async getPopularLyrics(limit = 10) {
    const response = await this.request(`/popular?limit=${limit}`);
    return response;
  }
}

export default new LyricsAPI();
