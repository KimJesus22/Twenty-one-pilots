const SpotifyWebApi = require('spotify-web-api-node');
const logger = require('../utils/logger');

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback'
    });

    // Configurar token de acceso si está disponible
    if (process.env.SPOTIFY_ACCESS_TOKEN) {
      this.spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);
    }
    if (process.env.SPOTIFY_REFRESH_TOKEN) {
      this.spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);
    }
  }

  /**
   * Genera URL de autorización para OAuth 2.0
   * @param {Array} scopes - Scopes requeridos
   * @param {string} state - Estado para prevenir CSRF
   * @returns {string} URL de autorización
   */
  generateAuthorizeURL(scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'], state = null) {
    try {
      const authorizeURL = this.spotifyApi.createAuthorizeURL(scopes, state);
      logger.info('URL de autorización generada');
      return authorizeURL;
    } catch (error) {
      logger.error('Error generando URL de autorización:', error);
      throw new Error('Error generando URL de autorización');
    }
  }

  /**
   * Intercambia código de autorización por tokens de acceso
   * @param {string} code - Código de autorización
   * @returns {Object} Tokens de acceso y refresh
   */
  async authorizationCodeGrant(code) {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      const { access_token, refresh_token, expires_in } = data.body;

      this.spotifyApi.setAccessToken(access_token);
      this.spotifyApi.setRefreshToken(refresh_token);

      logger.info('Tokens obtenidos exitosamente');

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in
      };
    } catch (error) {
      logger.error('Error en authorization code grant:', error);
      throw new Error('Error obteniendo tokens de acceso');
    }
  }

  /**
   * Refresca el token de acceso
   * @returns {Object} Nuevo token de acceso
   */
  async refreshAccessToken() {
    try {
      const data = await this.spotifyApi.refreshAccessToken();
      const { access_token, expires_in } = data.body;

      this.spotifyApi.setAccessToken(access_token);

      logger.info('Token de acceso refrescado');

      return {
        accessToken: access_token,
        expiresIn: expires_in
      };
    } catch (error) {
      logger.error('Error refrescando token:', error);
      throw new Error('Error refrescando token de acceso');
    }
  }

  /**
   * Obtiene metadata de una pista
   * @param {string} trackId - ID de la pista
   * @returns {Object} Metadata de la pista
   */
  async getTrack(trackId) {
    try {
      const data = await this.spotifyApi.getTrack(trackId);
      const track = data.body;

      return {
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images
        },
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        external_urls: track.external_urls,
        preview_url: track.preview_url
      };
    } catch (error) {
      this.handleApiError(error, 'obteniendo pista');
      throw error;
    }
  }

  /**
   * Obtiene features de audio de una pista
   * @param {string} trackId - ID de la pista
   * @returns {Object} Features de audio
   */
  async getAudioFeatures(trackId) {
    try {
      const data = await this.spotifyApi.getAudioFeaturesForTrack(trackId);
      return data.body;
    } catch (error) {
      this.handleApiError(error, 'obteniendo features de audio');
      throw error;
    }
  }

  /**
   * Obtiene detalles de una playlist
   * @param {string} playlistId - ID de la playlist
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Detalles de la playlist
   */
  async getPlaylist(playlistId, options = {}) {
    try {
      const data = await this.spotifyApi.getPlaylist(playlistId, options);
      const playlist = data.body;

      return {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        owner: {
          id: playlist.owner.id,
          display_name: playlist.owner.display_name
        },
        tracks: {
          total: playlist.tracks.total,
          items: playlist.tracks.items.map(item => ({
            track: {
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists.map(artist => ({
                id: artist.id,
                name: artist.name
              })),
              album: {
                id: item.track.album.id,
                name: item.track.album.name
              },
              duration_ms: item.track.duration_ms,
              popularity: item.track.popularity
            },
            added_at: item.added_at
          }))
        },
        followers: playlist.followers,
        public: playlist.public,
        collaborative: playlist.collaborative,
        external_urls: playlist.external_urls,
        images: playlist.images
      };
    } catch (error) {
      this.handleApiError(error, 'obteniendo playlist');
      throw error;
    }
  }

  /**
   * Busca pistas, artistas, álbumes, etc.
   * @param {string} query - Término de búsqueda
   * @param {Array} types - Tipos a buscar ['track', 'artist', 'album', 'playlist']
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultados de búsqueda
   */
  async search(query, types = ['track'], options = {}) {
    try {
      const data = await this.spotifyApi.search(query, types, options);
      return data.body;
    } catch (error) {
      this.handleApiError(error, 'buscando');
      throw error;
    }
  }

  /**
   * Obtiene recomendaciones basadas en seeds
   * @param {Object} options - Opciones de recomendación
   * @returns {Object} Recomendaciones
   */
  async getRecommendations(options = {}) {
    try {
      const data = await this.spotifyApi.getRecommendations(options);
      return data.body;
    } catch (error) {
      this.handleApiError(error, 'obteniendo recomendaciones');
      throw error;
    }
  }

  /**
   * Obtiene perfil del usuario actual
   * @returns {Object} Perfil del usuario
   */
  async getCurrentUserProfile() {
    try {
      const data = await this.spotifyApi.getMe();
      return data.body;
    } catch (error) {
      this.handleApiError(error, 'obteniendo perfil de usuario');
      throw error;
    }
  }

  /**
   * Obtiene playlists del usuario actual
   * @param {Object} options - Opciones de paginación
   * @returns {Object} Playlists del usuario
   */
  async getCurrentUserPlaylists(options = {}) {
    try {
      const data = await this.spotifyApi.getUserPlaylists(options);
      return data.body;
    } catch (error) {
      this.handleApiError(error, 'obteniendo playlists del usuario');
      throw error;
    }
  }

  /**
   * Maneja errores de la API de Spotify
   * @param {Error} error - Error de la API
   * @param {string} operation - Operación que causó el error
   */
  handleApiError(error, operation) {
    if (error.statusCode === 401) {
      logger.warn(`Token expirado durante ${operation}, intentando refrescar`);
      // Aquí podrías intentar refrescar el token automáticamente
    } else if (error.statusCode === 429) {
      logger.warn(`Rate limit excedido durante ${operation}`);
    } else if (error.statusCode === 403) {
      logger.error(`Acceso denegado durante ${operation}`);
    } else {
      logger.error(`Error en API de Spotify durante ${operation}:`, error);
    }
  }

  /**
   * Verifica si el token de acceso es válido
   * @returns {boolean} True si es válido
   */
  async isAccessTokenValid() {
    try {
      await this.spotifyApi.getMe();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new SpotifyService();