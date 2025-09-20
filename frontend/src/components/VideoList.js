import React from 'react';
import { formatViewCount, formatPublishedDate } from '../api/videos';
import './VideoList.css';

const VideoList = ({ videos, onVideoSelect, selectedVideoId }) => {

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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoList;