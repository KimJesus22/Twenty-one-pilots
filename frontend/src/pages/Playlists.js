import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import playlistsAPI from '../api/playlists';
import VideoPlayer from '../components/VideoPlayer';
import SkeletonLoader from '../components/SkeletonLoader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import './Playlists.css';

const Playlists = () => {
  const { user, isAuthenticated } = useAuth();
  const { error, clearError } = useErrorHandler();
  const [activeTab, setActiveTab] = useState('public'); // 'my', 'public', 'favorites' - default to public
  const [playlists, setPlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [favoritePlaylists, setFavoritePlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [publicPagination, setPublicPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);


  // Efecto para cambiar automáticamente la pestaña cuando cambia el estado de autenticación
  useEffect(() => {
    if (!isAuthenticated && activeTab === 'my') {
      setActiveTab('public');
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (activeTab === 'my' && isAuthenticated) {
      fetchPlaylists();
    } else if (activeTab === 'public') {
      fetchPublicPlaylists();
    } else if (activeTab === 'favorites') {
      fetchFavoritePlaylists();
    }
  }, [pagination.currentPage, publicPagination.currentPage, activeTab, isAuthenticated]);

  const fetchPlaylists = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await playlistsAPI.getUserPlaylists(
        pagination.currentPage,
        pagination.itemsPerPage
      );

      if (response.success) {
        setPlaylists(response.data.playlists || []);
        setPagination({
          currentPage: response.data.pagination?.page || 1,
          totalPages: response.data.pagination?.pages || 1,
          totalItems: response.data.pagination?.total || 0,
          itemsPerPage: response.data.pagination?.limit || 10
        });
        setLocalError(null);
      } else {
        throw new Error(response.message || 'Error al cargar playlists');
      }
    } catch (err) {
      console.error('Error cargando playlists:', err);
      setLocalError(err.message);
      // Fallback a datos mock si el backend no está disponible
      setPlaylists([
        {
          _id: '1',
          name: 'Mis Favoritas',
          description: 'Las mejores videos de Twenty One Pilots',
          user: { username: user?.username || 'fan123' },
          videos: [],
          isPublic: true,
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          name: 'Para Entrenar',
          description: 'Playlist energética para el gym',
          user: { username: user?.username || 'fan123' },
          videos: [],
          isPublic: false,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicPlaylists = async () => {
    try {
      setLoading(true);
      const response = await playlistsAPI.getPublicPlaylists(
        publicPagination.currentPage,
        publicPagination.itemsPerPage
      );

      if (response.success) {
        setPublicPlaylists(response.data.playlists || []);
        setPublicPagination({
          currentPage: response.data.pagination?.page || 1,
          totalPages: response.data.pagination?.pages || 1,
          totalItems: response.data.pagination?.total || 0,
          itemsPerPage: response.data.pagination?.limit || 10
        });
        setLocalError(null);
      } else {
        throw new Error(response.message || 'Error al cargar playlists públicas');
      }
    } catch (err) {
      console.error('Error cargando playlists públicas:', err);
      setLocalError(err.message);
      // Fallback a datos mock
      setPublicPlaylists([
        {
          _id: '3',
          name: 'TOP Clásicos',
          description: 'Las videos más icónicas de Twenty One Pilots',
          user: { username: 'musicfan' },
          videos: [
            { _id: '1', title: 'Stressed Out', duration: '3:22' },
            { _id: '2', title: 'Ride', duration: '3:34' }
          ],
          isPublic: true,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoritePlaylists = async () => {
    try {
      setLoading(true);
      // En una implementación real, esto vendría de una API
      // Por ahora, simulamos datos de favoritas desde localStorage
      const favorites = JSON.parse(localStorage.getItem('favoritePlaylists') || '[]');
      setFavoritePlaylists(favorites);
      setLocalError(null);
    } catch (err) {
      console.error('Error cargando playlists favoritas:', err);
      setLocalError(err.message);
      setFavoritePlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    try {
      const playlistData = {
        name: newPlaylist.name,
        description: newPlaylist.description,
        isPublic: newPlaylist.isPublic
      };

      const response = await playlistsAPI.createPlaylist(playlistData);

      if (response.success) {
        setPlaylists(prev => [...prev, response.data]);
        setNewPlaylist({ name: '', description: '', isPublic: false });
        setShowCreateModal(false);
        setLocalError(null);
      } else {
        throw new Error(response.message || 'Error al crear playlist');
      }
    } catch (err) {
      console.error('Error creando playlist:', err);
      setLocalError(err.message);
    }
  };

  const handleEditPlaylist = (playlist) => {
    setEditingPlaylist(playlist);
    setNewPlaylist({
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.isPublic
    });
    setShowEditModal(true);
  };

  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    try {
      const playlistData = {
        name: newPlaylist.name,
        description: newPlaylist.description,
        isPublic: newPlaylist.isPublic
      };

      const response = await playlistsAPI.updatePlaylist(editingPlaylist._id, playlistData);

      if (response.success) {
        setPlaylists(prev => prev.map(p =>
          p._id === editingPlaylist._id ? response.data : p
        ));
        setNewPlaylist({ name: '', description: '', isPublic: false });
        setShowEditModal(false);
        setEditingPlaylist(null);
        setLocalError(null);
      } else {
        throw new Error(response.message || 'Error al actualizar playlist');
      }
    } catch (err) {
      console.error('Error actualizando playlist:', err);
      setLocalError(err.message);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta playlist?')) {
      return;
    }

    try {
      const response = await playlistsAPI.deletePlaylist(playlistId);

      if (response.success) {
        setPlaylists(prev => prev.filter(p => p._id !== playlistId));
        setLocalError(null);
      } else {
        throw new Error(response.message || 'Error al eliminar playlist');
      }
    } catch (err) {
      console.error('Error eliminando playlist:', err);
      setLocalError(err.message);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePublicPageChange = (newPage) => {
    setPublicPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleClonePlaylist = async (_playlist) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para clonar playlists');
      return;
    }

    // Por ahora, mostrar mensaje de que la funcionalidad estará disponible próximamente
    alert('La funcionalidad de clonar playlists estará disponible próximamente');
  };

  const handlePlayVideo = (video, playlist) => {
    setCurrentVideo(video);
    setCurrentPlaylist(playlist);
  };

  const handleClosePlayer = () => {
    setCurrentVideo(null);
    setCurrentPlaylist(null);
  };

  const handleNextVideo = () => {
    if (!currentPlaylist || !currentVideo) return;

    const currentIndex = currentPlaylist.videos.findIndex(v => v._id === currentVideo._id);
    const nextIndex = (currentIndex + 1) % currentPlaylist.videos.length;
    setCurrentVideo(currentPlaylist.videos[nextIndex]);
  };

  const handlePreviousVideo = () => {
    if (!currentPlaylist || !currentVideo) return;

    const currentIndex = currentPlaylist.videos.findIndex(v => v._id === currentVideo._id);
    const prevIndex = currentIndex === 0 ? currentPlaylist.videos.length - 1 : currentIndex - 1;
    setCurrentVideo(currentPlaylist.videos[prevIndex]);
  };

  if (loading) {
    return (
      <div className="playlists">
        <div className="playlists-header">
          <div className="header-content">
            <h1>Playlists</h1>
            <p>Crea, gestiona y descubre playlists de Twenty One Pilots</p>
          </div>
        </div>

        <div className="tabs">
          <button className="tab active">Mis Playlists</button>
          <button className="tab">Playlists Públicas</button>
        </div>

        <div className="playlists-grid">
          <SkeletonLoader type="card" count={6} />
        </div>
      </div>
    );
  }

  if (error || localError) {
    const displayError = error || localError;
    return (
      <div className="playlists">
        <div className="error">
          <h2>Error al cargar las playlists</h2>
          <p>{displayError.userMessage || displayError.message}</p>
          <div className="error-actions">
            <button onClick={fetchPlaylists} className="btn btn-primary">
              Reintentar
            </button>
            {displayError.retryable && (
              <button onClick={() => clearError()} className="btn btn-secondary">
                Limpiar Error
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="playlists">
      <div className="playlists-header">
        <div className="header-content">
          <h1>Playlists</h1>
          <p>Crea, gestiona y descubre playlists de Twenty One Pilots</p>
        </div>
        {isAuthenticated && activeTab === 'my' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary create-playlist-btn"
          >
            Crear Playlist
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          Mis Playlists
        </button>
        <button
          className={`tab ${activeTab === 'public' ? 'active' : ''}`}
          onClick={() => setActiveTab('public')}
        >
          Playlists Públicas
        </button>
        <button
          className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Favoritas
        </button>
      </div>

      {activeTab === 'my' && isAuthenticated && (
        <div className="playlists-stats">
          <div className="stat-item">
            <div className="stat-number">{playlists.length}</div>
            <div className="stat-label">Playlists</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {playlists.reduce((total, playlist) => total + playlist.videos.length, 0)}
            </div>
            <div className="stat-label">Videos</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {playlists.filter(p => p.isPublic).length}
            </div>
            <div className="stat-label">Públicas</div>
          </div>
        </div>
      )}

      {activeTab === 'public' && (
        <div className="playlists-stats">
          <div className="stat-item">
            <div className="stat-number">{publicPlaylists.length}</div>
            <div className="stat-label">Playlists Públicas</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {publicPlaylists.reduce((total, playlist) => total + playlist.videos.length, 0)}
            </div>
            <div className="stat-label">Videos Totales</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {new Set(publicPlaylists.map(p => p.user.username)).size}
            </div>
            <div className="stat-label">Creadores</div>
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="playlists-stats">
          <div className="stat-item">
            <div className="stat-number">{favoritePlaylists.length}</div>
            <div className="stat-label">Playlists Favoritas</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {favoritePlaylists.reduce((total, playlist) => total + playlist.videos.length, 0)}
            </div>
            <div className="stat-label">Videos Totales</div>
          </div>
        </div>
      )}

      <div className="playlists-grid">
        {activeTab === 'my' ? (
          // Mis Playlists
          playlists.length === 0 ? (
            <div className="no-playlists">
              <h3>No tienes playlists</h3>
              <p>Crea tu primera playlist para empezar a organizar tus videos favoritas.</p>
              {isAuthenticated && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  Crear Primera Playlist
                </button>
              )}
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
                    <span>{playlist.videos.length} videos</span>
                  </div>

                  <div className="playlist-tags">
                    {playlist.isPublic && (
                      <span className="tag">Pública</span>
                    )}
                  </div>
                </div>

                <div className="playlist-actions">
                  <button
                    onClick={() => handlePlayVideo(playlist.videos[0], playlist)}
                    className="btn btn-secondary"
                    disabled={playlist.videos.length === 0}
                  >
                    ▶️ Reproducir
                  </button>
                  <button
                    onClick={() => handleEditPlaylist(playlist)}
                    className="btn btn-secondary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist._id)}
                    className="btn btn-danger"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'public' ? (
          // Playlists Públicas
          publicPlaylists.length === 0 ? (
            <div className="no-playlists">
              <h3>No hay playlists públicas disponibles</h3>
              <p>Las playlists públicas aparecerán aquí cuando los usuarios las compartan.</p>
            </div>
          ) : (
            publicPlaylists.map(playlist => (
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
                    <span className="privacy">Pública</span>
                  </div>

                  <div className="playlist-stats">
                    <span>{playlist.videos.length} videos</span>
                  </div>

                  <div className="playlist-tags">
                    <span className="tag">Pública</span>
                  </div>
                </div>

                <div className="playlist-actions">
                  <button
                    onClick={() => handlePlayVideo(playlist.videos[0], playlist)}
                    className="btn btn-secondary"
                    disabled={playlist.videos.length === 0}
                  >
                    ▶️ Reproducir
                  </button>
                  {isAuthenticated && (
                    <button
                      onClick={() => handleClonePlaylist(playlist)}
                      className="btn btn-primary"
                    >
                      📋 Clonar
                    </button>
                  )}
                  <button className="btn btn-secondary">Ver Detalles</button>
                </div>
              </div>
            ))
          )
        ) : (
          // Playlists Favoritas
          favoritePlaylists.length === 0 ? (
            <div className="no-playlists">
              <h3>No tienes playlists favoritas</h3>
              <p>Agrega playlists a tus favoritas para acceder rápidamente a ellas.</p>
            </div>
          ) : (
            favoritePlaylists.map(playlist => (
              <div key={playlist._id} className="playlist-card">
                <div className="playlist-cover">
                  <div className="no-cover">
                    <span>❤️</span>
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
                    <span>{playlist.videos.length} videos</span>
                  </div>

                  <div className="playlist-tags">
                    <span className="tag favorite">❤️ Favorita</span>
                    {playlist.isPublic && (
                      <span className="tag">Pública</span>
                    )}
                  </div>
                </div>

                <div className="playlist-actions">
                  <button
                    onClick={() => handlePlayVideo(playlist.videos[0], playlist)}
                    className="btn btn-secondary"
                    disabled={playlist.videos.length === 0}
                  >
                    ▶️ Reproducir
                  </button>
                  <button
                    onClick={() => handleClonePlaylist(playlist)}
                    className="btn btn-primary"
                  >
                    📋 Clonar
                  </button>
                  <button className="btn btn-secondary">Ver Detalles</button>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {activeTab === 'my' && playlists.length > 0 && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="btn btn-secondary"
          >
            Anterior
          </button>

          <span className="page-info">
            Página {pagination.currentPage} de {pagination.totalPages}
            ({pagination.totalItems} playlists)
          </span>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="btn btn-secondary"
          >
            Siguiente
          </button>
        </div>
      )}

      {activeTab === 'public' && publicPlaylists.length > 0 && publicPagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePublicPageChange(publicPagination.currentPage - 1)}
            disabled={publicPagination.currentPage === 1}
            className="btn btn-secondary"
          >
            Anterior
          </button>

          <span className="page-info">
            Página {publicPagination.currentPage} de {publicPagination.totalPages}
            ({publicPagination.totalItems} playlists públicas)
          </span>

          <button
            onClick={() => handlePublicPageChange(publicPagination.currentPage + 1)}
            disabled={publicPagination.currentPage === publicPagination.totalPages}
            className="btn btn-secondary"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Reproductor de Video */}
      {currentVideo && (
        <VideoPlayer
          video={currentVideo}
          onClose={handleClosePlayer}
          onNext={handleNextVideo}
          onPrevious={handlePreviousVideo}
          hasNext={currentPlaylist && currentPlaylist.videos.length > 1}
          hasPrevious={currentPlaylist && currentPlaylist.videos.length > 1}
        />
      )}

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

      {showEditModal && (
        <div className="create-playlist-modal">
          <div className="modal-overlay" onClick={() => {
            setShowEditModal(false);
            setEditingPlaylist(null);
            setNewPlaylist({ name: '', description: '', isPublic: false });
          }}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Editar Playlist</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPlaylist(null);
                  setNewPlaylist({ name: '', description: '', isPublic: false });
                }}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePlaylist} className="create-playlist-form">
              <div className="form-group">
                <label htmlFor="edit-name">Nombre de la Playlist</label>
                <input
                  type="text"
                  id="edit-name"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Ej: Mis Favoritas"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Descripción</label>
                <textarea
                  id="edit-description"
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
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlaylist(null);
                    setNewPlaylist({ name: '', description: '', isPublic: false });
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Actualizar Playlist
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