import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

const AudioPlayer = ({ song, onClose, onNext, onPrevious, hasNext, hasPrevious }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (song) {
      loadSong();
    }
  }, [song]);

  const loadSong = async () => {
    if (!song) return;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);

    try {
      // Intentar cargar desde diferentes fuentes
      let audioSrc = null;

      // 1. Preview URL directo
      if (song.previewUrl) {
        audioSrc = song.previewUrl;
      }
      // 2. Spotify preview (si tenemos ID)
      else if (song.spotifyId) {
        audioSrc = `https://p.scdn.co/mp3-preview/${song.spotifyId}`;
      }
      // 3. YouTube audio (esto requeriría una API adicional)
      else if (song.youtubeId) {
        // Para YouTube necesitaríamos una API como ytdl o similar
        // Por ahora, mostramos un mensaje
        console.log('YouTube preview no disponible sin API adicional');
      }

      if (audioSrc && audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.load();
      } else {
        // Simular reproducción para demo
        console.log(`Simulando reproducción de: ${song.title}`);
        setDuration(30); // 30 segundos por defecto
      }
    } catch (error) {
      console.error('Error loading song:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    } else {
      // Simulación para demo
      setIsPlaying(!isPlaying);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    } else {
      // Simulación
      if (isPlaying) {
        setCurrentTime(prev => Math.min(prev + 1, duration));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const newTime = (e.target.value / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="audio-player">
        <div className="player-header">
          <div className="song-info">
            <h3>{song?.title}</h3>
            <p>{song?.album?.title || 'Desconocido'}</p>
          </div>
          <button onClick={onClose} className="close-player">✕</button>
        </div>

        <div className="player-body">
          <div className="album-art">
            {song?.album?.coverImage ? (
              <img src={song.album.coverImage} alt="Album cover" />
            ) : (
              <div className="no-art">
                <span>🎵</span>
              </div>
            )}
          </div>

          <div className="player-controls">
            <div className="progress-container">
              <span className="time">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={handleSeek}
                className="progress-bar"
              />
              <span className="time">{formatTime(duration)}</span>
            </div>

            <div className="control-buttons">
              <button
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="control-btn"
              >
                ⏮️
              </button>

              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="play-btn"
              >
                {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
              </button>

              <button
                onClick={onNext}
                disabled={!hasNext}
                className="control-btn"
              >
                ⏭️
              </button>
            </div>

            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            if (hasNext) onNext();
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;