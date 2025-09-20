import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { formatViewCount, formatPublishedDate } from '../api/videos';
import './YouTubePlayer.css';

const YouTubePlayer = ({
  video,
  onReady,
  onError,
  onStateChange,
  autoplay = false,
  className = '',
  showStats = true,
  showDescription = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    // Reset states when video changes
    if (video) {
      // Confirmar que el video está normalizado (no usa snippet)
      console.assert(typeof video.id === 'string', 'YouTubePlayer: video.id debe ser string');
      console.assert(typeof video.title === 'string', 'YouTubePlayer: video.title debe ser string');
      setIsLoading(true);
      setError(null);
      setPlayerReady(false);
    }
  }, [video]);

  if (!video) {
    return (
      <div className={`youtube-player ${className}`}>
        <div className="youtube-player-placeholder">
          <div className="placeholder-icon">▶</div>
          <h3>Selecciona un video para reproducir</h3>
          <p>Haz clic en cualquier video de la lista para comenzar a ver.</p>
        </div>
      </div>
    );
  }

  const videoId = video.id?.videoId || video.id;

  if (!videoId) {
    return (
      <div className={`youtube-player ${className}`}>
        <div className="youtube-player-error">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar el video</h3>
          <p>ID de video no válido</p>
        </div>
      </div>
    );
  }

  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: autoplay ? 1 : 0,
      controls: 1,
      rel: 0, // No mostrar videos relacionados al final
      showinfo: 1,
      modestbranding: 1,
      iv_load_policy: 3, // Ocultar anotaciones
      fs: 1, // Permitir pantalla completa
      cc_load_policy: 0, // No cargar subtítulos automáticamente
      disablekb: 0, // Habilitar controles de teclado
      playsinline: 1, // Reproducción inline en móviles
      origin: window.location.origin, // Para evitar errores de CORS
    },
  };

  const handleReady = (event) => {
    console.log('🎥 YouTube Player ready:', videoId);
    setIsLoading(false);
    setPlayerReady(true);

    if (onReady) {
      onReady(event);
    }
  };

  const handleError = (error) => {
    console.error('❌ Error en YouTube Player:', error);
    setIsLoading(false);
    setError('Error al cargar el video. Inténtalo de nuevo.');

    if (onError) {
      onError(error);
    }
  };

  const handleStateChange = (event) => {
    // Estados posibles: -1 (no empezado), 0 (terminado), 1 (reproduciendo), 2 (pausado), 3 (buffering), 5 (en cola)
    console.log('📺 Estado del reproductor cambió:', event.data);

    if (onStateChange) {
      onStateChange(event);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Forzar re-render del componente YouTube
    setPlayerReady(false);
    setTimeout(() => setPlayerReady(true), 100);
  };

  return (
    <div className={`youtube-player ${className}`}>
      {/* Header con información del video */}
      <div className="youtube-player-header">
        <h3 className="video-title">
          {video.title || 'Reproduciendo video'}
        </h3>
        <p className="video-channel">
          {video.channelTitle || 'Canal desconocido'}
        </p>
      </div>

      {/* Contenedor del reproductor */}
      <div className="youtube-player-container">
        {isLoading && (
          <div className="youtube-player-loading">
            <div className="loading-spinner"></div>
            <p>Cargando video...</p>
          </div>
        )}

        {error ? (
          <div className="youtube-player-error">
            <div className="error-icon">⚠️</div>
            <h4>Error al cargar el video</h4>
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-button">
              Reintentar
            </button>
          </div>
        ) : (
          playerReady && (
            <YouTube
              key={videoId} // Force re-render when video changes
              videoId={videoId}
              opts={opts}
              onReady={handleReady}
              onError={handleError}
              onStateChange={handleStateChange}
              className="youtube-iframe"
            />
          )
        )}
      </div>

      {/* Información adicional del video */}
      <div className="youtube-player-info">
        {/* Estadísticas */}
        {showStats && video.statistics && (
          <div className="video-stats">
            <div className="stat-item">
              <span className="stat-icon">👁</span>
              <span className="stat-value">
                {formatViewCount(video.statistics.viewCount)}
              </span>
              <span className="stat-label">vistas</span>
            </div>

            {video.statistics.likeCount && (
              <div className="stat-item">
                <span className="stat-icon">👍</span>
                <span className="stat-value">
                  {formatViewCount(video.statistics.likeCount)}
                </span>
                <span className="stat-label">likes</span>
              </div>
            )}

            {video.statistics.commentCount && (
              <div className="stat-item">
                <span className="stat-icon">💬</span>
                <span className="stat-value">
                  {formatViewCount(video.statistics.commentCount)}
                </span>
                <span className="stat-label">comentarios</span>
              </div>
            )}
          </div>
        )}

        {/* Fecha de publicación */}
        <div className="video-published">
          <span className="published-icon">📅</span>
          <span className="published-text">
            Publicado: {formatPublishedDate(video.publishedAt)}
          </span>
        </div>

        {/* Descripción */}
        {showDescription && video.description && (
          <div className="video-description">
            <h4>Descripción</h4>
            <p>{video.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubePlayer;