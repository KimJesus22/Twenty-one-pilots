import React, { useEffect, useState } from 'react';
import './Videos.css';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Twenty One Pilots');

  useEffect(() => {
    fetchVideos();
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVideos = async () => {
    try {
      setLoading(true);

      // Intentar conectar con el backend
      try {
        const response = await fetch(`http://localhost:5000/api/videos/search?q=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        // Asegurarse de que data sea un array
        const videosArray = Array.isArray(data) ? data : [];
        setVideos(videosArray);
        setError(null);
      } catch (backendError) {
        console.warn('Backend no disponible, usando datos mock:', backendError.message);

        // Datos mock si el backend no está disponible
        const mockVideos = [
          {
            id: { videoId: 'UprcpdwuwCg' },
            snippet: {
              title: 'Twenty One Pilots - Stressed Out [Official Video]',
              description: 'Official music video for "Stressed Out" by Twenty One Pilots.',
              channelTitle: 'Fueled By Ramen',
              publishedAt: '2016-04-27T16:00:00Z',
              thumbnails: {
                medium: { url: 'https://img.youtube.com/vi/UprcpdwuwCg/mqdefault.jpg' }
              }
            },
            statistics: {
              viewCount: '1500000000',
              likeCount: '12000000'
            }
          },
          {
            id: { videoId: 'hTWKbfoikeg' },
            snippet: {
              title: 'Twenty One Pilots - Heathens (from Suicide Squad: The Album) [OFFICIAL VIDEO]',
              description: 'Official music video for "Heathens" by Twenty One Pilots.',
              channelTitle: 'Atlantic Records',
              publishedAt: '2016-06-21T16:00:00Z',
              thumbnails: {
                medium: { url: 'https://img.youtube.com/vi/hTWKbfoikeg/mqdefault.jpg' }
              }
            },
            statistics: {
              viewCount: '2000000000',
              likeCount: '15000000'
            }
          },
          {
            id: { videoId: 'eJnQBXmZ7Ek' },
            snippet: {
              title: 'Twenty One Pilots - Ride [Official Video]',
              description: 'Official music video for "Ride" by Twenty One Pilots.',
              channelTitle: 'Fueled By Ramen',
              publishedAt: '2016-05-14T16:00:00Z',
              thumbnails: {
                medium: { url: 'https://img.youtube.com/vi/eJnQBXmZ7Ek/mqdefault.jpg' }
              }
            },
            statistics: {
              viewCount: '800000000',
              likeCount: '8000000'
            }
          }
        ];

        setVideos(mockVideos);
        setError(null);
      }
    } catch (err) {
      console.error('Error cargando videos:', err);
      setError('Error al cargar los videos. Revisa la conexión con el backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVideos();
  };

  const formatViewCount = (count) => {
    if (!count) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const formatPublishedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <p>Descubre los mejores videos musicales y contenido oficial</p>

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
                  <span>▶</span>
                </div>
              </div>

              <div className="video-info">
                <h3 className="video-title">{video.snippet.title}</h3>
                <p className="video-description">{video.snippet.description}</p>

                <div className="video-meta">
                  <span className="channel">{video.snippet.channelTitle}</span>
                  <span className="published-date">
                    {formatPublishedDate(video.snippet.publishedAt)}
                  </span>
                </div>

                <div className="video-stats">
                  <span>👁 {formatViewCount(video.statistics?.viewCount)}</span>
                  <span>👍 {formatViewCount(video.statistics?.likeCount)}</span>
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