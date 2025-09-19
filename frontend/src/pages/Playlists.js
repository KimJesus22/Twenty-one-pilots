import React, { useEffect, useState } from 'react';
import './Playlists.css';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: true
  });
  const [filter, setFilter] = useState('all'); // all, public, my

  useEffect(() => {
    fetchPlaylists();
  }, [filter]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      // Simular datos por ahora - en producción vendría de la API
      const mockPlaylists = [
        {
          id: 1,
          name: "TOP Hits 2024",
          description: "Las mejores canciones de Twenty One Pilots",
          creator: "fan_admin",
          isPublic: true,
          likes: 245,
          songs: 15,
          duration: "45 min",
          createdAt: "2024-01-15T10:30:00Z",
          coverImage: null,
          tags: ["hits", "2024", "popular"],
          isLiked: false
        },
        {
          id: 2,
          name: "Concert Setlist",
          description: "Playlist perfecta para conciertos",
          creator: "music_lover",
          isPublic: true,
          likes: 189,
          songs: 20,
          duration: "1h 12min",
          createdAt: "2024-01-12T14:20:00Z",
          coverImage: null,
          tags: ["concierto", "setlist", "live"],
          isLiked: true
        },
        {
          id: 3,
          name: "Mi Playlist Privada",
          description: "Canciones favoritas personales",
          creator: "usuario_actual",
          isPublic: false,
          likes: 0,
          songs: 8,
          duration: "28 min",
          createdAt: "2024-01-10T09:15:00Z",
          coverImage: null,
          tags: ["personal", "favoritas"],
          isLiked: false
        },
        {
          id: 4,
          name: "Colaborativa TOP",
          description: "Playlist creada por la comunidad",
          creator: "comunidad",
          isPublic: true,
          likes: 567,
          songs: 32,
          duration: "2h 15min",
          createdAt: "2024-01-08T16:45:00Z",
          coverImage: null,
          tags: ["colaborativa", "comunidad", "diversa"],
          isLiked: true
        }
      ];

      let filteredPlaylists = mockPlaylists;

      if (filter === 'public') {
        filteredPlaylists = mockPlaylists.filter(p => p.isPublic);
      } else if (filter === 'my') {
        filteredPlaylists = mockPlaylists.filter(p => p.creator === 'usuario_actual');
      }

      setPlaylists(filteredPlaylists);
      setError(null);
    } catch (err) {
      console.error('Error cargando playlists:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();

    if (!newPlaylist.name.trim()) {
      alert('Por favor ingresa un nombre para la playlist');
      return;
    }

    try {
      // Simular creación de playlist - en producción iría a la API
      const newPlaylistData = {
        id: Date.now(),
        ...newPlaylist,
        creator: 'usuario_actual',
        likes: 0,
        songs: 0,
        duration: "0 min",
        createdAt: new Date().toISOString(),
        tags: [],
        isLiked: false
      };

      setPlaylists(prev => [newPlaylistData, ...prev]);
      setNewPlaylist({ name: '', description: '', isPublic: true });
      setShowCreateForm(false);

      alert('¡Playlist creada exitosamente!');
    } catch (err) {
      console.error('Error creando playlist:', err);
      alert('Error al crear la playlist. Inténtalo de nuevo.');
    }
  };

  const handleLike = async (playlistId) => {
    try {
      // Simular toggle de like - en producción iría a la API
      setPlaylists(prev => prev.map(playlist =>
        playlist.id === playlistId
          ? {
              ...playlist,
              isLiked: !playlist.isLiked,
              likes: playlist.isLiked ? playlist.likes - 1 : playlist.likes + 1
            }
          : playlist
      ));
    } catch (err) {
      console.error('Error al dar like:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  if (loading) {
    return (
      <div className="playlists">
        <div className="loading">Cargando playlists...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlists">
        <div className="error">
          <h2>Error al cargar las playlists</h2>
          <p>{error}</p>
          <button onClick={fetchPlaylists} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="playlists">
      <div className="playlists-header">
        <div className="header-content">
          <h1>Playlists</h1>
          <p>Descubre y crea playlists de Twenty One Pilots</p>
        </div>

        <button
          className="btn btn-primary btn-large create-playlist-btn"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ Crear Playlist
        </button>
      </div>

      {showCreateForm && (
        <div className="create-playlist-modal">
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Crear Nueva Playlist</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="create-playlist-form">
              <div className="form-group">
                <label htmlFor="name">Nombre de la Playlist</label>
                <input
                  type="text"
                  id="name"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist({...newPlaylist, name: e.target.value})}
                  placeholder="Ej: Mis canciones favoritas"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción (opcional)</label>
                <textarea
                  id="description"
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({...newPlaylist, description: e.target.value})}
                  placeholder="Describe tu playlist..."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newPlaylist.isPublic}
                    onChange={(e) => setNewPlaylist({...newPlaylist, isPublic: e.target.checked})}
                  />
                  <span>Hacer playlist pública</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="playlists-filters">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button
            className={`filter-btn ${filter === 'public' ? 'active' : ''}`}
            onClick={() => setFilter('public')}
          >
            Públicas
          </button>
          <button
            className={`filter-btn ${filter === 'my' ? 'active' : ''}`}
            onClick={() => setFilter('my')}
          >
            Mis Playlists
          </button>
        </div>
      </div>

      <div className="playlists-stats">
        <div className="stat-item">
          <span className="stat-number">{playlists.length}</span>
          <span className="stat-label">Playlists</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {playlists.reduce((sum, p) => sum + p.likes, 0)}
          </span>
          <span className="stat-label">Likes Totales</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {playlists.reduce((sum, p) => sum + p.songs, 0)}
          </span>
          <span className="stat-label">Canciones</span>
        </div>
      </div>

      <div className="playlists-grid">
        {playlists.length === 0 ? (
          <div className="no-playlists">
            <h3>No hay playlists disponibles</h3>
            <p>¡Sé el primero en crear una playlist!</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Crear Primera Playlist
            </button>
          </div>
        ) : (
          playlists.map(playlist => (
            <div key={playlist.id} className="playlist-card">
              <div className="playlist-cover">
                {playlist.coverImage ? (
                  <img src={playlist.coverImage} alt={`${playlist.name} cover`} />
                ) : (
                  <div className="no-cover">
                    <span>🎵</span>
                  </div>
                )}
                <div className="playlist-overlay">
                  <button
                    className={`like-btn ${playlist.isLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(playlist.id)}
                  >
                    {playlist.isLiked ? '❤️' : '🤍'} {playlist.likes}
                  </button>
                </div>
              </div>

              <div className="playlist-info">
                <h3 className="playlist-title">{playlist.name}</h3>
                <p className="playlist-description">
                  {playlist.description || 'Sin descripción'}
                </p>

                <div className="playlist-meta">
                  <span className="creator">👤 {playlist.creator}</span>
                  <span className="created-date">📅 {formatDate(playlist.createdAt)}</span>
                </div>

                <div className="playlist-stats">
                  <span>🎵 {playlist.songs} canciones</span>
                  <span>⏱️ {playlist.duration}</span>
                  {!playlist.isPublic && <span>🔒 Privada</span>}
                </div>

                {playlist.tags && playlist.tags.length > 0 && (
                  <div className="playlist-tags">
                    {playlist.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="playlist-actions">
                <button className="btn btn-primary btn-small">
                  ▶️ Reproducir
                </button>
                <button className="btn btn-secondary btn-small">
                  📋 Ver Canciones
                </button>
                <button className="btn btn-secondary btn-small">
                  🔗 Compartir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Playlists;