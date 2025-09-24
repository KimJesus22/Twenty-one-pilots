import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AlbumMetricsChart from '../components/AlbumMetricsChart';
import { useErrorHandler } from '../hooks/useErrorHandler';

const AlbumMetrics = () => {
  const { t } = useTranslation();
  const { error, clearError } = useErrorHandler();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedAlbums, setSelectedAlbums] = useState([]);

  // Cargar lista de álbumes disponibles
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch('/api/discography/albums?limit=100');
        const data = await response.json();

        if (data.success) {
          setAlbums(data.data.albums || []);
        } else {
          console.error('Error fetching albums:', data.message);
        }
      } catch (err) {
        console.error('Error fetching albums:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  // Manejar selección de álbum para vista individual
  const handleAlbumSelect = (albumId) => {
    setSelectedAlbum(albumId);
    setCompareMode(false);
    setSelectedAlbums([]);
  };

  // Manejar selección de álbumes para comparación
  const handleAlbumToggle = (albumId) => {
    setSelectedAlbums(prev => {
      const isSelected = prev.includes(albumId);
      if (isSelected) {
        return prev.filter(id => id !== albumId);
      } else {
        if (prev.length >= 5) {
          // Máximo 5 álbumes para comparación
          return prev;
        }
        return [...prev, albumId];
      }
    });
    setSelectedAlbum(null);
    setCompareMode(true);
  };

  // Activar modo comparación
  const enableCompareMode = () => {
    setCompareMode(true);
    setSelectedAlbum(null);
  };

  // Desactivar modo comparación
  const disableCompareMode = () => {
    setCompareMode(false);
    setSelectedAlbums([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('metrics.albumAnalytics', 'Análisis de Álbumes')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('metrics.description', 'Visualiza el crecimiento y popularidad de los álbumes a lo largo del tiempo')}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800 dark:text-red-200">
              {error}
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Controles principales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Modo de visualización */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('metrics.viewMode', 'Modo de Visualización')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={disableCompareMode}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  !compareMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('metrics.singleAlbum', 'Álbum Individual')}
              </button>
              <button
                onClick={enableCompareMode}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  compareMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('metrics.compareAlbums', 'Comparar Álbumes')}
              </button>
            </div>
          </div>

          {/* Selector de álbum individual */}
          {!compareMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('metrics.selectAlbum', 'Seleccionar Álbum')}
              </label>
              <select
                value={selectedAlbum || ''}
                onChange={(e) => handleAlbumSelect(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-48"
              >
                <option value="">
                  {t('metrics.selectAlbumPlaceholder', 'Selecciona un álbum...')}
                </option>
                {albums.map(album => (
                  <option key={album._id} value={album._id}>
                    {album.title} ({album.releaseYear})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selector múltiple para comparación */}
        {compareMode && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('metrics.selectAlbums', 'Seleccionar Álbumes')} ({selectedAlbums.length}/5)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {albums.map(album => (
                <label key={album._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedAlbums.includes(album._id)}
                    onChange={() => handleAlbumToggle(album._id)}
                    disabled={!selectedAlbums.includes(album._id) && selectedAlbums.length >= 5}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {album.title} ({album.releaseYear})
                  </span>
                </label>
              ))}
            </div>
            {selectedAlbums.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('metrics.selectAlbumsHint', 'Selecciona al menos un álbum para ver las métricas')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Gráfico */}
      {(selectedAlbum || (compareMode && selectedAlbums.length > 0)) && (
        <AlbumMetricsChart
          albumId={selectedAlbum}
          compareMode={compareMode}
          albumIds={selectedAlbums}
        />
      )}

      {/* Mensaje cuando no hay selección */}
      {!selectedAlbum && (!compareMode || selectedAlbums.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('metrics.noSelection', 'Selecciona un álbum para ver las métricas')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('metrics.noSelectionHint', 'Elige un álbum individual o activa el modo comparación para ver múltiples álbumes')}
          </p>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          {t('metrics.info.title', '¿Qué significan estas métricas?')}
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>{t('metrics.popularity', 'Popularidad')}:</strong> {t('metrics.popularityDesc', 'Puntuación de popularidad en plataformas de streaming')}
          </div>
          <div>
            <strong>{t('metrics.views', 'Vistas')}:</strong> {t('metrics.viewsDesc', 'Número total de vistas en videos y plataformas')}
          </div>
          <div>
            <strong>{t('metrics.likes', 'Likes')}:</strong> {t('metrics.likesDesc', 'Número de usuarios que han dado like al álbum')}
          </div>
          <div>
            <strong>{t('metrics.streams', 'Streams')}:</strong> {t('metrics.streamsDesc', 'Reproducciones en plataformas de streaming')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumMetrics;