import React from 'react';
import YouTube from 'react-youtube';
import { formatViewCount, formatPublishedDate } from '../api/videos';
import './VideoPlayer.css';

const VideoPlayer = ({ video }) => {
  if (!video) {
    return (
      <div className="video-player">
        <div className="no-video">
          <h3>Selecciona un video para reproducir</h3>
          <p>Haz clic en cualquier video de la lista para comenzar a ver.</p>
        </div>
      </div>
    );
  }

  const videoId = video.id?.videoId || video.id;

  const opts = {
    height: '390',
    width: '640',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0, // No autoplay por defecto
      controls: 1, // Mostrar controles
      rel: 0, // No mostrar videos relacionados al final
      showinfo: 1, // Mostrar información del video
      modestbranding: 1, // Branding mínimo
      iv_load_policy: 3, // Ocultar anotaciones
      fs: 1, // Permitir pantalla completa
      cc_load_policy: 0, // No cargar subtítulos automáticamente
      disablekb: 0, // Habilitar controles de teclado
    },
  };

  const onReady = (event) => {
    // El reproductor está listo
    console.log('Video player ready:', videoId);
  };

  const onError = (error) => {
    console.error('Error en el reproductor de YouTube:', error);
  };

  const onStateChange = (event) => {
    // Estados posibles: -1 (no empezado), 0 (terminado), 1 (reproduciendo), 2 (pausado), 3 (buffering), 5 (en cola)
    console.log('Estado del reproductor cambió:', event.data);
  };

  return (
    <div className="video-player">
      <div className="video-player-header">
        <h3>{video.snippet?.title || 'Reproduciendo video'}</h3>
        <p className="video-channel">{video.snippet?.channelTitle || 'Canal desconocido'}</p>
      </div>

      <div className="video-player-container">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onError={onError}
          onStateChange={onStateChange}
        />
      </div>

      <div className="video-player-info">
        <p className="video-description">
          {video.snippet?.description || 'Sin descripción disponible.'}
        </p>

        {video.statistics && (
          <div className="video-stats">
            <span>👁 {formatViewCount(video.statistics.viewCount)} vistas</span>
            <span>👍 {formatViewCount(video.statistics.likeCount)} likes</span>
            {video.statistics.commentCount && (
              <span>💬 {formatViewCount(video.statistics.commentCount)} comentarios</span>
            )}
          </div>
        )}

        <div className="video-published">
          <span>
            📅 Publicado: {formatPublishedDate(video.snippet?.publishedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;