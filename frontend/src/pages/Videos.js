import React, { useEffect, useState } from 'react';
import './Videos.css';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Twenty One Pilots');

  useEffect(() => {
    fetchVideos();
  }, [searchQuery]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos/search?q=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setVideos(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVideos();
  };

  const formatDuration = (duration) => {
    // YouTube duration format: PT4M13S -> 4:13
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    let result = '';
    if (hours) result += `${hours}:`;
    result += `${minutes || '0'}:${seconds.padStart(2, '0')}`;
    return result;
  };

  const formatViewCount = (count) => {
    if (!count) return '0';
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="videos">
        <div className="loading">Cargando videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="videos">
        <div className="error">
          <h2>Error al cargar los videos</h2>
          <p>{error}</p>
          <button onClick={fetchVideos} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="videos">
      <div className="videos-header">
        <h1>Videos de Twenty One Pilots</h1>
        <p>Descubre videos oficiales, conciertos y contenido exclusivo</p>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar videos..."
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>
      </div>

      <div className="videos-grid">
        {videos.length === 0 ? (
          <div className="no-videos">
            <h3>No se encontraron videos</h3>
            <p>Intenta con una búsqueda diferente.</p>
          </div>
        ) : (
          videos.map(video => (
            <div key={video.id.videoId} className="video-card">
              <div className="video-thumbnail">
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                />
                <div className="play-overlay">
                  <span>▶️</span>
                </div>
              </div>

              <div className="video-info">
                <h3 className="video-title">{video.snippet.title}</h3>
                <p className="video-description">
                  {video.snippet.description.length > 100
                    ? `${video.snippet.description.substring(0, 100)}...`
                    : video.snippet.description
                  }
                </p>

                <div className="video-meta">
                  <span className="channel">{video.snippet.channelTitle}</span>
                  <span className="published">
                    {new Date(video.snippet.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="video-stats">
                  {video.statistics && (
                    <>
                      <span>👁️ {formatViewCount(video.statistics.viewCount)}</span>
                      <span>👍 {formatViewCount(video.statistics.likeCount)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Videos;