import React from 'react';
import { formatViewCount, formatPublishedDate } from '../api/videos';
import './VideoList.css';

const VideoList = ({
  videos,
  onVideoSelect,
  selectedVideoId,
  onAddToPlaylist,
  onToggleFavorite,
  favoriteStatus,
  loading = false,
  hasMore = true,
  onLoadMore
}) => {

  if (!videos || videos.length === 0) {
    return (
      <div className="video-list">
        <div className="no-videos">
          <h3>No se encontraron videos</h3>
          <p>Intenta con una búsqueda diferente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-list">
      <h3>Resultados de búsqueda ({videos.length})</h3>
      <div className="videos-grid">
        {videos.map(video => {
          const videoId = video.id?.videoId || video.id;
          const isSelected = selectedVideoId === videoId;

          return (
            <div
              key={videoId}
              className={`video-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onVideoSelect(video)}
            >
              <div className="video-thumbnail">
                <img
                  src={video.thumbnail || video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url}
                  alt={video.title || video.snippet?.title || 'Video'}
                  onError={(e) => {
                    e.target.src = '/placeholder-video.png';
                  }}
                />
                <div className="play-overlay">
                  <span>▶</span>
                </div>
              </div>

              <div className="video-info">
                <h4 className="video-title">{video.title || video.snippet?.title || 'Título no disponible'}</h4>
                <p className="video-channel">{video.channelTitle || video.snippet?.channelTitle || 'Canal desconocido'}</p>
                <div className="video-meta">
                  <span className="video-date">
                    {formatPublishedDate(video.publishedAt || video.snippet?.publishedAt)}
                  </span>
                  {video.statistics && (
                    <div className="video-stats">
                      <span>👁 {formatViewCount(video.statistics.viewCount)}</span>
                      <span>👍 {formatViewCount(video.statistics.likeCount)}</span>
                    </div>
                  )}
                </div>
                <div className="video-actions">
                  {onToggleFavorite && (
                    <button
                      className={`favorite-btn ${favoriteStatus?.[video.id || video._id] ? 'favorited' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(video);
                      }}
                      title={favoriteStatus?.[video.id || video._id] ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {favoriteStatus?.[video.id || video._id] ? '❤️' : '🤍'}
                    </button>
                  )}
                  {onAddToPlaylist && (
                    <button
                      className="add-to-playlist-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToPlaylist(video);
                      }}
                      title="Agregar a playlist"
                    >
                      ➕ Playlist
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicador de carga y botón de cargar más */}
      {loading && (
        <div className="loading-more">
          <div className="loading-spinner"></div>
          <span>Cargando más videos...</span>
        </div>
      )}

      {!loading && hasMore && onLoadMore && (
        <div className="load-more-container">
          <button
            className="load-more-btn"
            onClick={onLoadMore}
          >
            Cargar más videos
          </button>
        </div>
      )}

      {!hasMore && videos.length > 0 && (
        <div className="no-more-videos">
          <span>No hay más videos para mostrar</span>
        </div>
      )}
    </div>
  );
};

export default VideoList;