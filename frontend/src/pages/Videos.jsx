import React, { useState, useEffect, useCallback, useRef } from 'react';
import YouTubePlayer from '../components/YouTubePlayer';
import { searchVideos, getPopularVideos, formatViewCount, formatPublishedDate, normalizeVideo } from '../api/videos';
import { filterValidVideos, findFirstValidVideo, canSelectVideo } from '../utils/videoGuards';
import './Videos.css';

/**
 * Invariant para verificar que un video esté normalizado
 */
function assertNormalized(video, context) {
  if (!video) {
    console.warn(`⚠️ Video nulo en ${context}`);
    return;
  }
  if (typeof video !== 'object') {
    console.error(`❌ Video no es objeto en ${context}:`, video);
    throw new Error(`Video no es objeto en ${context}`);
  }
  if (typeof video.id !== 'string') {
    console.error(`❌ Video.id no es string en ${context}:`, video);
    throw new Error(`Video.id no es string en ${context}`);
  }
  if (typeof video.title !== 'string') {
    console.error(`❌ Video.title no es string en ${context}:`, video);
    throw new Error(`Video.title no es string en ${context}`);
  }
}


const Videos = () => {
  // Estados principales
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Guard para evitar doble carga en StrictMode (desarrollo)
  const hasLoadedRef = useRef(false);

  // Traba para evitar múltiples selecciones iniciales
  const hasSelectedInitialRef = useRef(false);

  // Estados de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('Twenty One Pilots');
  const [searchInput, setSearchInput] = useState('Twenty One Pilots');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Estados de configuración
  const [autoplay, setAutoplay] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showDescription, setShowDescription] = useState(true);

  // Cargar videos iniciales al montar el componente
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadInitialVideos();
    }
  }, []);

  // Invariants temporales: Detectar cualquier violación de títulos válidos
  useEffect(() => {
    if (selectedVideo) {
      if (selectedVideo.title === 'Título no disponible' ||
          selectedVideo.title === 'Sin título' ||
          !selectedVideo.title ||
          selectedVideo.title.trim() === '') {
        console.error('❌ INVARIANT VIOLADO: Título inválido en selectedVideo', {
          selectedVideo,
          stack: new Error().stack
        });
        // Temporal: alert para debugging
        alert(`Título inválido detectado: "${selectedVideo.title}"`);
      }
    }
  }, [selectedVideo]);

  // Invariant para videos en lista
  useEffect(() => {
    videos.forEach((video, index) => {
      if (video.title === 'Título no disponible' ||
          video.title === 'Sin título' ||
          !video.title ||
          video.title.trim() === '') {
        console.error('❌ INVARIANT VIOLADO: Título inválido en lista de videos', {
          video,
          index,
          stack: new Error().stack
        });
      }
    });
  }, [videos]);

  /**
   * Carga los videos iniciales (populares de Twenty One Pilots)
   */
  const loadInitialVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎵 Cargando videos iniciales...');

      // Intentar buscar videos específicos de Twenty One Pilots
      const result = await searchVideos(searchQuery, { limit: 12 });

      if (result.data && result.data.length > 0) {
        const validVideos = filterValidVideos(result.data);
        if (validVideos.length > 0) {
          setVideos(validVideos);
          const normalized = normalizeVideo(validVideos[0]);
          assertNormalized(normalized, 'loadInitialVideos');
          setSelectedVideo(normalized); // Seleccionar el primer video válido normalizado
          hasSelectedInitialRef.current = true; // Marcar que ya se seleccionó inicialmente
          setHasNextPage(result.pagination?.hasNextPage || false);
          setHasPrevPage(result.pagination?.hasPrevPage || false);
          console.log(`✅ Cargados ${validVideos.length} videos válidos de ${result.data.length} total`);
        } else {
          console.log('🔄 No se encontraron videos válidos, cargando videos populares...');
          await loadPopularVideos();
        }
      } else {
        // Si no hay resultados, intentar videos populares
        console.log('🔄 No se encontraron videos específicos, cargando videos populares...');
        await loadPopularVideos();
      }
    } catch (err) {
      console.error('❌ Error cargando videos iniciales:', err);
      setError('Error al cargar los videos. Inténtalo de nuevo.');
      await loadFallbackVideos();
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  /**
   * Carga videos populares como respaldo
   */
  const loadPopularVideos = useCallback(async () => {
    try {
      const result = await getPopularVideos({ limit: 12 });
      const validVideos = filterValidVideos(result.data || []);
      setVideos(validVideos);
      if (validVideos.length > 0) {
        const normalized = normalizeVideo(validVideos[0]);
        assertNormalized(normalized, 'loadPopularVideos');
        if (!hasSelectedInitialRef.current) {
          setSelectedVideo(normalized);
          hasSelectedInitialRef.current = true;
        }
        // Siempre actualizar videos disponibles, pero solo seleccionar si no hay selección inicial
      }
    } catch (err) {
      console.error('❌ Error cargando videos populares:', err);
      await loadFallbackVideos();
    }
  }, []);

  /**
   * Carga videos de respaldo cuando falla la API
   */
  const loadFallbackVideos = useCallback(async () => {
    console.log('🔄 Cargando videos de respaldo...');

    // Fallback con datos reales mínimos pero válidos
    const fallbackVideos = [
      {
        id: { videoId: 'UprcpdwuwCg' },
        title: 'Twenty One Pilots - Stressed Out',
        description: 'Video oficial de Twenty One Pilots',
        thumbnail: 'https://img.youtube.com/vi/UprcpdwuwCg/mqdefault.jpg',
        publishedAt: '2016-04-27T16:00:00Z',
        channelTitle: 'Fueled By Ramen'
      },
      {
        id: { videoId: 'hTWKbfoikeg' },
        title: 'Twenty One Pilots - Heathens',
        description: 'Video oficial de Twenty One Pilots',
        thumbnail: 'https://img.youtube.com/vi/hTWKbfoikeg/mqdefault.jpg',
        publishedAt: '2016-06-21T16:00:00Z',
        channelTitle: 'Atlantic Records'
      }
    ];

    const validVideos = filterValidVideos(fallbackVideos);
    setVideos(validVideos);

    if (validVideos.length > 0 && !hasSelectedInitialRef.current) {
      const normalized = normalizeVideo(validVideos[0]);
      assertNormalized(normalized, 'loadFallbackVideos');
      setSelectedVideo(normalized);
      hasSelectedInitialRef.current = true;
    }
  }, []);

  /**
   * Maneja la búsqueda de videos
   */
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();

    const query = searchInput.trim();
    if (!query) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCurrentPage(1);

      console.log('🔍 Buscando videos:', query);

      const result = await searchVideos(query, { limit: 12 });

      if (result.data && result.data.length > 0) {
        const validVideos = filterValidVideos(result.data);
        setVideos(validVideos);
        const normalized = normalizeVideo(validVideos[0]);
        assertNormalized(normalized, 'handleSearch');
        setSelectedVideo(normalized);
        // Nueva búsqueda: permitir reselección
        hasSelectedInitialRef.current = true;
        setHasNextPage(result.pagination?.hasNextPage || false);
        setHasPrevPage(result.pagination?.hasPrevPage || false);
        setSearchQuery(query);
        console.log(`✅ Encontrados ${validVideos.length} videos válidos para "${query}"`);
      } else {
        setError(`No se encontraron videos válidos para "${query}"`);
        setVideos([]);
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error('❌ Error en búsqueda:', err);
      setError('Error al buscar videos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [searchInput]);

  /**
   * Maneja la selección de un video
   */
  const handleVideoSelect = useCallback((video) => {
    if (!canSelectVideo(video)) {
      console.warn('⚠️ Intento de seleccionar video inválido:', video);
      return;
    }

    const normalizedVideo = normalizeVideo(video);
    assertNormalized(normalizedVideo, 'handleVideoSelect');
    console.log('🎬 Video seleccionado:', normalizedVideo.title);
    setSelectedVideo(normalizedVideo);
  }, []);

  /**
   * Maneja el cambio de estado del reproductor de YouTube
   */
  const handlePlayerStateChange = useCallback((event) => {
    const states = {
      '-1': 'No empezado',
      '0': 'Terminado',
      '1': 'Reproduciendo',
      '2': 'Pausado',
      '3': 'Buffering',
      '5': 'En cola'
    };

    console.log('📺 Estado del reproductor:', states[event.data] || event.data);

    // Aquí puedes agregar lógica adicional según el estado
    // Por ejemplo, cargar el siguiente video cuando termine
  }, []);

  /**
   * Maneja errores del reproductor
   */
  const handlePlayerError = useCallback((error) => {
    console.error('❌ Error del reproductor de YouTube:', error);
    setError('Error al reproducir el video. Inténtalo de nuevo.');
  }, []);

  /**
   * Maneja cuando el reproductor está listo
   */
  const handlePlayerReady = useCallback((event) => {
    console.log('✅ Reproductor de YouTube listo');
  }, []);

  /**
   * Reintenta cargar los videos
   */
  const handleRetry = useCallback(() => {
    setError(null);
    loadInitialVideos();
  }, [loadInitialVideos]);

  /**
   * Alterna el autoplay
   */
  const toggleAutoplay = useCallback(() => {
    setAutoplay(prev => !prev);
  }, []);

  return (
    <div className="videos-page">
      {/* Header con título y búsqueda */}
      <div className="videos-header">
        <div className="header-content">
          <h1 className="page-title">
            🎵 Videos de Twenty One Pilots
          </h1>
          <p className="page-subtitle">
            Descubre los mejores videos musicales y contenido oficial de la banda
          </p>
        </div>

        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar videos de Twenty One Pilots..."
              className="search-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="search-button"
              disabled={loading || !searchInput.trim()}
            >
              {loading ? '🔍' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Controles adicionales */}
        <div className="controls-section">
          <label className="control-item">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={toggleAutoplay}
            />
            <span>Reproducción automática</span>
          </label>

          <label className="control-item">
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
            />
            <span>Mostrar estadísticas</span>
          </label>

          <label className="control-item">
            <input
              type="checkbox"
              checked={showDescription}
              onChange={(e) => setShowDescription(e.target.checked)}
            />
            <span>Mostrar descripción</span>
          </label>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button onClick={handleRetry} className="error-retry">
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="videos-content">
        {/* Reproductor de video */}
        <div className="video-player-section">
          <YouTubePlayer
            video={selectedVideo}
            onReady={handlePlayerReady}
            onError={handlePlayerError}
            onStateChange={handlePlayerStateChange}
            autoplay={autoplay}
            showStats={showStats}
            showDescription={showDescription}
            className="main-player"
          />
        </div>

        {/* Lista de videos */}
        <div className="videos-list-section">
          <div className="videos-list-header">
            <h2>Videos Disponibles</h2>
            <span className="videos-count">
              {videos.length} video{videos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading && videos.length === 0 ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Cargando videos...</p>
            </div>
          ) : (
            <div className="videos-grid">
              {videos.map((video) => (
                <div
                  key={video.id?.videoId || video.id}
                  className={`video-card ${
                    selectedVideo?.id === (video.id?.videoId || video.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="video-thumbnail">
                    <img
                      src={video.thumbnail || '/placeholder-video.png'}
                      alt={video.title || 'Video'}
                      loading="lazy"
                    />
                    <div className="play-overlay">
                      <span className="play-icon">▶</span>
                    </div>
                  </div>

                  <div className="video-info">
                    <h3 className="video-title">
                      {video.title || 'Título no disponible'}
                    </h3>

                    <div className="video-meta">
                      <span className="channel-name">
                        {video.channelTitle || 'Canal desconocido'}
                      </span>
                      <span className="publish-date">
                        {formatPublishedDate(video.publishedAt)}
                      </span>
                    </div>

                    {showStats && video.statistics && (
                      <div className="video-stats">
                        <span className="stat-item">
                          👁 {formatViewCount(video.statistics.viewCount)}
                        </span>
                        {video.statistics.likeCount && (
                          <span className="stat-item">
                            👍 {formatViewCount(video.statistics.likeCount)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Controles de paginación */}
          {(hasNextPage || hasPrevPage) && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!hasPrevPage || loading}
                className="pagination-button"
              >
                ← Anterior
              </button>

              <span className="page-indicator">
                Página {currentPage}
              </span>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNextPage || loading}
                className="pagination-button"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="videos-footer">
        <div className="footer-content">
          <p>
            🎸 Explora la discografía completa de Twenty One Pilots en nuestra sección de
            <a href="/discography" className="footer-link"> Discografía</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Videos;