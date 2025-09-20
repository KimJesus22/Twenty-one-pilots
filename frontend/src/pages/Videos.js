import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import VideoList from '../components/VideoList';
import VideoPlayer from '../components/VideoPlayer';
import { searchVideos, formatViewCount, formatPublishedDate } from '../api/videos';
import './Videos.css';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Twenty One Pilots');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const fetchVideos = async (query = searchQuery) => {
    try {
      setLoading(true);
      setError(null);

      const result = await searchVideos(query, { limit: 20 });
      setVideos(result.data || []);
    } catch (err) {
      console.error('Error cargando videos:', err.message);
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

  const handleVideoSelect = (video) => {
    console.log('Video seleccionado:', video);
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
            selectedVideoId={selectedVideo?.id?.videoId || selectedVideo?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default Videos;