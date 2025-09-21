import React, { useEffect, useState } from 'react';
import './Spotify.css';

const Spotify = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('track');

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/spotify/me');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data);
        setIsAuthenticated(true);
        fetchPlaylists();
      }
    } catch (err) {
      console.log('Usuario no autenticado');
    }
  };

  const handleSpotifyAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/authorize');
      const data = await response.json();

      if (data.authorizeURL) {
        window.location.href = data.authorizeURL;
      }
    } catch (err) {
      setError('Error al iniciar autenticación con Spotify');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/spotify/playlists?limit=20');
      const data = await response.json();
      setPlaylists(data.data?.items || []);
    } catch (err) {
      console.error('Error cargando playlists:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      } else {
        setError(data.message || 'Error en la búsqueda');
      }
    } catch (err) {
      setError('Error al buscar en Spotify');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/spotify/recommendations?limit=10');
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data);
      } else {
        setError(data.message || 'Error obteniendo recomendaciones');
      }
    } catch (err) {
      setError('Error al obtener recomendaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderTrack = (track, showAlbum = true) => (
    <div key={track.id} className="spotify-track">
      <div className="track-image">
        <img
          src={track.album?.images?.[0]?.url || '/placeholder-album.png'}
          alt={track.album?.name || 'Album'}
          onError={(e) => {
            e.target.src = '/placeholder-album.png';
          }}
        />
      </div>
      <div className="track-info">
        <h4 className="track-name">{track.name}</h4>
        <p className="track-artists">
          {track.artists?.map(artist => artist.name).join(', ')}
        </p>
        {showAlbum && track.album && (
          <p className="track-album">{track.album.name}</p>
        )}
        <div className="track-meta">
          <span className="track-duration">{formatDuration(track.duration_ms)}</span>
          {track.popularity && (
            <span className="track-popularity">⭐ {track.popularity}</span>
          )}
        </div>
      </div>
      <div className="track-actions">
        <a
          href={track.external_urls?.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-spotify"
        >
          🎵 Abrir en Spotify
        </a>
      </div>
    </div>
  );

  const renderPlaylist = (playlist) => (
    <div key={playlist.id} className="spotify-playlist">
      <div className="playlist-image">
        <img
          src={playlist.images?.[0]?.url || '/placeholder-playlist.png'}
          alt={playlist.name}
          onError={(e) => {
            e.target.src = '/placeholder-playlist.png';
          }}
        />
      </div>
      <div className="playlist-info">
        <h4 className="playlist-name">{playlist.name}</h4>
        <p className="playlist-description">{playlist.description || 'Sin descripción'}</p>
        <div className="playlist-meta">
          <span>Por: {playlist.owner?.display_name}</span>
          <span>{playlist.tracks?.total || 0} canciones</span>
          <span>{playlist.public ? 'Pública' : 'Privada'}</span>
        </div>
      </div>
      <div className="playlist-actions">
        <a
          href={playlist.external_urls?.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-spotify"
        >
          🎵 Abrir en Spotify
        </a>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="spotify">
        <div className="spotify-auth">
          <div className="auth-content">
            <h1>🎵 Integración con Spotify</h1>
            <p>Conecta tu cuenta de Spotify para acceder a playlists, buscar música y obtener recomendaciones personalizadas.</p>

            <div className="auth-features">
              <div className="feature">
                <span className="feature-icon">🔍</span>
                <h3>Búsqueda Avanzada</h3>
                <p>Encuentra cualquier canción, artista o álbum en Spotify</p>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <h3>Tus Playlists</h3>
                <p>Accede a todas tus playlists de Spotify</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🎯</span>
                <h3>Recomendaciones</h3>
                <p>Descubre nueva música basada en tus gustos</p>
              </div>
            </div>

            <button
              onClick={handleSpotifyAuth}
              disabled={loading}
              className="btn btn-spotify-auth"
            >
              {loading ? 'Conectando...' : '🔗 Conectar con Spotify'}
            </button>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify">
      <div className="spotify-header">
        <div className="user-info">
          <img
            src={userProfile?.images?.[0]?.url || '/placeholder-user.png'}
            alt="Perfil"
            className="user-avatar"
            onError={(e) => {
              e.target.src = '/placeholder-user.png';
            }}
          />
          <div className="user-details">
            <h2>¡Hola, {userProfile?.display_name || 'Usuario'}!</h2>
            <p>Conectado a Spotify</p>
          </div>
        </div>
      </div>

      <div className="spotify-tabs">
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Buscar
        </button>
        <button
          className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          📱 Playlists
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          🎯 Recomendaciones
        </button>
      </div>

      <div className="spotify-content">
        {activeTab === 'search' && (
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-inputs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en Spotify..."
                  className="search-input"
                />
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="search-type"
                >
                  <option value="track">Canciones</option>
                  <option value="artist">Artistas</option>
                  <option value="album">Álbumes</option>
                  <option value="playlist">Playlists</option>
                </select>
                <button type="submit" disabled={loading} className="btn btn-spotify">
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {searchResults && (
              <div className="search-results">
                {searchType === 'track' && searchResults.tracks?.items && (
                  <div className="results-section">
                    <h3>Canciones encontradas</h3>
                    <div className="tracks-list">
                      {searchResults.tracks.items.map(track => renderTrack(track))}
                    </div>
                  </div>
                )}

                {searchType === 'playlist' && searchResults.playlists?.items && (
                  <div className="results-section">
                    <h3>Playlists encontradas</h3>
                    <div className="playlists-list">
                      {searchResults.playlists.items.map(playlist => renderPlaylist(playlist))}
                    </div>
                  </div>
                )}

                {searchType === 'album' && searchResults.albums?.items && (
                  <div className="results-section">
                    <h3>Álbumes encontrados</h3>
                    <div className="albums-list">
                      {searchResults.albums.items.map(album => (
                        <div key={album.id} className="spotify-album">
                          <div className="album-image">
                            <img
                              src={album.images?.[0]?.url || '/placeholder-album.png'}
                              alt={album.name}
                              onError={(e) => {
                                e.target.src = '/placeholder-album.png';
                              }}
                            />
                          </div>
                          <div className="album-info">
                            <h4>{album.name}</h4>
                            <p>{album.artists?.map(artist => artist.name).join(', ')}</p>
                            <p>{album.total_tracks} canciones</p>
                          </div>
                          <div className="album-actions">
                            <a
                              href={album.external_urls?.spotify}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-spotify"
                            >
                              🎵 Abrir en Spotify
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="playlists-section">
            <h3>Tus Playlists de Spotify</h3>
            {playlists.length === 0 ? (
              <div className="no-playlists">
                <p>No se encontraron playlists</p>
                <button onClick={fetchPlaylists} className="btn btn-spotify">
                  Recargar
                </button>
              </div>
            ) : (
              <div className="playlists-list">
                {playlists.map(playlist => renderPlaylist(playlist))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-section">
            <div className="recommendations-header">
              <h3>Recomendaciones de Spotify</h3>
              <button
                onClick={getRecommendations}
                disabled={loading}
                className="btn btn-spotify"
              >
                {loading ? 'Cargando...' : 'Obtener Recomendaciones'}
              </button>
            </div>

            {recommendations && (
              <div className="recommendations-list">
                <h4>Basado en tus gustos musicales</h4>
                <div className="tracks-list">
                  {recommendations.tracks?.map(track => renderTrack(track)) || []}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Spotify;