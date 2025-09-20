import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import VideoList from '../components/VideoList';
import VideoPlayer from '../components/VideoPlayer';
import { searchVideos, formatViewCount, formatPublishedDate } from '../api/videos';
import './Videos.css';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true); // Cambiar a true para mostrar loading inicial
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Twenty One Pilots');
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Ref para evitar doble carga en React StrictMode
  const hasLoadedRef = useRef(false);

  // Cargar videos iniciales al montar el componente (solo una vez)
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchVideos();
    }
  }, []);

  const fetchVideos = async (query = searchQuery) => {
    try {
      setLoading(true);
      setError(null);

      const result = await searchVideos(query, { limit: 20 });

      setVideos(result.data || []);
    } catch (err) {
      console.error('❌ Error cargando videos:', err.message);
      setError(err.message || 'Error al cargar los videos. Revisa la conexión con el backend.');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
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
          <VideoPlayer video={selectedVideo} />
        </div>

        <div className="videos-sidebar">
          <VideoList
            videos={videos}
            onVideoSelect={handleVideoSelect}
            selectedVideoId={getVideoId(selectedVideo)}
          />
        </div>
      </div>
    </div>
  );
};

export default Videos;