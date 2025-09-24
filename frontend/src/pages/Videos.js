import React, { useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import VideoList from '../components/VideoList';
import VideoPlayer from '../components/VideoPlayer';
import { searchVideos, formatViewCount, formatPublishedDate, addToFavorites, removeFromFavorites, checkFavoriteStatus } from '../api/videos';
import playlistsAPI from '../api/playlists';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { useAuth } from '../contexts/AuthContext';
import './Videos.css';

const Videos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true); // Cambiar a true para mostrar loading inicial
  const [loadingMore, setLoadingMore] = useState(false); // Para carga infinita
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Twenty One Pilots');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hasMore, setHasMore] = useState(true); // Si hay más videos para cargar
  const [page, setPage] = useState(1); // Página actual para paginación

  // Filtros avanzados
  const [filters, setFilters] = useState({
    type: '',
    genre: '',
    artist: '',
    year: ''
  });

  // Estado de favoritos (simulado - en producción vendría del contexto de autenticación)
  const [favoriteStatus, setFavoriteStatus] = useState({});
  const mockUserId = '507f1f77bcf86cd799439011'; // ID de usuario mock

  // Modal para agregar a playlist
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [selectedVideoForPlaylist, setSelectedVideoForPlaylist] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState([]);

  // Ref para evitar doble carga en React StrictMode
  const hasLoadedRef = useRef(false);

  // Cargar videos iniciales al montar el componente (solo una vez)
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchVideos();
    }
  }, []);

  const fetchVideos = async (query = searchQuery, reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
        setPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const searchOptions = { limit: 20 };
      if (filters.type) searchOptions.type = filters.type;
      if (filters.genre) searchOptions.genre = filters.genre;
      if (filters.artist) searchOptions.artist = filters.artist;
      if (filters.year) searchOptions.year = filters.year;

      // Para carga infinita, necesitamos manejar la paginación
      // Como la API actual no soporta paginación real, simularemos con diferentes queries
      if (!reset) {
        searchOptions.pageToken = `page_${page + 1}`;
      }

      const result = await searchVideos(query, searchOptions);

      if (reset) {
        setVideos(result.data || []);
      } else {
        setVideos(prev => [...prev, ...(result.data || [])]);
        setPage(prev => prev + 1);
      }

      // Simular que no hay más videos después de 3 páginas
      if (page >= 3) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Error cargando videos:', err.message);
      setError(err.message || 'Error al cargar los videos. Revisa la conexión con el backend.');
      if (reset) {
        setVideos([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Función para cargar más videos
  const loadMoreVideos = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchVideos(searchQuery, false);
    }
  }, [loadingMore, hasMore, searchQuery, filters]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchVideos(searchQuery, true); // Reset siempre para nueva búsqueda
    }
  };

  // Función helper para normalizar el acceso a propiedades del video
  const getVideoTitle = (video) => {
    if (!video) return 'Título no disponible';

    // Caso 1: Video de búsqueda (tiene snippet directamente)
    if (video.snippet?.title) {
      return video.snippet.title;
    }

    // Caso 2: Video específico (viene de items[0])
    if (video.items?.[0]?.snippet?.title) {
      return video.items[0].snippet.title;
    }

    // Caso 3: Video ya normalizado
    if (video.title) {
      return video.title;
    }

    return 'Título no disponible';
  };

  const getVideoId = (video) => {
    if (!video) return null;

    // Caso 1: Video de búsqueda
    if (video.id?.videoId) {
      return video.id.videoId;
    }

    // Caso 2: Video específico
    if (video.items?.[0]?.id) {
      return video.items[0].id;
    }

    // Caso 3: ID directo
    if (typeof video.id === 'string') {
      return video.id;
    }

    return null;
  };

  const handleVideoSelect = (video) => {
    const title = getVideoTitle(video);
    const videoId = getVideoId(video);

    console.log('🎬 Video seleccionado:', {
      title,
      videoId,
      hasSnippet: !!video?.snippet,
      hasItems: !!video?.items,
      originalVideo: video
    });

    setSelectedVideo(video);
  };

  const handleRetry = () => {
    fetchVideos();
  };

  // Función para manejar toggle de favoritos
  const handleToggleFavorite = async (video) => {
    const videoId = video.id || video._id;
    const isCurrentlyFavorite = favoriteStatus[videoId];

    try {
      if (isCurrentlyFavorite) {
        await removeFromFavorites(mockUserId, videoId);
        setFavoriteStatus(prev => ({ ...prev, [videoId]: false }));
      } else {
        await addToFavorites(mockUserId, videoId);
        setFavoriteStatus(prev => ({ ...prev, [videoId]: true }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Aquí podrías mostrar un toast de error
    }
  };

  // Cargar estado de favoritos al montar (simulado)
  useEffect(() => {
    // Simular carga de estado de favoritos
    const loadFavoriteStatus = async () => {
      // En una implementación real, esto vendría del contexto de autenticación
      // Por ahora, simulamos algunos videos como favoritos
      const mockFavorites = {};
      videos.forEach((video, index) => {
        if (index % 3 === 0) { // Cada tercer video es favorito
          mockFavorites[video.id || video._id] = true;
        }
      });
      setFavoriteStatus(mockFavorites);
    };

    if (videos.length > 0) {
      loadFavoriteStatus();
    }
  }, [videos]);

  // Hook para scroll infinito
  useInfiniteScroll(loadMoreVideos, hasMore, loading || loadingMore);

  // Resetear cuando cambian los filtros
  useEffect(() => {
    if (hasLoadedRef.current) {
      fetchVideos(searchQuery, true);
    }
  }, [filters]);

  const handleAddToPlaylist = (video) => {
    setSelectedVideoForPlaylist(video);
    // Aquí cargar playlists del usuario si no están cargadas
    // Por simplicidad, asumir que están disponibles o cargarlas
    setShowAddToPlaylistModal(true);
  };

  const handleAddVideoToPlaylist = async (playlistId) => {
    if (!selectedVideoForPlaylist) return;

    try {
      await playlistsAPI.addVideoToPlaylist(playlistId, selectedVideoForPlaylist.id || selectedVideoForPlaylist._id, 'userId'); // Usar ID real del usuario
      alert('Video agregado a la playlist exitosamente');
      setShowAddToPlaylistModal(false);
      setSelectedVideoForPlaylist(null);
    } catch (error) {
      console.error('Error agregando video a playlist:', error);
      alert('Error al agregar video a playlist');
    }
  };

  if (loading && videos.length === 0) {
    return (
      <div className="videos">
        <div className="loading">Cargando videos...</div>
      </div>
    );
  }

  return (
    <div className="videos">
      <div className="videos-header">
        <h1>Videos de Twenty One Pilots</h1>
        <p>Descubre los mejores videos musicales y contenido oficial</p>

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          loading={loading}
        />

        {/* Filtros avanzados */}
        <div className="video-filters">
          <div className="filter-row">
            <select
              value={filters.genre}
              onChange={(e) => setFilters({...filters, genre: e.target.value})}
              className="filter-select"
            >
              <option value="">Todos los géneros</option>
              <option value="pop">Pop</option>
              <option value="rock">Rock</option>
              <option value="hip-hop">Hip-Hop</option>
              <option value="electronic">Electrónico</option>
              <option value="indie">Indie</option>
              <option value="alternative">Alternativo</option>
              <option value="folk">Folk</option>
              <option value="jazz">Jazz</option>
              <option value="classical">Clásico</option>
              <option value="other">Otro</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="filter-select"
            >
              <option value="">Todos los tipos</option>
              <option value="official">Oficial</option>
              <option value="concert">Concierto</option>
              <option value="lyric">Lyric</option>
              <option value="interview">Entrevista</option>
              <option value="cover">Cover</option>
              <option value="remix">Remix</option>
              <option value="live">En vivo</option>
              <option value="acoustic">Acústico</option>
              <option value="other">Otro</option>
            </select>

            <input
              type="text"
              placeholder="Artista"
              value={filters.artist}
              onChange={(e) => setFilters({...filters, artist: e.target.value})}
              className="filter-input"
            />

            <input
              type="number"
              placeholder="Año"
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: e.target.value})}
              className="filter-input"
              min="1900"
              max={new Date().getFullYear()}
            />

            <button
              onClick={() => setFilters({ type: '', genre: '', artist: '', year: '' })}
              className="clear-filters-btn"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
            Reintentar
          </button>
        </div>
      )}

      <div className="videos-content">
        <div className="videos-main">
          <VideoPlayer video={selectedVideo} currentUser={user} />
        </div>

        <div className="videos-sidebar">
          <VideoList
            videos={videos}
            onVideoSelect={handleVideoSelect}
            selectedVideoId={getVideoId(selectedVideo)}
            onAddToPlaylist={handleAddToPlaylist}
            onToggleFavorite={handleToggleFavorite}
            favoriteStatus={favoriteStatus}
            loading={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMoreVideos}
          />
        </div>
      </div>

      {/* Modal para agregar a playlist */}
      {showAddToPlaylistModal && (
        <div className="modal-overlay" onClick={() => setShowAddToPlaylistModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar a Playlist</h3>
              <button onClick={() => setShowAddToPlaylistModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Seleccionar playlist para agregar el video:</p>
              <p><strong>{selectedVideoForPlaylist?.title || selectedVideoForPlaylist?.snippet?.title}</strong></p>
              <div className="playlist-options">
                {/* Aquí mostrar las playlists del usuario */}
                {/* Por simplicidad, mostrar opciones mock */}
                <button onClick={() => handleAddVideoToPlaylist('playlist1')} className="playlist-option">
                  Mis Favoritas
                </button>
                <button onClick={() => handleAddVideoToPlaylist('playlist2')} className="playlist-option">
                  Para Entrenar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;