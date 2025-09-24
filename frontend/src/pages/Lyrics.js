import React, { useState } from 'react';
import { useLyrics } from '../hooks/useLyrics';
import './Lyrics.css';

const Lyrics = () => {
  const {
    getLyrics,
    translateLyrics,
    searchSongs,
    addLyricsToFavorites,
    // eslint-disable-next-line no-unused-vars
    _checkLyricsFavorite,
    loading,
    error,
    currentLyrics,
    searchResults,
    supportedLanguages,
    clearCurrentLyrics,
    clearSearchResults,
    isLyricsFavorite
  } = useLyrics();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [translatedLyrics, setTranslatedLyrics] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      await searchSongs(searchQuery);
    } catch (err) {
      console.error('Error searching songs:', err);
    }
  };

  const handleGetLyrics = async (song) => {
    try {
      setSelectedSong(song);
      clearSearchResults();
      await getLyrics(song.id, song.artist, song.title);
      setArtist(song.artist);
      setTitle(song.title);
    } catch (err) {
      console.error('Error getting lyrics:', err);
    }
  };

  const handleTranslate = async () => {
    if (!currentLyrics?.lyrics) return;

    try {
      const translation = await translateLyrics(currentLyrics.lyrics, 'en', selectedLanguage);
      setTranslatedLyrics(translation);
      setShowTranslation(true);
    } catch (err) {
      console.error('Error translating lyrics:', err);
    }
  };

  const handleAddToFavorites = async () => {
    if (!currentLyrics || !selectedSong) return;

    try {
      await addLyricsToFavorites({
        songId: selectedSong.id,
        artist: selectedSong.artist,
        title: selectedSong.title,
        lyrics: currentLyrics.lyrics,
        source: currentLyrics.source
      });
      alert('Letras agregadas a favoritos');
    } catch (err) {
      console.error('Error adding to favorites:', err);
      alert('Error agregando a favoritos: ' + err.message);
    }
  };

  const handleManualLyrics = async (e) => {
    e.preventDefault();
    if (!artist.trim() || !title.trim()) return;

    try {
      setSelectedSong({ artist, title });
      await getLyrics(null, artist, title);
    } catch (err) {
      console.error('Error getting lyrics:', err);
    }
  };

  return (
    <div className="lyrics">
      <div className="lyrics-header">
        <h1>Letras de Canciones</h1>
        <p>Busca y traduce letras de Twenty One Pilots y otros artistas</p>
      </div>

      <div className="lyrics-content">
        {/* Buscador */}
        <div className="lyrics-search">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Buscar canciones, artistas o álbumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {/* Búsqueda manual */}
          <div className="manual-search">
            <h3>O busca manualmente</h3>
            <form onSubmit={handleManualLyrics} className="manual-form">
              <input
                type="text"
                placeholder="Artista"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Título de la canción"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-secondary" disabled={loading}>
                {loading ? 'Cargando...' : 'Obtener Letras'}
              </button>
            </form>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Resultados de búsqueda</h3>
            <div className="songs-list">
              {searchResults.map((song, index) => (
                <div key={song.id || index} className="song-item">
                  <div className="song-info">
                    <h4>{song.title}</h4>
                    <p>{song.artist}</p>
                    {song.album && <small>Álbum: {song.album}</small>}
                  </div>
                  <button
                    onClick={() => handleGetLyrics(song)}
                    className="btn btn-secondary"
                  >
                    Ver Letras
                  </button>
                </div>
              ))}
            </div>
            <button onClick={clearSearchResults} className="btn btn-secondary">
              Limpiar resultados
            </button>
          </div>
        )}

        {/* Mostrar letras */}
        {currentLyrics && (
          <div className="lyrics-display">
            <div className="lyrics-header">
              <div className="song-title">
                <h2>{selectedSong?.title || title}</h2>
                <p>{selectedSong?.artist || artist}</p>
                <small>Fuente: {currentLyrics.source}</small>
              </div>

              <div className="lyrics-actions">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleTranslate}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Traducir
                </button>

                <button
                  onClick={handleAddToFavorites}
                  className="btn btn-primary"
                  disabled={isLyricsFavorite(selectedSong?.id, selectedSong?.artist, title)}
                >
                  {isLyricsFavorite(selectedSong?.id, selectedSong?.artist, title)
                    ? '❤️ En Favoritos'
                    : '🤍 Agregar a Favoritos'}
                </button>

                <button onClick={clearCurrentLyrics} className="btn btn-secondary">
                  Cerrar
                </button>
              </div>
            </div>

            <div className="lyrics-content">
              <div className="lyrics-original">
                <h3>Letras Originales</h3>
                <pre>{currentLyrics.lyrics}</pre>
              </div>

              {showTranslation && translatedLyrics && (
                <div className="lyrics-translation">
                  <h3>Traducción al {selectedLanguage.toUpperCase()}</h3>
                  <pre>{translatedLyrics.translatedLyrics}</pre>
                  <small>
                    * {translatedLyrics.service} - {new Date(translatedLyrics.translatedAt).toLocaleString()}
                  </small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensajes de error */}
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Información de idiomas soportados */}
        {supportedLanguages.length > 0 && (
          <div className="languages-info">
            <h3>Idiomas soportados para traducción</h3>
            <div className="languages-list">
              {supportedLanguages.map(lang => (
                <span key={lang} className="language-tag">
                  {lang.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lyrics;