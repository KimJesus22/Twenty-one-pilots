import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon
} from 'react-share';
import { formatViewCount, formatPublishedDate } from '../api/videos';
import VideoComments from './VideoComments';
import './VideoPlayer.css';

const VideoPlayer = ({ video, currentUser, onNext, onPrevious, hasNext, hasPrevious }) => {
  const playerRef = useRef(null);

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Solo si el foco no está en un input o textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (playerRef.current) {
            const state = playerRef.current.getPlayerState();
            if (state === 1) { // Reproduciendo
              playerRef.current.pauseVideo();
            } else {
              playerRef.current.playVideo();
            }
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (hasNext && onNext) {
            onNext();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (hasPrevious && onPrevious) {
            onPrevious();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrevious, onNext, onPrevious]);

  // Función helper para normalizar el acceso a propiedades del video
  const getVideoProperty = (video, propertyPath) => {
    if (!video) return null;

    // Caso 1: Video de búsqueda (tiene propiedades directamente)
    const directValue = propertyPath.split('.').reduce((obj, key) => obj?.[key], video);
    if (directValue) return directValue;

    // Caso 2: Video específico (viene de items[0])
    const itemsValue = propertyPath.split('.').reduce((obj, key) => obj?.[key], video.items?.[0]);
    if (itemsValue) return itemsValue;

    return null;
  };

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

  const videoId = getVideoProperty(video, 'id.videoId') || getVideoProperty(video, 'id') || video.id;
  const videoTitle = getVideoProperty(video, 'title') || getVideoProperty(video, 'snippet.title') || 'Video de Twenty One Pilots';
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const shareTitle = `Mira este video: ${videoTitle}`;

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
    playerRef.current = event.target;
  };

  const onError = (error) => {
    console.error('Error en el reproductor de YouTube:', error);
  };

  const onStateChange = (_event) => {
    // Estados posibles: -1 (no empezado), 0 (terminado), 1 (reproduciendo), 2 (pausado), 3 (buffering), 5 (en cola)
  };

  return (
    <div className="video-player">
      <div className="video-player-header">
        <h3>{getVideoProperty(video, 'title') || getVideoProperty(video, 'snippet.title') || 'Reproduciendo video'}</h3>
        <p className="video-channel">{getVideoProperty(video, 'channelTitle') || getVideoProperty(video, 'snippet.channelTitle') || 'Canal desconocido'}</p>
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
          {getVideoProperty(video, 'description') || getVideoProperty(video, 'snippet.description') || 'Sin descripción disponible.'}
        </p>

        {(getVideoProperty(video, 'statistics') || getVideoProperty(video, 'items.0.statistics')) && (
          <div className="video-stats">
            <span>👁 {formatViewCount(getVideoProperty(video, 'statistics.viewCount') || getVideoProperty(video, 'items.0.statistics.viewCount'))} vistas</span>
            <span>👍 {formatViewCount(getVideoProperty(video, 'statistics.likeCount') || getVideoProperty(video, 'items.0.statistics.likeCount'))} likes</span>
            {(getVideoProperty(video, 'statistics.commentCount') || getVideoProperty(video, 'items.0.statistics.commentCount')) && (
              <span>💬 {formatViewCount(getVideoProperty(video, 'statistics.commentCount') || getVideoProperty(video, 'items.0.statistics.commentCount'))} comentarios</span>
            )}
          </div>
        )}

        {/* Botones de compartir */}
        <div className="video-share">
          <h4>Compartir este video:</h4>
          <div className="share-buttons">
            <FacebookShareButton url={videoUrl} quote={shareTitle}>
              <FacebookIcon size={32} round />
            </FacebookShareButton>

            <TwitterShareButton url={videoUrl} title={shareTitle}>
              <TwitterIcon size={32} round />
            </TwitterShareButton>

            <WhatsappShareButton url={videoUrl} title={shareTitle}>
              <WhatsappIcon size={32} round />
            </WhatsappShareButton>
          </div>
        </div>

        <div className="video-published">
          <span>
            📅 Publicado: {formatPublishedDate(getVideoProperty(video, 'publishedAt') || getVideoProperty(video, 'snippet.publishedAt') || getVideoProperty(video, 'items.0.snippet.publishedAt'))}
          </span>
        </div>
      </div>

      {/* Comentarios del video */}
      <VideoComments
        videoId={videoId}
        currentUser={currentUser}
      />
    </div>
  );
};

export default VideoPlayer;