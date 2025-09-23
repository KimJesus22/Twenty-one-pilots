import React, { useEffect, useState } from 'react';
import discographyAPI from '../api/discography';
import AlbumDetail from '../components/AlbumDetail';
import AdvancedFilters from '../components/AdvancedFilters';
import { getAlbumArt } from '../utils/albumArt';
import './Discography.css';

const Discography = () => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    sort: 'releaseYear',
    order: 'desc',
    search: '',
    genre: 'all',
    type: 'all',
    minYear: '',
    maxYear: '',
    minPopularity: '',
    maxPopularity: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 12
  });
  const [genres, setGenres] = useState([]);
  const [types, setTypes] = useState([]);
  const [popularityStats, setPopularityStats] = useState(null);
  const [albumArts, setAlbumArts] = useState({});

  useEffect(() => {
    fetchAlbums();
    fetchGenres();
    fetchTypes();
    fetchPopularityStats();
  }, [filters.page, filters.sort, filters.order, filters.search, filters.genre, filters.type, filters.minYear, filters.maxYear, filters.minPopularity, filters.maxPopularity]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await discographyAPI.getAlbums(filters);

      if (response.success) {
        setAlbums(response.data.albums);
        setPagination(response.data.pagination);
        setError(null);

        // Cargar carátulas
        loadAlbumArts(response.data.albums);
      } else {
        throw new Error(response.message || 'Error al cargar álbumes');
      }
    } catch (err) {
      console.error('Error cargando álbumes:', err);
      setError(err.message);
      // Fallback a datos mock si el backend no está disponible
      setAlbums([
        {
          _id: '1',
          title: 'Twenty One Pilots',
          releaseYear: 2009,
          coverImage: null,
          artist: 'Twenty One Pilots',
          genre: 'alternative',
          type: 'album',
          popularity: 85,
          views: 1250000,
          likes: [],
          songs: [
            { _id: '1', title: 'Implicit Demand for Proof', duration: '4:51', trackNumber: 1, playCount: 45000, likes: [] },
            { _id: '2', title: 'Fall Away', duration: '3:58', trackNumber: 2, playCount: 52000, likes: [] },
            { _id: '3', title: 'The Pantaloon', duration: '3:33', trackNumber: 3, playCount: 38000, likes: [] },
            { _id: '4', title: 'Addict with a Pen', duration: '4:45', trackNumber: 4, playCount: 41000, likes: [] },
            { _id: '5', title: 'Friend, Please', duration: '4:13', trackNumber: 5, playCount: 39000, likes: [] }
          ]
        },
        {
          _id: '2',
          title: 'Regional at Best',
          releaseYear: 2011,
          coverImage: null,
          artist: 'Twenty One Pilots',
          genre: 'alternative',
          type: 'album',
          popularity: 78,
          views: 980000,
          likes: [],
          songs: [
            { _id: '4', title: 'Guns for Hands', duration: '4:33', trackNumber: 1, playCount: 67000, likes: [] },
            { _id: '5', title: 'Holding on to You', duration: '4:23', trackNumber: 2, playCount: 89000, likes: [] },
            { _id: '6', title: 'Ode to Sleep', duration: '5:08', trackNumber: 3, playCount: 56000, likes: [] },
            { _id: '7', title: 'Slowtown', duration: '4:32', trackNumber: 4, playCount: 48000, likes: [] },
            { _id: '8', title: 'Car Radio', duration: '4:27', trackNumber: 5, playCount: 72000, likes: [] }
          ]
        },
        {
          _id: '3',
          title: 'Vessel',
          releaseYear: 2013,
          coverImage: null,
          artist: 'Twenty One Pilots',
          genre: 'alternative',
          type: 'album',
          popularity: 92,
          views: 2100000,
          likes: [],
          songs: [
            { _id: '7', title: 'Ode to Sleep', duration: '5:08', trackNumber: 1, playCount: 120000, likes: [] },
            { _id: '8', title: 'Holding on to You', duration: '4:23', trackNumber: 2, playCount: 150000, likes: [] },
            { _id: '9', title: 'Migraine', duration: '4:10', trackNumber: 3, playCount: 98000, likes: [] },
            { _id: '10', title: 'House of Gold', duration: '2:43', trackNumber: 4, playCount: 85000, likes: [] },
            { _id: '11', title: 'Car Radio', duration: '4:27', trackNumber: 5, playCount: 110000, likes: [] }
          ]
        },
        {
          _id: '4',
          title: 'Blurryface',
          releaseYear: 2015,
          coverImage: null,
          artist: 'Twenty One Pilots',
          genre: 'alternative',
          type: 'album',
          popularity: 95,
          views: 3500000,
          likes: [],
          songs: [
            { _id: '10', title: 'Heavydirtysoul', duration: '4:54', trackNumber: 1, playCount: 200000, likes: [] },
            { _id: '11', title: 'Stressed Out', duration: '3:22', trackNumber: 2, playCount: 500000, likes: [], spotifyId: '3CRDbSIZ4r5MsZ0YwxuEkn' },
            { _id: '12', title: 'Ride', duration: '3:34', trackNumber: 3, playCount: 350000, likes: [], spotifyId: '2Z8WuEywRWYTKe1NybPxwc' },
            { _id: '13', title: 'Fairly Local', duration: '3:27', trackNumber: 4, playCount: 280000, likes: [] },
            { _id: '14', title: 'Tear in My Heart', duration: '3:08', trackNumber: 5, playCount: 320000, likes: [] }
          ]
        },
        {
          _id: '5',
          title: 'Trench',
          releaseYear: 2018,
          coverImage: null,
          artist: 'Twenty One Pilots',
          genre: 'alternative',
          type: 'album',
          popularity: 88,
          views: 2800000,
          likes: [],
          songs: [
            { _id: '13', title: 'Jumpsuit', duration: '3:58', trackNumber: 1, playCount: 180000, likes: [] },
            { _id: '14', title: 'Levitate', duration: '2:33', trackNumber: 2, playCount: 160000, likes: [] },
            { _id: '15', title: 'Morph', duration: '4:19', trackNumber: 3, playCount: 140000, likes: [] },
            { _id: '16', title: 'My Blood', duration: '3:49', trackNumber: 4, playCount: 130000, likes: [] },
            { _id: '17', title: 'Chlorine', duration: '5:24', trackNumber: 5, playCount: 170000, likes: [], spotifyId: '5LyRtsQLhcXtkQF3VywPi8' }
          ]
        },
        {
          _id: '6',
          title: 'Scaled and Icy',
          releaseYear: 2021,
          coverImage: null,
          artist: 'Twenty One Pilots',
          genre: 'alternative',
          type: 'album',
          popularity: 82,
          views: 1800000,
          likes: [],
          songs: [
            { _id: '16', title: 'Good Day', duration: '3:24', trackNumber: 1, playCount: 95000, likes: [] },
            { _id: '17', title: 'Choker', duration: '3:43', trackNumber: 2, playCount: 78000, likes: [] },
            { _id: '18', title: 'Shy Away', duration: '2:55', trackNumber: 3, playCount: 67000, likes: [] },
            { _id: '19', title: 'The Outside', duration: '3:36', trackNumber: 4, playCount: 72000, likes: [] },
            { _id: '20', title: 'Saturday', duration: '2:52', trackNumber: 5, playCount: 68000, likes: [] }
          ]
        }
      ]);
      setPagination({ page: 1, pages: 1, total: 6, limit: 12 });
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/discography/genres`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGenres(data.data.genres);
        }
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
      setGenres(['rock', 'alternative', 'indie', 'pop', 'electronic', 'other']);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/discography/types`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTypes(data.data.types);
        }
      }
    } catch (error) {
      console.error('Error fetching types:', error);
      setTypes(['album', 'ep', 'single', 'compilation', 'live']);
    }
  };

  const fetchPopularityStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/discography/stats/popularity`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPopularityStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching popularity stats:', error);
    }
  };

  const loadAlbumArts = async (albums) => {
    const arts = { ...albumArts };

    for (const album of albums) {
      if (!album.coverImage && !arts[album._id]) {
        const artUrl = await getAlbumArt(album.title, album.artist || 'Twenty One Pilots');
        if (artUrl) {
          arts[album._id] = artUrl;
        }
      }
    }

    setAlbumArts(arts);
  };

  const handleAlbumClick = (album) => {
    setSelectedAlbumId(album._id);
  };

  const handleCloseAlbumDetail = () => {
    setSelectedAlbumId(null);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
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

      {/* Estadísticas de popularidad */}
      {popularityStats && (
        <div className="popularity-stats">
          <div className="stat-card">
            <h4>Álbumes</h4>
            <div className="stat-number">{popularityStats.albums?.totalAlbums || 0}</div>
            <div className="stat-detail">
              {popularityStats.albums?.totalViews?.toLocaleString() || 0} reproducciones totales
            </div>
          </div>
          <div className="stat-card">
            <h4>Canciones</h4>
            <div className="stat-number">{popularityStats.songs?.totalSongs || 0}</div>
            <div className="stat-detail">
              {popularityStats.songs?.totalPlays?.toLocaleString() || 0} reproducciones totales
            </div>
          </div>
          <div className="stat-card">
            <h4>Popularidad Promedio</h4>
            <div className="stat-number">{Math.round(popularityStats.albums?.avgPopularity || 0)}</div>
            <div className="stat-detail">de 100 puntos</div>
          </div>
        </div>
      )}

      {/* Filtros avanzados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        genres={genres}
        types={types}
        showAdvanced={true}
      />

      <div className="albums-grid">
        {albums.length === 0 ? (
          <div className="no-albums">
            <h3>No hay álbumes disponibles</h3>
            <p>Los álbumes aparecerán aquí cuando estén disponibles.</p>
          </div>
        ) : (
          albums.map(album => (
            <div
              key={album._id || album.id}
              className="album-card"
              onClick={() => handleAlbumClick(album)}
              style={{ cursor: 'pointer' }}
            >
              <div className="album-cover">
                {(albumArts[album._id] || album.coverImage) ? (
                  <img src={albumArts[album._id] || album.coverImage} alt={`${album.title} cover`} />
                ) : (
                  <div className="no-cover">
                    <span>🎵</span>
                  </div>
                )}
                {album.type && (
                  <div className="album-type-badge">{album.type.toUpperCase()}</div>
                )}
              </div>
              <div className="album-info">
                <h3 className="album-title">{album.title}</h3>
                <p className="album-artist">{album.artist || 'Twenty One Pilots'}</p>
                <div className="album-meta">
                  <span className="release-year">{album.releaseYear}</span>
                  {album.genre && <span className="genre">{album.genre}</span>}
                </div>
                <div className="album-stats">
                  <span className="song-count">{album.songs?.length || 0} canciones</span>
                  {album.views && <span className="views">{album.views.toLocaleString()} vistas</span>}
                  {album.likes && <span className="likes">{album.likes.length} likes</span>}
                </div>
                {album.popularity && (
                  <div className="popularity-bar">
                    <div
                      className="popularity-fill"
                      style={{ width: `${album.popularity}%` }}
                    ></div>
                    <span className="popularity-text">{album.popularity}/100</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {albums.length > 0 && pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn btn-secondary"
          >
            Anterior
          </button>

          <span className="page-info">
            Página {pagination.page} de {pagination.pages}
            ({pagination.total} álbumes)
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="btn btn-secondary"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Vista detallada del álbum */}
      {selectedAlbumId && (
        <AlbumDetail
          albumId={selectedAlbumId}
          onClose={handleCloseAlbumDetail}
        />
      )}
    </div>
  );
};

export default Discography;