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

      // Intentar conectar con el backend
      try {
        const response = await fetch(`http://localhost:5000/api/discography/albums`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();

        // El backend devuelve { success: true, data: { albums: [...], pagination: {...} } }
        if (responseData.success && responseData.data && Array.isArray(responseData.data.albums)) {
          setAlbums(responseData.data.albums);
          setTotalPages(responseData.data.pagination?.pages || 1);
          setError(null);
        } else {
          throw new Error('Estructura de respuesta del backend inválida');
        }
      } catch (backendError) {
        console.warn('Backend no disponible, usando datos mock:', backendError.message);

        // Datos mock si el backend no está disponible
        const mockAlbums = [
          {
            _id: '1',
            title: 'Twenty One Pilots',
            releaseYear: 2009,
            coverImage: null,
            songs: [
              { title: 'Implicit Demand for Proof', duration: '4:51' },
              { title: 'Fall Away', duration: '3:58' },
              { title: 'The Pantaloon', duration: '3:33' }
            ]
          },
          {
            _id: '2',
            title: 'Regional at Best',
            releaseYear: 2011,
            coverImage: null,
            songs: [
              { title: 'Guns for Hands', duration: '4:33' },
              { title: 'Holding on to You', duration: '4:23' },
              { title: 'Ode to Sleep', duration: '5:08' }
            ]
          },
          {
            _id: '3',
            title: 'Vessel',
            releaseYear: 2013,
            coverImage: null,
            songs: [
              { title: 'Ode to Sleep', duration: '5:08' },
              { title: 'Holding on to You', duration: '4:23' },
              { title: 'Migraine', duration: '4:10' }
            ]
          },
          {
            _id: '4',
            title: 'Blurryface',
            releaseYear: 2015,
            coverImage: null,
            songs: [
              { title: 'Heavydirtysoul', duration: '4:54' },
              { title: 'Stressed Out', duration: '3:22' },
              { title: 'Ride', duration: '3:34' }
            ]
          },
          {
            _id: '5',
            title: 'Trench',
            releaseYear: 2018,
            coverImage: null,
            songs: [
              { title: 'Jumpsuit', duration: '3:58' },
              { title: 'Levitate', duration: '2:33' },
              { title: 'Morph', duration: '4:19' }
            ]
          },
          {
            _id: '6',
            title: 'Scaled and Icy',
            releaseYear: 2021,
            coverImage: null,
            songs: [
              { title: 'Good Day', duration: '3:24' },
              { title: 'Choker', duration: '3:43' },
              { title: 'Shy Away', duration: '2:55' }
            ]
          }
        ];

        setAlbums(mockAlbums);
        setTotalPages(1);
        setError(null);
      }
    } catch (err) {
      console.error('Error cargando álbumes:', err);
      setError('Error al cargar los álbumes. Revisa la conexión con el backend.');
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