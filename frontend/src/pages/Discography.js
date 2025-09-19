import React, { useEffect, useState } from 'react';
import './Discography.css';

const Discography = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAlbums();
  }, [page]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/discography/albums?page=${page}&limit=10`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAlbums(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setError(null);
    } catch (err) {
      console.error('Error cargando álbumes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage(prev => Math.min(totalPages, prev + 1));
  };

  if (loading) {
    return (
      <div className="discography">
        <div className="loading">Cargando álbumes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="discography">
        <div className="error">
          <h2>Error al cargar los álbumes</h2>
          <p>{error}</p>
          <button onClick={fetchAlbums} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="discography">
      <div className="discography-header">
        <h1>Discografía de Twenty One Pilots</h1>
        <p>Explora todos los álbumes y canciones de la banda</p>
      </div>

      <div className="albums-grid">
        {albums.length === 0 ? (
          <div className="no-albums">
            <h3>No hay álbumes disponibles</h3>
            <p>Los álbumes aparecerán aquí cuando estén disponibles.</p>
          </div>
        ) : (
          albums.map(album => (
            <div key={album._id || album.id} className="album-card">
              <div className="album-cover">
                {album.coverImage ? (
                  <img src={album.coverImage} alt={`${album.title} cover`} />
                ) : (
                  <div className="no-cover">
                    <span>🎵</span>
                  </div>
                )}
              </div>
              <div className="album-info">
                <h3>{album.title}</h3>
                <p className="release-year">{album.releaseYear}</p>
                <p className="song-count">
                  {album.songs?.length || 0} canciones
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {albums.length > 0 && (
        <div className="pagination">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className="btn btn-secondary"
          >
            Anterior
          </button>

          <span className="page-info">
            Página {page} de {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className="btn btn-secondary"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default Discography;