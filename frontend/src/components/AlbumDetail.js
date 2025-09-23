import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import discographyAPI from '../api/discography';
import playlistsAPI from '../api/playlists';
import { getAlbumArt } from '../utils/albumArt';
import AudioPlayer from './AudioPlayer';
import Spinner from './Spinner';
import './AlbumDetail.css';

const AlbumDetail = ({ albumId, onClose, _onAddToPlaylist }) => {
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [userPlaylists] = useState([]);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [albumLiked, setAlbumLiked] = useState(false);
  const [songLikes, setSongLikes] = useState({});
  const [albumArt, setAlbumArt] = useState(null);

  useEffect(() => {
    if (albumId) {
      fetchAlbumDetails();
    }
  }, [albumId]);

  const fetchAlbumDetails = async () => {
    try {
      setLoading(true);
      const response = await discographyAPI.getAlbumById(albumId);

      if (response.success) {
        const albumData = response.data.album;
        setAlbum(albumData);

        // Verificar si el usuario dio like al álbum
        if (isAuthenticated && user) {
          setAlbumLiked(albumData.likes?.includes(user._id));
          // Verificar likes de canciones
          const likesMap = {};
          albumData.songs?.forEach(song => {
            likesMap[song._id] = song.likes?.includes(user._id);
          });
          setSongLikes(likesMap);
        }

        // Incrementar contador de vistas
        await discographyAPI.incrementPlayCount(albumId, 'albums');

        // Cargar carátula si no tiene
        if (!albumData.coverImage) {
          const artUrl = await getAlbumArt(albumData.title, albumData.artist || 'Twenty One Pilots');
          if (artUrl) {
            setAlbumArt(artUrl);
          }
        } else {
          setAlbumArt(albumData.coverImage);
        }
      } else {
        throw new Error(response.message || 'Error cargando álbum');
      }
    } catch (err) {
      console.error('Error cargando detalles del álbum:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    setCurrentSong(song);
    setCurrentPlaylist({ songs: album.songs, title: album.title });
    // Incrementar contador de reproducción
    discographyAPI.incrementPlayCount(song._id, 'songs');
  };

  const handleToggleAlbumLike = async () => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    try {
      const response = await discographyAPI.toggleAlbumLike(album._id, user._id);
      if (response.success) {
        setAlbumLiked(response.data.isLiked);
        setAlbum(prev => ({
          ...prev,
          likes: response.data.isLiked
            ? [...(prev.likes || []), user._id]
            : (prev.likes || []).filter(id => id !== user._id)
        }));
      }
    } catch (error) {
      console.error('Error toggling album like:', error);
    }
  };

  const handleToggleSongLike = async (songId) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    try {
      const response = await discographyAPI.toggleSongLike(songId, user._id);
      if (response.success) {
        setSongLikes(prev => ({
          ...prev,
          [songId]: response.data.isLiked
        }));
      }
    } catch (error) {
      console.error('Error toggling song like:', error);
    }
  };

  const handleAddSongToPlaylist = async (song, playlistId) => {
    try {
      await playlistsAPI.addSongToPlaylist(playlistId, song._id, user._id);
      alert('Canción agregada a la playlist exitosamente');
      setShowPlaylistModal(false);
      setSelectedSongForPlaylist(null);
    } catch (error) {
      console.error('Error agregando canción a playlist:', error);
      alert('Error agregando canción a la playlist');
    }
  };

  const handleBuyAlbum = () => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para comprar');
      return;
    }

    if (album.price > 0) {
      addItem({
        _id: `album_${album._id}`,
        name: `${album.title} (Digital Album)`,
        price: album.price,
        image: album.coverImage,
        category: 'music'
      });
      alert('Álbum agregado al carrito');
    } else {
      alert('Este álbum está disponible gratuitamente');
    }
  };

  const handleShareAlbum = () => {
    const url = `${window.location.origin}/album/${album._id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Enlace copiado al portapapeles');
    });
  };

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateTotalDuration = () => {
    if (!album?.songs) return 0;

    return album.songs.reduce((total, song) => {
      if (song.duration) {
        const [minutes, seconds] = song.duration.split(':').map(Number);
        return total + (minutes * 60) + seconds;
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <div className="album-detail-modal">
        <div className="modal-overlay" onClick={onClose}></div>
        <div className="modal-content loading">
          <Spinner />
          <p>Cargando detalles del álbum...</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="album-detail-modal">
        <div className="modal-overlay">
          <div onClick={onClose} style={{ width: '100%', height: '100%' }}></div>
        </div>
        <div className="modal-content error">
          <h2>Error</h2>
          <p>{error || 'Álbum no encontrado'}</p>
          <button onClick={onClose} className="btn btn-primary">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="album-detail-modal">
        <div className="modal-overlay" onClick={onClose}></div>
        <div className="modal-content album-detail">
          <div className="album-header">
            <div className="album-cover-large">
              {(albumArt || album.coverImage) ? (
                <img src={albumArt || album.coverImage} alt={`${album.title} cover`} />
              ) : (
                <div className="no-cover-large">
                  <span>🎵</span>
                </div>
              )}
            </div>

            <div className="album-info-detailed">
              <div className="album-meta">
                <span className="album-type">{album.type?.toUpperCase()}</span>
                <span className="album-year">{album.releaseYear}</span>
                <span className="album-genre">{album.genre}</span>
              </div>

              <h1 className="album-title">{album.title}</h1>
              <h2 className="album-artist">{album.artist}</h2>

              <div className="album-stats">
                <span>{album.songs?.length || 0} canciones</span>
                <span>{formatDuration(calculateTotalDuration())}</span>
                <span>{album.views || 0} reproducciones</span>
                <span>{album.likes?.length || 0} likes</span>
              </div>

              <div className="album-actions">
                <button
                  className="btn btn-primary play-album-btn"
                  onClick={() => handlePlaySong(album.songs?.[0])}
                  disabled={!album.songs?.length}
                >
                  ▶️ Reproducir Álbum
                </button>

                <button
                  className={`btn ${albumLiked ? 'btn-liked' : 'btn-secondary'} like-btn`}
                  onClick={handleToggleAlbumLike}
                >
                  {albumLiked ? '❤️' : '🤍'} {album.likes?.length || 0}
                </button>

                {album.price > 0 ? (
                  <button className="btn btn-success buy-btn" onClick={handleBuyAlbum}>
                    💰 Comprar ${album.price}
                  </button>
                ) : (
                  <button className="btn btn-secondary free-btn" disabled>
                    🎵 Disponible Gratis
                  </button>
                )}

                <button className="btn btn-secondary share-btn" onClick={handleShareAlbum}>
                  📤 Compartir
                </button>
              </div>
            </div>
          </div>

          <div className="album-tracks">
            <h3>Lista de Canciones</h3>
            <div className="tracks-list">
              {album.songs?.map((song, index) => (
                <div key={song._id} className="track-item">
                  <div className="track-number">{song.trackNumber || index + 1}</div>

                  <div className="track-info">
                    <h4 className="track-title">{song.title}</h4>
                    <div className="track-meta">
                      <span className="track-duration">{song.duration}</span>
                      <span className="track-plays">{song.playCount || 0} reproducciones</span>
                    </div>
                  </div>

                  <div className="track-actions">
                    <button
                      className="play-track-btn"
                      onClick={() => handlePlaySong(song)}
                      title="Reproducir"
                    >
                      ▶️
                    </button>

                    <button
                      className={`like-track-btn ${songLikes[song._id] ? 'liked' : ''}`}
                      onClick={() => handleToggleSongLike(song._id)}
                      title="Me gusta"
                    >
                      {songLikes[song._id] ? '❤️' : '🤍'}
                    </button>

                    {isAuthenticated && (
                      <button
                        className="add-to-playlist-btn"
                        onClick={() => {
                          setSelectedSongForPlaylist(song);
                          setShowPlaylistModal(true);
                        }}
                        title="Agregar a playlist"
                      >
                        ➕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="album-footer">
            <button onClick={onClose} className="btn btn-secondary close-btn">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para agregar a playlist */}
      {showPlaylistModal && selectedSongForPlaylist && (
        <div className="playlist-modal">
          <div className="modal-overlay">
            <div onClick={() => setShowPlaylistModal(false)} style={{ width: '100%', height: '100%' }}></div>
          </div>
          <div className="modal-content">
            <h3>Agregar "{selectedSongForPlaylist.title}" a playlist</h3>
            <div className="playlists-list">
              {userPlaylists.map(playlist => (
                <button
                  key={playlist._id}
                  className="playlist-option"
                  onClick={() => handleAddSongToPlaylist(selectedSongForPlaylist, playlist._id)}
                >
                  {playlist.name}
                </button>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowPlaylistModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Reproductor de audio */}
      {currentSong && (
        <AudioPlayer
          song={currentSong}
          onClose={() => {
            setCurrentSong(null);
            setCurrentPlaylist(null);
          }}
          onNext={() => {
            if (currentPlaylist) {
              const currentIndex = currentPlaylist.songs.findIndex(s => s._id === currentSong._id);
              const nextIndex = (currentIndex + 1) % currentPlaylist.songs.length;
              setCurrentSong(currentPlaylist.songs[nextIndex]);
            }
          }}
          onPrevious={() => {
            if (currentPlaylist) {
              const currentIndex = currentPlaylist.songs.findIndex(s => s._id === currentSong._id);
              const prevIndex = currentIndex === 0 ? currentPlaylist.songs.length - 1 : currentIndex - 1;
              setCurrentSong(currentPlaylist.songs[prevIndex]);
            }
          }}
          hasNext={currentPlaylist && currentPlaylist.songs.length > 1}
          hasPrevious={currentPlaylist && currentPlaylist.songs.length > 1}
        />
      )}
    </>
  );
};

export default AlbumDetail;