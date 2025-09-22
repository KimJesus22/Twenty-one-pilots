import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from './useFavorites';
import lyricsAPI from '../api/lyrics';

export function useLyrics() {
  const { isAuthenticated } = useAuth();
  const { addToFavorites: addToFavoritesGeneral, hasFavorite } = useFavorites();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLyrics, setCurrentLyrics] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [stats, setStats] = useState({});

  // Cargar idiomas soportados al iniciar
  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  const loadSupportedLanguages = useCallback(async () => {
    try {
      const response = await lyricsAPI.getSupportedLanguages();
      if (response.success) {
        setSupportedLanguages(response.data.languages);
      }
    } catch (err) {
      console.error('Error loading supported languages:', err);
    }
  }, []);

  const getLyrics = useCallback(async (songId, artist, title, lang = null) => {
    if (!artist || !title) {
      throw new Error('Se requieren artista y título');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await lyricsAPI.getLyrics(songId, artist, title, lang);

      if (response.success) {
        setCurrentLyrics(response.data.lyrics);
        return response.data.lyrics;
      } else {
        throw new Error(response.message || 'Error obteniendo letras');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const translateLyrics = useCallback(async (lyrics, fromLang = 'en', toLang = 'es') => {
    try {
      setLoading(true);
      setError(null);

      const response = await lyricsAPI.translateLyrics(lyrics, fromLang, toLang);

      if (response.success) {
        return response.data.translation;
      } else {
        throw new Error(response.message || 'Error traduciendo letras');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSongs = useCallback(async (query, filters = {}) => {
    if (!query) {
      throw new Error('Se requiere un término de búsqueda');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await lyricsAPI.searchSongs(query, filters);

      if (response.success) {
        setSearchResults(response.data.results);
        return response.data;
      } else {
        throw new Error(response.message || 'Error buscando canciones');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getArtistInfo = useCallback(async (artistName) => {
    try {
      setLoading(true);
      setError(null);

      const response = await lyricsAPI.getArtistInfo(artistName);

      if (response.success) {
        return response.data.artist;
      } else {
        throw new Error(response.message || 'Error obteniendo información del artista');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addLyricsToFavorites = useCallback(async (songData) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para agregar letras a favoritos');
    }

    try {
      setError(null);

      const favoriteData = {
        songId: songData.songId,
        artist: songData.artist,
        title: songData.title,
        lyrics: songData.lyrics,
        source: songData.source || 'unknown'
      };

      const response = await lyricsAPI.addLyricsToFavorites(favoriteData);

      if (response.success) {
        // También agregar al sistema general de favoritos
        await addToFavoritesGeneral('lyrics', songData.songId || `${songData.artist}_${songData.title}`, {
          title: `${songData.artist} - ${songData.title}`,
          artist: songData.artist,
          lyrics: songData.lyrics?.substring(0, 500),
          source: songData.source
        });

        return response.data.favorite;
      } else {
        throw new Error(response.message || 'Error agregando letras a favoritos');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isAuthenticated, addToFavoritesGeneral]);

  const checkLyricsFavorite = useCallback(async (songId, artist, title) => {
    if (!isAuthenticated) return false;

    try {
      const response = await lyricsAPI.checkLyricsFavorite(songId, artist, title);
      return response.success ? response.data.isFavorite : false;
    } catch (err) {
      console.error('Error checking lyrics favorite:', err);
      return false;
    }
  }, [isAuthenticated]);

  const getFavoriteLyrics = useCallback(async (filters = {}) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para ver letras favoritas');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await lyricsAPI.getFavoriteLyrics(filters);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error obteniendo letras favoritas');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getLyricsStats = useCallback(async () => {
    if (!isAuthenticated) return {};

    try {
      const response = await lyricsAPI.getLyricsStats();
      if (response.success) {
        setStats(response.data.stats);
        return response.data.stats;
      }
    } catch (err) {
      console.error('Error getting lyrics stats:', err);
    }
    return {};
  }, [isAuthenticated]);

  const checkAPIStatus = useCallback(async () => {
    try {
      const response = await lyricsAPI.checkAPIStatus();
      return response.success ? response.data.apiStatus : {};
    } catch (err) {
      console.error('Error checking API status:', err);
      return {};
    }
  }, []);

  const getSearchSuggestions = useCallback(async (query, limit = 5) => {
    if (!query || query.length < 2) return [];

    try {
      const response = await lyricsAPI.getSearchSuggestions(query, limit);
      return response.success ? response.data.suggestions : [];
    } catch (err) {
      console.error('Error getting search suggestions:', err);
      return [];
    }
  }, []);

  const getPopularLyrics = useCallback(async (limit = 10) => {
    try {
      const response = await lyricsAPI.getPopularLyrics(limit);
      return response.success ? response.data.popularLyrics : [];
    } catch (err) {
      console.error('Error getting popular lyrics:', err);
      return [];
    }
  }, []);

  // Funciones de utilidad
  const clearCurrentLyrics = useCallback(() => {
    setCurrentLyrics(null);
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const isLyricsFavorite = useCallback((songId, artist, title) => {
    return hasFavorite('lyrics', songId || `${artist}_${title}`);
  }, [hasFavorite]);

  return {
    // Estado
    loading,
    error,
    currentLyrics,
    searchResults,
    supportedLanguages,
    stats,

    // Acciones
    getLyrics,
    translateLyrics,
    searchSongs,
    getArtistInfo,
    addLyricsToFavorites,
    checkLyricsFavorite,
    getFavoriteLyrics,
    getLyricsStats,
    checkAPIStatus,
    getSearchSuggestions,
    getPopularLyrics,

    // Utilidades
    clearCurrentLyrics,
    clearSearchResults,
    isLyricsFavorite
  };
}