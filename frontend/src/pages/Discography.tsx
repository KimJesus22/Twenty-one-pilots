import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import AlbumDetail from '../components/AlbumDetail';
import AdvancedFilters from '../components/AdvancedFilters';
import StarRating from '../components/StarRating';
import {
  GET_ALBUMS_LIST,
  GET_ALBUM_STATS,
  RATE_ALBUM
} from '../graphql/discography';
import { getAlbumArt } from '../utils/albumArt';
import {
  AlbumFilters,
  AlbumsResponse,
  AlbumStats,
  RateAlbumResponse,
  Album
} from '../types';
import './Discography.css';


const Discography: React.FC = () => {
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlbumFilters>({
    page: 1,
    limit: 12,
    sort: 'releaseYear',
    order: 'desc',
    search: '',
    genre: '',
    type: '',
    minYear: '',
    maxYear: '',
    minPopularity: '',
    maxPopularity: ''
  });
  const [genres] = useState<string[]>(['rock', 'alternative', 'indie', 'pop', 'electronic', 'other']);
  const [types] = useState<string[]>(['album', 'ep', 'single', 'compilation', 'live']);
  const [albumArts, setAlbumArts] = useState<Record<string, string>>({});

  // Query GraphQL para obtener álbumes con filtros optimizados
  const { data: albumsData, loading: albumsLoading, error: albumsError, refetch: refetchAlbums } = useQuery<AlbumsResponse>(GET_ALBUMS_LIST, {
    variables: {
      filters: {
        ...filters,
        genre: filters.genre === 'all' ? '' : filters.genre,
        type: filters.type === 'all' ? '' : filters.type,
        minYear: filters.minYear ? parseInt(filters.minYear) : undefined,
        maxYear: filters.maxYear ? parseInt(filters.maxYear) : undefined,
        minPopularity: filters.minPopularity ? parseInt(filters.minPopularity) : undefined,
        maxPopularity: filters.maxPopularity ? parseInt(filters.maxPopularity) : undefined
      }
    },
    fetchPolicy: 'cache-first' // Usar cache para mejor rendimiento
  });

  // Query para estadísticas
  const { data: statsData } = useQuery<{ albumStats: AlbumStats }>(GET_ALBUM_STATS);

  // Mutations para ratings
  const [rateAlbum] = useMutation<{ rateAlbum: RateAlbumResponse }>(RATE_ALBUM);

  // Cargar carátulas cuando se obtienen los álbumes
  useEffect(() => {
    if (albumsData?.albums?.albums) {
      loadAlbumArts(albumsData.albums.albums);
    }
  }, [albumsData]);

  // Función simplificada para recargar datos
  const refetchData = () => {
    refetchAlbums();
  };

  const loadAlbumArts = async (albums: Album[]) => {
    const arts = { ...albumArts };

    for (const album of albums) {
      if (!album.coverImage && !arts[album.id]) {
        const artUrl = await getAlbumArt(album.title, album.artist || 'Twenty One Pilots');
        if (artUrl) {
          arts[album.id] = artUrl;
        }
      }
    }

    setAlbumArts(arts);
  };

  const handleRatingChange = async (albumId: string, rating: number) => {
    try {
      await rateAlbum({
        variables: { albumId, rating },
        // Actualizar cache automáticamente
        update: (cache, { data }) => {
          if (data?.rateAlbum?.success) {
            // Actualizar el álbum en el cache
            const albumId = data.rateAlbum.album.id;
            cache.modify({
              id: cache.identify({ __typename: 'Album', id: albumId }),
              fields: {
                rating: () => data.rateAlbum.album.rating,
                ratingCount: () => data.rateAlbum.album.ratingCount,
                ratingDistribution: () => data.rateAlbum.album.ratingDistribution
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error updating rating:', error);
      alert('Error al guardar la valoración. Inténtalo de nuevo.');
    }
  };


  const handleAlbumClick = (album: Album) => {
    setSelectedAlbumId(album.id);
  };

  const handleCloseAlbumDetail = () => {
    setSelectedAlbumId(null);
  };

  const handleFiltersChange = (newFilters: Partial<AlbumFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (albumsLoading) {
    return (
      <div className="discography">
        <div className="loading">Cargando álbumes...</div>
      </div>
    );
  }

  if (albumsError) {
    return (
      <div className="discography">
        <div className="error">
          <h2>Error al cargar los álbumes</h2>
          <p>{albumsError.message}</p>
          <button onClick={refetchData} className="btn btn-primary">
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
      {statsData?.albumStats && (
        <div className="popularity-stats">
          <div className="stat-card">
            <h4>Álbumes</h4>
            <div className="stat-number">{statsData.albumStats.totalAlbums}</div>
            <div className="stat-detail">
              {statsData.albumStats.totalViews.toLocaleString()} reproducciones totales
            </div>
          </div>
          <div className="stat-card">
            <h4>Canciones</h4>
            <div className="stat-number">{statsData.albumStats.totalSongs}</div>
            <div className="stat-detail">
              Estadísticas de canciones disponibles
            </div>
          </div>
          <div className="stat-card">
            <h4>Rating Promedio</h4>
            <div className="stat-number">{statsData.albumStats.avgRating.toFixed(1)}</div>
            <div className="stat-detail">de 5 estrellas</div>
          </div>
        </div>
      )}

      {/* Filtros avanzados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        genres={genres as any}
        types={types as any}
        showAdvanced={true}
      />

      <div className="albums-grid">
        {albumsData?.albums?.albums?.length === 0 ? (
          <div className="no-albums">
            <h3>No hay álbumes disponibles</h3>
            <p>Los álbumes aparecerán aquí cuando estén disponibles.</p>
          </div>
        ) : (
          albumsData?.albums?.albums?.map((album: Album) => (
            <div
              key={album.id}
              className="album-card"
              onClick={() => handleAlbumClick(album)}
              style={{ cursor: 'pointer' }}
            >
              <div className="album-cover">
                {(albumArts[album.id] || album.coverImage) ? (
                  <img src={albumArts[album.id] || album.coverImage} alt={`${album.title} cover`} />
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

                {/* Sistema de ratings */}
                <div className="album-rating">
                  <div className="rating-display">
                    {album.rating && album.ratingCount && (
                      <div className="rating-stats">
                        <StarRating
                          initialRating={album.rating}
                          size="small"
                          interactive={false}
                          showValue={false}
                          onRatingChange={() => {}}
                          onRatingSubmit={() => {}}
                        />
                        <span className="rating-text">
                          {album.rating.toFixed(1)} ({album.ratingCount} votos)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="rating-actions">
                    <StarRating
                      initialRating={0} // TODO: Implementar rating del usuario actual
                      size="small"
                      onRatingChange={(rating: number) => handleRatingChange(album.id, rating)}
                      onRatingSubmit={() => {}}
                      showValue={false}
                    />
                  </div>
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

      {albumsData && albumsData.albums && albumsData.albums.albums && albumsData.albums.albums.length > 0 && albumsData.albums.pagination && albumsData.albums.pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(albumsData.albums.pagination.page - 1)}
            disabled={albumsData.albums.pagination.page === 1}
            className="btn btn-secondary"
          >
            Anterior
          </button>

          <span className="page-info">
            Página {albumsData.albums.pagination.page} de {albumsData.albums.pagination.pages}
            ({albumsData.albums.pagination.total} álbumes)
          </span>

          <button
            onClick={() => handlePageChange(albumsData.albums.pagination.page + 1)}
            disabled={albumsData.albums.pagination.page === albumsData.albums.pagination.pages}
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
          _onAddToPlaylist={() => {}} // Placeholder para compatibilidad
        />
      )}
    </div>
  );
};

export default Discography;