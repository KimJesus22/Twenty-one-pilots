import React, { useState } from 'react';
import YouTubePlayer from './YouTubePlayer';

// Ejemplo de uso del componente YouTubePlayer
const YouTubePlayerExample = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [autoplay, setAutoplay] = useState(false);

  // Datos de ejemplo de videos de Twenty One Pilots
  const sampleVideos = [
    {
      id: { videoId: 'UprcpdwuwCg' },
      snippet: {
        title: 'Twenty One Pilots - Stressed Out [Official Video]',
        description: 'Official music video for "Stressed Out" by Twenty One Pilots. From the album Blurryface. Available now on Fueled By Ramen.',
        channelTitle: 'Fueled By Ramen',
        publishedAt: '2016-04-27T16:00:00Z',
        thumbnails: {
          medium: { url: 'https://img.youtube.com/vi/UprcpdwuwCg/mqdefault.jpg' }
        }
      },
      statistics: {
        viewCount: '1500000000',
        likeCount: '12000000',
        commentCount: '500000'
      }
    },
    {
      id: { videoId: 'hTWKbfoikeg' },
      snippet: {
        title: 'Twenty One Pilots - Heathens (from Suicide Squad: The Album) [OFFICIAL VIDEO]',
        description: 'Twenty One Pilots - Heathens (from Suicide Squad: The Album) [OFFICIAL VIDEO]',
        channelTitle: 'Atlantic Records',
        publishedAt: '2016-06-21T16:00:00Z',
        thumbnails: {
          medium: { url: 'https://img.youtube.com/vi/hTWKbfoikeg/mqdefault.jpg' }
        }
      },
      statistics: {
        viewCount: '2000000000',
        likeCount: '15000000',
        commentCount: '800000'
      }
    },
    {
      id: { videoId: 'eJnQBXmZ7Ek' },
      snippet: {
        title: 'Twenty One Pilots - Ride [Official Video]',
        description: 'Official music video for "Ride" by Twenty One Pilots. From the album Blurryface.',
        channelTitle: 'Fueled By Ramen',
        publishedAt: '2016-05-14T16:00:00Z',
        thumbnails: {
          medium: { url: 'https://img.youtube.com/vi/eJnQBXmZ7Ek/mqdefault.jpg' }
        }
      },
      statistics: {
        viewCount: '800000000',
        likeCount: '8000000',
        commentCount: '300000'
      }
    }
  ];

  const handleVideoSelect = (video) => {
    console.log('Video seleccionado:', video.snippet.title);
    setSelectedVideo(video);
  };

  const handlePlayerReady = (event) => {
    console.log('🎥 YouTube Player está listo');
  };

  const handlePlayerError = (error) => {
    console.error('❌ Error en YouTube Player:', error);
  };

  const handlePlayerStateChange = (event) => {
    const states = {
      '-1': 'No empezado',
      '0': 'Terminado',
      '1': 'Reproduciendo',
      '2': 'Pausado',
      '3': 'Buffering',
      '5': 'En cola'
    };
    console.log('📺 Estado del reproductor:', states[event.data] || event.data);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#ff6b6b', marginBottom: '2rem', textAlign: 'center' }}>
        🎵 YouTubePlayer Component Demo
      </h1>

      {/* Controles de ejemplo */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <h3 style={{ margin: '0', color: '#333' }}>Controles de Prueba:</h3>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
          />
          Autoplay
        </label>

        <button
          onClick={() => setSelectedVideo(null)}
          style={{
            padding: '0.5rem 1rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Limpiar Video
        </button>
      </div>

      {/* Reproductor principal */}
      <YouTubePlayer
        video={selectedVideo}
        onReady={handlePlayerReady}
        onError={handlePlayerError}
        onStateChange={handlePlayerStateChange}
        autoplay={autoplay}
        className="main-player"
      />

      {/* Lista de videos para seleccionar */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#333', marginBottom: '1rem' }}>
          🎶 Selecciona un Video:
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {sampleVideos.map((video) => (
            <div
              key={video.id.videoId}
              onClick={() => handleVideoSelect(video)}
              style={{
                padding: '1rem',
                border: selectedVideo?.id?.videoId === video.id.videoId
                  ? '2px solid #ff6b6b'
                  : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedVideo?.id?.videoId === video.id.videoId
                  ? 'rgba(255, 107, 107, 0.05)'
                  : 'white',
                transition: 'all 0.3s ease',
                boxShadow: selectedVideo?.id?.videoId === video.id.videoId
                  ? '0 4px 12px rgba(255, 107, 107, 0.2)'
                  : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <img
                src={video.snippet.thumbnails.medium.url}
                alt={video.snippet.title}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  marginBottom: '0.5rem'
                }}
              />
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1rem',
                color: '#333',
                lineHeight: '1.3'
              }}>
                {video.snippet.title}
              </h4>
              <p style={{
                margin: '0',
                fontSize: '0.9rem',
                color: '#666'
              }}>
                {video.snippet.channelTitle}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      <div style={{
        marginTop: '3rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '12px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ color: '#333', marginBottom: '1rem' }}>
          📋 Información del Componente YouTubePlayer
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ color: '#ff6b6b', marginBottom: '0.5rem' }}>🎯 Características:</h4>
            <ul style={{ color: '#555', lineHeight: '1.6' }}>
              <li>Integración completa con react-youtube</li>
              <li>Manejo robusto de errores y estados de carga</li>
              <li>Estadísticas formateadas (vistas, likes, comentarios)</li>
              <li>Fechas de publicación localizadas</li>
              <li>Diseño responsivo y moderno</li>
              <li>Tema Twenty One Pilots integrado</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ff6b6b', marginBottom: '0.5rem' }}>⚙️ Props Disponibles:</h4>
            <ul style={{ color: '#555', lineHeight: '1.6' }}>
              <li><code>video</code>: Objeto con datos del video</li>
              <li><code>onReady</code>: Callback cuando el player está listo</li>
              <li><code>onError</code>: Callback para errores</li>
              <li><code>onStateChange</code>: Callback para cambios de estado</li>
              <li><code>autoplay</code>: Reproducción automática</li>
              <li><code>className</code>: Clases CSS adicionales</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ff6b6b', marginBottom: '0.5rem' }}>🎨 Estados Soportados:</h4>
            <ul style={{ color: '#555', lineHeight: '1.6' }}>
              <li>Placeholder cuando no hay video</li>
              <li>Estados de carga con spinner</li>
              <li>Manejo de errores con retry</li>
              <li>Estados de reproducción (playing, paused, etc.)</li>
              <li>Responsive en móviles y tablets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayerExample;