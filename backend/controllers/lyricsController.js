const lyricsService = require('../services/lyricsService');
const favoritesService = require('../services/favoritesService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class LyricsController {
  /**
   * Obtener letras de una canción
   */
  async getLyrics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { songId, artist, title, lang } = req.query;

      if (!artist || !title) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren artista y título'
        });
      }

      const lyricsData = await lyricsService.getLyricsWithTranslation(songId, artist, title, lang);

      res.json({
        success: true,
        data: { lyrics: lyricsData }
      });
    } catch (error) {
      logger.error('Error en getLyrics:', error);
      res.status(error.message.includes('no encontrados') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error obteniendo letras'
      });
    }
  }

  /**
   * Traducir letras
   */
  async translateLyrics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { lyrics, fromLang, toLang } = req.body;

      if (!lyrics) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren las letras a traducir'
        });
      }

      const translation = await lyricsService.translateLyrics(
        lyrics,
        fromLang || 'en',
        toLang || 'es'
      );

      res.json({
        success: true,
        data: { translation }
      });
    } catch (error) {
      logger.error('Error en translateLyrics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error traduciendo letras'
      });
    }
  }

  /**
   * Buscar canciones
   */
  async searchSongs(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { q: query, artist, album, limit } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un término de búsqueda'
        });
      }

      const filters = {
        artist,
        album,
        limit: limit ? parseInt(limit) : undefined
      };

      const searchResults = await lyricsService.searchSongs(query, filters);

      res.json({
        success: true,
        data: searchResults
      });
    } catch (error) {
      logger.error('Error en searchSongs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error buscando canciones'
      });
    }
  }

  /**
   * Obtener información de artista
   */
  async getArtistInfo(req, res) {
    try {
      const { artistName } = req.params;

      if (!artistName) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el nombre del artista'
        });
      }

      const artistInfo = await lyricsService.getArtistInfo(artistName);

      res.json({
        success: true,
        data: { artist: artistInfo }
      });
    } catch (error) {
      logger.error('Error en getArtistInfo:', error);
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error obteniendo información del artista'
      });
    }
  }

  /**
   * Agregar letras a favoritos
   */
  async addLyricsToFavorites(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { songId, artist, title, lyrics, source, tags, notes } = req.body;

      const favoriteData = {
        title: `${artist} - ${title}`,
        artist,
        lyrics: lyrics.substring(0, 500), // Preview de letras
        source,
        songId
      };

      const favorite = await favoritesService.addToFavorites(
        userId,
        'lyrics',
        songId || `${artist}_${title}`,
        favoriteData,
        {
          tags: tags || ['lyrics'],
          notes: notes || `Letras de ${artist} - ${title}`,
          sendNotification: false
        }
      );

      res.status(201).json({
        success: true,
        message: 'Letras agregadas a favoritos',
        data: { favorite }
      });
    } catch (error) {
      logger.error('Error en addLyricsToFavorites:', error);
      res.status(error.message === 'Item ya está en favoritos' ? 409 : 500).json({
        success: false,
        message: error.message || 'Error agregando letras a favoritos'
      });
    }
  }

  /**
   * Verificar si letras están en favoritos
   */
  async checkLyricsFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { songId, artist, title } = req.params;

      const itemId = songId || `${artist}_${title}`;
      const isFavorite = await favoritesService.isFavorite(userId, 'lyrics', itemId);

      res.json({
        success: true,
        data: { isFavorite }
      });
    } catch (error) {
      logger.error('Error en checkLyricsFavorite:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando favorito'
      });
    }
  }

  /**
   * Obtener letras favoritas del usuario
   */
  async getFavoriteLyrics(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, search } = req.query;

      const filters = {
        itemType: 'lyrics',
        search,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      const result = await favoritesService.getUserFavorites(userId, filters, {
        page: filters.page,
        limit: filters.limit
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error en getFavoriteLyrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo letras favoritas'
      });
    }
  }

  /**
   * Obtener idiomas soportados para traducción
   */
  async getSupportedLanguages(req, res) {
    try {
      res.json({
        success: true,
        data: {
          languages: lyricsService.supportedLanguages,
          defaultFrom: 'en',
          defaultTo: 'es'
        }
      });
    } catch (error) {
      logger.error('Error en getSupportedLanguages:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo idiomas soportados'
      });
    }
  }

  /**
   * Obtener estadísticas de uso de letras
   */
  async getLyricsStats(req, res) {
    try {
      const userId = req.user.id;

      // Obtener estadísticas de favoritos de letras
      const stats = await favoritesService.getUserStats(userId);

      // Filtrar solo estadísticas de letras
      const lyricsStats = {
        totalFavoriteLyrics: stats.lyrics?.count || 0,
        lastAddedLyrics: stats.lyrics?.lastAdded || null,
        favoriteArtists: stats.lyrics?.topArtists || [],
        favoriteLanguages: stats.lyrics?.languages || ['en']
      };

      res.json({
        success: true,
        data: { stats: lyricsStats }
      });
    } catch (error) {
      logger.error('Error en getLyricsStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de letras'
      });
    }
  }

  /**
   * Verificar estado de APIs de letras
   */
  async checkAPIStatus(req, res) {
    try {
      const status = await lyricsService.checkAPIStatus();

      res.json({
        success: true,
        data: { apiStatus: status }
      });
    } catch (error) {
      logger.error('Error en checkAPIStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando estado de APIs'
      });
    }
  }

  /**
   * Obtener sugerencias de búsqueda
   */
  async getSearchSuggestions(req, res) {
    try {
      const { q: query, limit } = req.query;

      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: { suggestions: [] }
        });
      }

      // Buscar en favoritos del usuario primero
      const userId = req.user.id;
      const favorites = await favoritesService.searchFavorites(userId, query, {
        itemType: 'lyrics',
        limit: limit ? parseInt(limit) : 5
      });

      const suggestions = favorites.map(fav => ({
        id: fav.itemId,
        text: fav.itemData.title,
        artist: fav.itemData.artist,
        type: 'favorite'
      }));

      // Si no hay suficientes, buscar en APIs
      if (suggestions.length < 3) {
        try {
          const apiResults = await lyricsService.searchSongs(query, { limit: 3 });
          const apiSuggestions = apiResults.results.slice(0, 3 - suggestions.length).map(song => ({
            id: song.id,
            text: song.title,
            artist: song.artist,
            type: 'api'
          }));
          suggestions.push(...apiSuggestions);
        } catch (error) {
          logger.warn('Error obteniendo sugerencias de API:', error.message);
        }
      }

      res.json({
        success: true,
        data: { suggestions }
      });
    } catch (error) {
      logger.error('Error en getSearchSuggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sugerencias de búsqueda'
      });
    }
  }

  /**
   * Obtener letras populares
   */
  async getPopularLyrics(req, res) {
    try {
      const { limit } = req.query;

      const popularLyrics = await favoritesService.getPopularItems('lyrics', limit ? parseInt(limit) : 10);

      res.json({
        success: true,
        data: { popularLyrics }
      });
    } catch (error) {
      logger.error('Error en getPopularLyrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo letras populares'
      });
    }
  }
}

module.exports = new LyricsController();