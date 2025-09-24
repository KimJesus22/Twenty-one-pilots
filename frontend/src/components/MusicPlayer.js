import React, { useState, useEffect, useRef } from 'react';
import './MusicPlayer.css';

const MusicPlayer = ({
  music,
  autoPlay = false,
  showControls = true,
  compact = false,
  onPlay,
  onPause,
  onTrackChange
}) => {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const playerRef = useRef(null);
  const progressRef = useRef(null);

  // Efecto para manejar autoplay
  useEffect(() => {
    if (autoPlay && music && music.length > 0) {
      playTrack(0);
    }
  }, [autoPlay, music]);

  // Función para reproducir una pista
  const playTrack = async (index) => {
    if (!music || !music[index]) return;

    setIsLoading(true);
    setCurrentTrack(index);

    try {
      // Registrar reproducción en el backend
      await fetch(`/api/musicMerch/music/${music[index]._id}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: getPlatformFromTrack(music[index])
        })
      });

      setIsPlaying(true);
      onPlay && onPlay(music[index]);
    } catch (error) {
      console.error('Error tracking play:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para pausar
  const pauseTrack = () => {
    setIsPlaying(false);
    onPause && onPause(music[currentTrack]);
  };

  // Función para siguiente pista
  const nextTrack = () => {
    const nextIndex = (currentTrack + 1) % music.length;
    playTrack(nextIndex);
    onTrackChange && onTrackChange(music[nextIndex]);
  };

  // Función para pista anterior
  const prevTrack = () => {
    const prevIndex = currentTrack === 0 ? music.length - 1 : currentTrack - 1;
    playTrack(prevIndex);
    onTrackChange && onTrackChange(music[prevIndex]);
  };

  // Función para cambiar volumen
  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Función para toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Función para obtener plataforma de una pista
  const getPlatformFromTrack = (track) => {
    if (track.platforms?.spotify?.url) return 'spotify';
    if (track.platforms?.youtube?.url) return 'youtube';
    if (track.platforms?.appleMusic?.url) return 'apple';
    if (track.platforms?.deezer?.url) return 'deezer';
    if (track.platforms?.soundcloud?.url) return 'soundcloud';
    return 'unknown';
  };

  // Función para obtener URL de embed
  const getEmbedUrl = (track) => {
    return track.getPrimaryEmbedUrl ? track.getPrimaryEmbedUrl() : track.platforms?.spotify?.embedUrl;
  };

  // Función para obtener URL de reproducción externa
  const getPlayUrl = (track) => {
    return track.getPrimaryPlayUrl ? track.getPrimaryPlayUrl() : track.platforms?.spotify?.url;
  };

  // Función para formatear tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para manejar progreso
  const handleProgressClick = (e) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    setCurrentTime(newTime);
    // Aquí iría la lógica para actualizar el reproductor real
  };

  if (!music || music.length === 0) {
    return (
      <div className={`music-player ${compact ? 'compact' : ''}`}>
        <div className="no-music">
          <p>No hay música disponible para este evento</p>
        </div>
      </div>
    );
  }

  const currentMusic = music[currentTrack];

  if (compact) {
    return (
      <div className="music-player compact">
        <div className="compact-player">
          <div className="track-info">
            <img
              src={currentMusic.artwork?.url || '/images/default-album.jpg'}
              alt={currentMusic.title}
              className="album-art-small"
            />
            <div className="track-details">
              <div className="track-title">{currentMusic.title}</div>
              <div className="track-artist">{currentMusic.artist}</div>
            </div>
          </div>

          <div className="compact-controls">
            <button
              className="control-btn prev"
              onClick={prevTrack}
              disabled={music.length <= 1}
            >
              ⏮️
            </button>

            <button
              className="control-btn play-pause"
              onClick={isPlaying ? pauseTrack : () => playTrack(currentTrack)}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
            </button>

            <button
              className="control-btn next"
              onClick={nextTrack}
              disabled={music.length <= 1}
            >
              ⏭️
            </button>
          </div>

          <div className="external-links">
            {getPlayUrl(currentMusic) && (
              <a
                href={getPlayUrl(currentMusic)}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                🎵
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="music-player">
      <div className="player-header">
        <h3>🎵 Música del Evento</h3>
        <div className="track-counter">
          {currentTrack + 1} de {music.length}
        </div>
      </div>

      <div className="current-track">
        <div className="album-art">
          <img
            src={currentMusic.artwork?.url || '/images/default-album.jpg'}
            alt={currentMusic.title}
            className="album-art-large"
          />
          {currentMusic.isExclusive && (
            <div className="exclusive-badge">⭐ EXCLUSIVO</div>
          )}
        </div>

        <div className="track-info">
          <h4 className="track-title">{currentMusic.title}</h4>
          <p className="track-artist">{currentMusic.artist}</p>
          {currentMusic.album && (
            <p className="track-album">{currentMusic.album}</p>
          )}

          <div className="track-meta">
            {currentMusic.metadata?.duration && (
              <span className="duration">
                {formatTime(currentMusic.metadata.duration)}
              </span>
            )}
            {currentMusic.type && (
              <span className="track-type">{currentMusic.type}</span>
            )}
          </div>

          <div className="track-stats">
            <span className="plays">🎧 {currentMusic.stats?.plays || 0}</span>
            <span className="likes">❤️ {currentMusic.stats?.likes || 0}</span>
          </div>
        </div>
      </div>

      {showControls && (
        <div className="player-controls">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
            <div
              className="progress-background"
              ref={progressRef}
              onClick={handleProgressClick}
            ></div>
          </div>

          <div className="control-buttons">
            <button
              className="control-btn shuffle"
              onClick={() => {
                const randomIndex = Math.floor(Math.random() * music.length);
                playTrack(randomIndex);
              }}
            >
              🔀
            </button>

            <button
              className="control-btn prev"
              onClick={prevTrack}
              disabled={music.length <= 1}
            >
              ⏮️
            </button>

            <button
              className="control-btn play-pause main"
              onClick={isPlaying ? pauseTrack : () => playTrack(currentTrack)}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
            </button>

            <button
              className="control-btn next"
              onClick={nextTrack}
              disabled={music.length <= 1}
            >
              ⏭️
            </button>

            <button
              className="control-btn repeat"
              onClick={() => playTrack(currentTrack)} // Implementar modo repeat
            >
              🔁
            </button>
          </div>

          <div className="volume-controls">
            <button
              className="volume-btn"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? '🔇' : volume < 0.3 ? '🔈' : volume < 0.7 ? '🔉' : '🔊'}
            </button>

            <div className="volume-slider">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="volume-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Embed Player */}
      {getEmbedUrl(currentMusic) && (
        <div className="embed-player">
          <iframe
            src={getEmbedUrl(currentMusic)}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`Reproductor de ${currentMusic.title}`}
          ></iframe>
        </div>
      )}

      {/* External Platform Links */}
      <div className="platform-links">
        {currentMusic.platforms?.spotify?.url && (
          <a
            href={currentMusic.platforms.spotify.url}
            target="_blank"
            rel="noopener noreferrer"
            className="platform-link spotify"
          >
            🎵 Spotify
          </a>
        )}

        {currentMusic.platforms?.youtube?.url && (
          <a
            href={currentMusic.platforms.youtube.url}
            target="_blank"
            rel="noopener noreferrer"
            className="platform-link youtube"
          >
            📺 YouTube
          </a>
        )}

        {currentMusic.platforms?.appleMusic?.url && (
          <a
            href={currentMusic.platforms.appleMusic.url}
            target="_blank"
            rel="noopener noreferrer"
            className="platform-link apple"
          >
            🍎 Apple Music
          </a>
        )}

        {currentMusic.platforms?.deezer?.url && (
          <a
            href={currentMusic.platforms.deezer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="platform-link deezer"
          >
            🎧 Deezer
          </a>
        )}
      </div>

      {/* Playlist */}
      <div className="playlist">
        <h4>Playlist del Evento</h4>
        <div className="playlist-tracks">
          {music.map((track, index) => (
            <div
              key={track._id}
              className={`playlist-track ${index === currentTrack ? 'active' : ''}`}
              onClick={() => playTrack(index)}
            >
              <div className="track-number">
                {index === currentTrack && isPlaying ? '🎵' : index + 1}
              </div>

              <div className="track-thumbnail">
                <img
                  src={track.artwork?.thumbnail || track.artwork?.url || '/images/default-album.jpg'}
                  alt={track.title}
                />
              </div>

              <div className="track-info">
                <div className="track-title">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>

              <div className="track-duration">
                {track.metadata?.duration ? formatTime(track.metadata.duration) : '--:--'}
              </div>

              <div className="track-actions">
                <button
                  className="like-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Implementar toggle like
                  }}
                >
                  ❤️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;