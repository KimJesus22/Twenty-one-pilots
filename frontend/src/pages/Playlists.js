import React, { useEffect, useState } from 'react';
import './Playlists.css';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      // Simular datos por ahora ya que no hay backend para playlists
      const mockPlaylists = [
        {
          _id: '1',
          name: 'Mis Favoritas',
          description: 'Las mejores canciones de Twenty One Pilots',
          user: { username: 'fan123' },
          songs: [],
          isPublic: true,
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          name: 'Para Entrenar',
          description: 'Playlist energética para el gym',
          user: { username: 'fan123' },
          songs: [],
          isPublic: false,
          createdAt: new Date().toISOString()
        }
      ];
      setPlaylists(mockPlaylists);
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
    try {
      // Aquí iría la llamada al backend
      const newPlaylistData = {
        ...newPlaylist,
        _id: Date.now().toString(),
        user: { username: 'fan123' },
        songs: [],
        createdAt: new Date().toISOString()
      };

      setPlaylists(prev => [...prev, newPlaylistData]);
      setNewPlaylist({ name: '', description: '', isPublic: false });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creando playlist:', err);
      setError(err.message);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      // Aquí iría la llamada al backend
      setPlaylists(prev => prev.filter(p => p._id !== playlistId));
    } catch (err) {
      console.error('Error eliminando playlist:', err);
      setError(err.message);
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
          <h1>Mis Playlists</h1>
          <p>Crea y gestiona tus playlists personalizadas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary create-playlist-btn"
        >
          Crear Playlist
        </button>
      </div>

      <div className="playlists-stats">
        <div className="stat-item">
          <div className="stat-number">{playlists.length}</div>
          <div className="stat-label">Playlists</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">
            {playlists.reduce((total, playlist) => total + playlist.songs.length, 0)}
          </div>
          <div className="stat-label">Canciones</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">
            {playlists.filter(p => p.isPublic).length}
          </div>
          <div className="stat-label">Públicas</div>
        </div>
      </div>

      <div className="playlists-grid">
        {playlists.length === 0 ? (
          <div className="no-playlists">
            <h3>No tienes playlists</h3>
            <p>Crea tu primera playlist para empezar a organizar tus canciones favoritas.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Crear Primera Playlist
            </button>
          </div>
        ) : (
          playlists.map(playlist => (
            <div key={playlist._id} className="playlist-card">
              <div className="playlist-cover">
                <div className="no-cover">
                  <span>🎵</span>
                </div>
              </div>

              <div className="playlist-info">
                <h3 className="playlist-title">{playlist.name}</h3>
                <p className="playlist-description">{playlist.description}</p>

                <div className="playlist-meta">
                  <span className="creator">Por: {playlist.user.username}</span>
                  <span className="privacy">
                    {playlist.isPublic ? 'Pública' : 'Privada'}
                  </span>
                </div>

                <div className="playlist-stats">
                  <span>{playlist.songs.length} canciones</span>
                </div>

                <div className="playlist-tags">
                  {playlist.isPublic && (
                    <span className="tag">Pública</span>
                  )}
                </div>
              </div>

              <div className="playlist-actions">
                <button className="btn btn-secondary">Ver</button>
                <button className="btn btn-secondary">Editar</button>
                <button
                  onClick={() => handleDeletePlaylist(playlist._id)}
                  className="btn btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="create-playlist-modal">
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Crear Nueva Playlist</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="create-playlist-form">
              <div className="form-group">
                <label htmlFor="name">Nombre de la Playlist</label>
                <input
                  type="text"
                  id="name"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Ej: Mis Favoritas"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe tu playlist..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newPlaylist.isPublic}
                    onChange={(e) => setNewPlaylist(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  Hacer playlist pública
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
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
    </div>
  );
};

export default Playlists;