import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import './SongPreview.css';

const SongPreview = ({ song, onPlayStateChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const { handleError } = useErrorHandler();

  // Verificar si la canción tiene preview disponible
  useEffect(() => {
    const checkPreviewAvailability = () => {
      // Verificar si tiene URLs válidas (no las URLs mock problemáticas)
      const hasValidPreview = song?.previewUrl && !song.previewUrl.includes('8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c');
      // Verificar IDs de Spotify válidos (no los IDs mock que empiezan con números específicos)
      const hasValidSpotifyId = song?.spotifyId &&
                               song.spotifyId.length > 10 &&
                               !song.spotifyId.startsWith('3CRDb') &&
                               !song.spotifyId.startsWith('2Z8Wu') &&
                               !song.spotifyId.startsWith('5LyRt');

      if (hasValidPreview || hasValidSpotifyId) {
        setHasPreview(true);
        setError(null);
      } else {
        setHasPreview(false);
        setError('Preview no disponible');
      }
    };

    checkPreviewAvailability();
  }, [song]);

  // Limpiar estado cuando cambia la canción
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  }, [song?._id]);

  const getAudioSrc = useCallback(() => {
    if (song?.previewUrl) {
      // Verificar si es una URL mock inválida
      if (song.previewUrl.includes('8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c')) {
        return null;
      }
      return song.previewUrl;
    }
    if (song?.spotifyId && song.spotifyId.length > 10 &&
        !song.spotifyId.startsWith('3CRDb') &&
        !song.spotifyId.startsWith('2Z8Wu') &&
        !song.spotifyId.startsWith('5LyRt')) {
      return `https://p.scdn.co/mp3-preview/${song.spotifyId}`;
    }
    return null;
  }, [song]);

  const handlePlay = useCallback(async () => {
    if (!hasPreview) return;

    try {
      setIsLoading(true);
      setError(null);

      // Notificar al componente padre sobre el cambio de estado
      if (onPlayStateChange) {
        onPlayStateChange(song._id, 'loading');
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'none';

        audioRef.current.addEventListener('canplaythrough', () => {
          setIsLoading(false);
          if (onPlayStateChange) {
            onPlayStateChange(song._id, 'ready');
          }
        });

        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          if (onPlayStateChange) {
            onPlayStateChange(song._id, 'ended');
          }
        });

        audioRef.current.addEventListener('error', (e) => {
          // Solo log errores no relacionados con CORS
          const errorMessage = e.target?.error?.message || '';
          if (!errorMessage.includes('CORS') && !errorMessage.includes('OpaqueResponseBlocking')) {
            console.error('Audio error:', e);
          }
          setIsLoading(false);
          setIsPlaying(false);
          setError('Error de reproducción');
          // No usar handleError para errores de audio comunes para evitar spam
          if (onPlayStateChange) {
            onPlayStateChange(song._id, 'error');
          }
        });
      }

      const audioSrc = getAudioSrc();
      if (audioSrc && audioRef.current.src !== audioSrc) {
        audioRef.current.src = audioSrc;
        audioRef.current.load();
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (onPlayStateChange) {
          onPlayStateChange(song._id, 'paused');
        }
      } else {
        // Pausar otros previews antes de reproducir este
        const allAudios = document.querySelectorAll('audio');
        allAudios.forEach(audio => {
          if (audio !== audioRef.current) {
            audio.pause();
          }
        });

        await audioRef.current.play();
        setIsPlaying(true);
        if (onPlayStateChange) {
          onPlayStateChange(song._id, 'playing');
        }
      }
    } catch (err) {
      // Solo log errores no relacionados con URLs inválidas
      const errorMessage = err.message || '';
      if (!errorMessage.includes('media resource') && !errorMessage.includes('CORS')) {
        console.error('Error playing preview:', err);
      }
      setIsLoading(false);
      setError('Error de reproducción');
      // No usar handleError para errores comunes de audio
      if (onPlayStateChange) {
        onPlayStateChange(song._id, 'error');
      }
    }
  }, [song, hasPreview, isPlaying, getAudioSrc, handleError, onPlayStateChange]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
    if (onPlayStateChange) {
      onPlayStateChange(song._id, 'stopped');
    }
  }, [song, onPlayStateChange]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  if (!song) return null;

  return (
    <div className="song-preview">
      {hasPreview ? (
        <div className="preview-controls">
          <button
            className={`preview-btn ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={handlePlay}
            disabled={isLoading}
            aria-label={isPlaying ? 'Pausar preview' : 'Reproducir preview'}
            title={isPlaying ? 'Pausar preview' : 'Reproducir preview'}
          >
            {isLoading ? (
              <span className="loading-spinner">⏳</span>
            ) : isPlaying ? (
              <span className="pause-icon">⏸️</span>
            ) : (
              <span className="play-icon">▶️</span>
            )}
          </button>

          {isPlaying && (
            <button
              className="stop-btn"
              onClick={handleStop}
              aria-label="Detener preview"
              title="Detener preview"
            >
              ⏹️
            </button>
          )}
        </div>
      ) : (
        <div className="preview-unavailable">
          <span className="no-preview-icon" title="Preview no disponible">🚫</span>
        </div>
      )}

      {error && (
        <div className="preview-error" title={error}>
          ⚠️
        </div>
      )}
    </div>
  );
};

export default SongPreview;