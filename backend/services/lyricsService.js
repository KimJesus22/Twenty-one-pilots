const axios = require('axios');
const cacheService = require('./cacheService');
const queueService = require('./queueService');
const logger = require('../utils/logger');

class LyricsService {
  constructor() {
    this.CACHE_TTL = {
      lyrics: 86400,        // 24 horas para letras
      translations: 604800, // 7 días para traducciones
      search: 3600,         // 1 hora para búsquedas
      artist_info: 86400    // 24 horas para info de artistas
    };

    // Configuración de APIs
    this.apis = {
      musixmatch: {
        baseUrl: 'https://api.musixmatch.com/ws/1.1',
        apiKey: process.env.MUSIXMATCH_API_KEY,
        enabled: !!process.env.MUSIXMATCH_API_KEY
      },
      genius: {
        baseUrl: 'https://api.genius.com',
        accessToken: process.env.GENIUS_ACCESS_TOKEN,
        enabled: !!process.env.GENIUS_ACCESS_TOKEN
      }
    };

    // Idiomas soportados para traducción
    this.supportedLanguages = [
      'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
    ];
  }

  /**
   * Obtener letras de una canción
   */
  async getLyrics(songId, artist, title, options = {}) {
    try {
      const cacheKey = `lyrics:${songId || `${artist}_${title}`}`;

      // Intentar obtener del caché
      if (!options.skipCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      let lyrics = null;
      let source = null;

      // Intentar con Musixmatch primero
      if (this.apis.musixmatch.enabled) {
        try {
          lyrics = await this.getLyricsFromMusixmatch(artist, title);
          source = 'musixmatch';
        } catch (error) {
          logger.warn('Musixmatch failed:', error.message);
        }
      }

      // Si no funcionó, intentar con Genius
      if (!lyrics && this.apis.genius.enabled) {
        try {
          lyrics = await this.getLyricsFromGenius(artist, title);
          source = 'genius';
        } catch (error) {
          logger.warn('Genius failed:', error.message);
        }
      }

      if (!lyrics) {
        throw new Error('No se pudieron obtener las letras de la canción');
      }

      const result = {
        songId,
        artist,
        title,
        lyrics,
        source,
        language: 'en', // Las APIs devuelven en inglés por defecto
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.CACHE_TTL.lyrics * 1000).toISOString()
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.lyrics);

      return result;
    } catch (error) {
      logger.error('Error obteniendo letras:', error);
      throw error;
    }
  }

  /**
   * Obtener letras desde Musixmatch
   */
  async getLyricsFromMusixmatch(artist, title) {
    const params = new URLSearchParams({
      apikey: this.apis.musixmatch.apiKey,
      q_artist: artist,
      q_track: title,
      format: 'json',
      f_has_lyrics: 1
    });

    const response = await axios.get(`${this.apis.musixmatch.baseUrl}/track.search?${params}`, {
      timeout: 10000
    });

    if (response.data.message.body.track_list.length === 0) {
      throw new Error('Canción no encontrada en Musixmatch');
    }

    const track = response.data.message.body.track_list[0].track;
    const trackId = track.track_id;

    // Obtener letras
    const lyricsParams = new URLSearchParams({
      apikey: this.apis.musixmatch.apiKey,
      track_id: trackId,
      format: 'json'
    });

    const lyricsResponse = await axios.get(`${this.apis.musixmatch.baseUrl}/track.lyrics.get?${lyricsParams}`, {
      timeout: 10000
    });

    if (!lyricsResponse.data.message.body.lyrics) {
      throw new Error('Letras no disponibles en Musixmatch');
    }

    return lyricsResponse.data.message.body.lyrics.lyrics_body;
  }

  /**
   * Obtener letras desde Genius
   */
  async getLyricsFromGenius(artist, title) {
    const searchQuery = `${artist} ${title}`;
    const searchResponse = await axios.get(`${this.apis.genius.baseUrl}/search`, {
      headers: {
        'Authorization': `Bearer ${this.apis.genius.accessToken}`
      },
      params: { q: searchQuery },
      timeout: 10000
    });

    if (searchResponse.data.response.hits.length === 0) {
      throw new Error('Canción no encontrada en Genius');
    }

    const song = searchResponse.data.response.hits[0].result;
    const lyricsUrl = song.url;

    // Genius no proporciona lyrics directos, solo URLs
    // En un caso real, usaríamos un scraper o API premium
    // Por ahora, devolvemos un placeholder
    return `[Letras disponibles en: ${lyricsUrl}]\n\nNota: Las letras completas están disponibles en Genius.com`;
  }

  /**
   * Traducir letras a otro idioma
   */
  async translateLyrics(lyrics, fromLang = 'en', toLang = 'es', options = {}) {
    try {
      const cacheKey = `translation:${fromLang}_${toLang}:${this.hashString(lyrics)}`;

      // Intentar obtener del caché
      if (!options.skipCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Usar Google Translate API o similar
      // En producción, integrar con Google Cloud Translation API
      const translatedLyrics = await this.translateWithGoogle(lyrics, fromLang, toLang);

      const result = {
        originalLyrics: lyrics,
        translatedLyrics,
        fromLanguage: fromLang,
        toLanguage: toLang,
        translatedAt: new Date().toISOString(),
        service: 'google_translate'
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.translations);

      return result;
    } catch (error) {
      logger.error('Error traduciendo letras:', error);
      throw error;
    }
  }

  /**
   * Traducción con Google Translate (simulada)
   */
  async translateWithGoogle(text, fromLang, toLang) {
    // En producción, integrar con Google Cloud Translation API
    // Por ahora, devolver un placeholder
    return `[Traducción al ${toLang.toUpperCase()}]\n\n${text}\n\n*Nota: Esta es una traducción automática. Para mayor precisión, consulta la versión oficial.*`;
  }

  /**
   * Buscar canciones por artista o álbum
   */
  async searchSongs(query, filters = {}) {
    try {
      const cacheKey = `lyrics:search:${query}:${JSON.stringify(filters)}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const results = [];

      // Buscar en Musixmatch
      if (this.apis.musixmatch.enabled) {
        try {
          const musixmatchResults = await this.searchInMusixmatch(query, filters);
          results.push(...musixmatchResults);
        } catch (error) {
          logger.warn('Musixmatch search failed:', error.message);
        }
      }

      // Buscar en Genius
      if (this.apis.genius.enabled) {
        try {
          const geniusResults = await this.searchInGenius(query, filters);
          results.push(...geniusResults);
        } catch (error) {
          logger.warn('Genius search failed:', error.message);
        }
      }

      // Remover duplicados
      const uniqueResults = this.removeDuplicateSongs(results);

      const result = {
        query,
        filters,
        results: uniqueResults,
        total: uniqueResults.length,
        searchedAt: new Date().toISOString()
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.search);

      return result;
    } catch (error) {
      logger.error('Error buscando canciones:', error);
      throw error;
    }
  }

  /**
   * Buscar en Musixmatch
   */
  async searchInMusixmatch(query, filters) {
    const params = new URLSearchParams({
      apikey: this.apis.musixmatch.apiKey,
      q: query,
      format: 'json',
      f_has_lyrics: 1
    });

    if (filters.artist) params.append('q_artist', filters.artist);
    if (filters.album) params.append('q_album', filters.album);

    const response = await axios.get(`${this.apis.musixmatch.baseUrl}/track.search?${params}`, {
      timeout: 10000
    });

    return response.data.message.body.track_list.map(item => ({
      id: item.track.track_id,
      title: item.track.track_name,
      artist: item.track.artist_name,
      album: item.track.album_name,
      source: 'musixmatch',
      hasLyrics: true
    }));
  }

  /**
   * Buscar en Genius
   */
  async searchInGenius(query, filters) {
    const searchResponse = await axios.get(`${this.apis.genius.baseUrl}/search`, {
      headers: {
        'Authorization': `Bearer ${this.apis.genius.accessToken}`
      },
      params: { q: query },
      timeout: 10000
    });

    return searchResponse.data.response.hits.map(hit => ({
      id: hit.result.id,
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
      album: hit.result.album?.name || 'Unknown',
      source: 'genius',
      hasLyrics: true,
      url: hit.result.url
    }));
  }

  /**
   * Obtener información de artista
   */
  async getArtistInfo(artistName) {
    try {
      const cacheKey = `lyrics:artist:${artistName}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      let artistInfo = null;

      // Buscar en Musixmatch
      if (this.apis.musixmatch.enabled) {
        try {
          artistInfo = await this.getArtistFromMusixmatch(artistName);
        } catch (error) {
          logger.warn('Musixmatch artist search failed:', error.message);
        }
      }

      if (!artistInfo && this.apis.genius.enabled) {
        try {
          artistInfo = await this.getArtistFromGenius(artistName);
        } catch (error) {
          logger.warn('Genius artist search failed:', error.message);
        }
      }

      if (!artistInfo) {
        throw new Error('Información de artista no encontrada');
      }

      // Cachear resultado
      await cacheService.set(cacheKey, artistInfo, this.CACHE_TTL.artist_info);

      return artistInfo;
    } catch (error) {
      logger.error('Error obteniendo info de artista:', error);
      throw error;
    }
  }

  /**
   * Obtener artista de Musixmatch
   */
  async getArtistFromMusixmatch(artistName) {
    const params = new URLSearchParams({
      apikey: this.apis.musixmatch.apiKey,
      q_artist: artistName,
      format: 'json'
    });

    const response = await axios.get(`${this.apis.musixmatch.baseUrl}/artist.search?${params}`, {
      timeout: 10000
    });

    if (response.data.message.body.artist_list.length === 0) {
      throw new Error('Artista no encontrado');
    }

    const artist = response.data.message.body.artist_list[0].artist;
    return {
      id: artist.artist_id,
      name: artist.artist_name,
      country: artist.artist_country,
      source: 'musixmatch'
    };
  }

  /**
   * Obtener artista de Genius
   */
  async getArtistFromGenius(artistName) {
    const searchResponse = await axios.get(`${this.apis.genius.baseUrl}/search`, {
      headers: {
        'Authorization': `Bearer ${this.apis.genius.accessToken}`
      },
      params: { q: artistName },
      timeout: 10000
    });

    if (searchResponse.data.response.hits.length === 0) {
      throw new Error('Artista no encontrado');
    }

    const artist = searchResponse.data.response.hits[0].result.primary_artist;
    return {
      id: artist.id,
      name: artist.name,
      image: artist.image_url,
      url: artist.url,
      source: 'genius'
    };
  }

  /**
   * Obtener letras con traducción
   */
  async getLyricsWithTranslation(songId, artist, title, targetLang = 'es') {
    try {
      const lyricsData = await this.getLyrics(songId, artist, title);

      if (targetLang !== 'en') {
        const translation = await this.translateLyrics(
          lyricsData.lyrics,
          'en',
          targetLang
        );
        lyricsData.translation = translation;
      }

      return lyricsData;
    } catch (error) {
      logger.error('Error obteniendo letras con traducción:', error);
      throw error;
    }
  }

  /**
   * Limpiar caché de letras
   */
  async clearLyricsCache() {
    try {
      const patterns = ['lyrics:*', 'translation:*', 'lyrics:search:*', 'lyrics:artist:*'];
      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }
      logger.info('Cache de letras limpiado');
    } catch (error) {
      logger.error('Error limpiando cache de letras:', error);
    }
  }

  /**
   * Utilidades
   */
  removeDuplicateSongs(songs) {
    const seen = new Set();
    return songs.filter(song => {
      const key = `${song.artist}_${song.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32 bits
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Verificar estado de APIs
   */
  async checkAPIStatus() {
    const status = {
      musixmatch: { enabled: this.apis.musixmatch.enabled, status: 'unknown' },
      genius: { enabled: this.apis.genius.enabled, status: 'unknown' }
    };

    // Verificar Musixmatch
    if (status.musixmatch.enabled) {
      try {
        const response = await axios.get(`${this.apis.musixmatch.baseUrl}/chart.tracks.get`, {
          params: {
            apikey: this.apis.musixmatch.apiKey,
            country: 'us',
            format: 'json'
          },
          timeout: 5000
        });
        status.musixmatch.status = response.status === 200 ? 'ok' : 'error';
      } catch (error) {
        status.musixmatch.status = 'error';
      }
    }

    // Verificar Genius
    if (status.genius.enabled) {
      try {
        const response = await axios.get(`${this.apis.genius.baseUrl}/search`, {
          headers: { 'Authorization': `Bearer ${this.apis.genius.accessToken}` },
          params: { q: 'test' },
          timeout: 5000
        });
        status.genius.status = response.status === 200 ? 'ok' : 'error';
      } catch (error) {
        status.genius.status = 'error';
      }
    }

    return status;
  }
}

module.exports = new LyricsService();