import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useAlbumMetrics } from '../hooks/useAlbumMetrics';
import { useTranslation } from 'react-i18next';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

const AlbumMetricsChart = ({ albumId, compareMode = false, albumIds = [] }) => {
  const { t } = useTranslation();
  const {
    metrics,
    loading,
    error,
    fetchAlbumMetrics,
    fetchMultipleAlbumsMetrics,
    fetchAlbumStats
  } = useAlbumMetrics();

  // Estados del componente
  const [selectedMetric, setSelectedMetric] = useState('popularity');
  const [chartType, setChartType] = useState('line'); // 'line' o 'bar'
  const [timeRange, setTimeRange] = useState('30d'); // '7d', '30d', '90d', '1y', 'all'
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(true);

  // Opciones de métricas disponibles
  const metricOptions = [
    { value: 'popularity', label: t('metrics.popularity', 'Popularidad') },
    { value: 'views', label: t('metrics.views', 'Vistas') },
    { value: 'likes', label: t('metrics.likes', 'Likes') },
    { value: 'playCount', label: t('metrics.plays', 'Reproducciones') },
    { value: 'rating', label: t('metrics.rating', 'Calificación') },
    { value: 'streams', label: t('metrics.streams', 'Streams') },
    { value: 'downloads', label: t('metrics.downloads', 'Descargas') },
    { value: 'sales', label: t('metrics.sales', 'Ventas') }
  ];

  // Calcular rango de fechas basado en timeRange
  const getDateRange = (range) => {
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate.setFullYear(now.getFullYear() - 5); // Últimos 5 años por defecto
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  };

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    const loadData = async () => {
      try {
        const { startDate, endDate } = getDateRange(timeRange);

        if (compareMode && albumIds.length > 0) {
          await fetchMultipleAlbumsMetrics(albumIds, {
            metric: selectedMetric,
            startDate,
            endDate
          });
        } else if (albumId) {
          await fetchAlbumMetrics(albumId, {
            metric: selectedMetric,
            startDate,
            endDate
          });

          // Cargar estadísticas
          const albumStats = await fetchAlbumStats(albumId, parseInt(timeRange.replace('d', '')));
          setStats(albumStats);
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
      }
    };

    loadData();
  }, [albumId, compareMode, albumIds, selectedMetric, timeRange, fetchAlbumMetrics, fetchMultipleAlbumsMetrics, fetchAlbumStats]);

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    if (compareMode) {
      // Modo comparación: múltiples líneas
      const datasets = metrics.map((albumData, index) => ({
        label: albumData.album.title,
        data: albumData.data.map(point => ({
          x: new Date(point.timestamp),
          y: point.value
        })),
        borderColor: `hsl(${(index * 360) / metrics.length}, 70%, 50%)`,
        backgroundColor: `hsl(${(index * 360) / metrics.length}, 70%, 50%, 0.1)`,
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 6
      }));

      return {
        datasets
      };
    } else {
      // Modo individual: una línea
      const data = metrics.map(point => ({
        x: new Date(point.timestamp),
        y: point.value
      }));

      return {
        datasets: [{
          label: metricOptions.find(opt => opt.value === selectedMetric)?.label || selectedMetric,
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: chartType === 'line',
          pointRadius: 3,
          pointHoverRadius: 6
        }]
      };
    }
  }, [metrics, selectedMetric, compareMode, chartType, metricOptions]);

  // Configuración del gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: compareMode
          ? t('metrics.albumComparison', 'Comparación de Álbumes')
          : t('metrics.albumMetrics', 'Métricas del Álbum'),
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const date = new Date(context.parsed.x).toLocaleDateString();
            return `${context.dataset.label}: ${value} (${date})`;
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '7d' ? 'day' : timeRange === '30d' ? 'week' : 'month',
          displayFormats: {
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy'
          }
        },
        title: {
          display: true,
          text: t('metrics.time', 'Tiempo')
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: metricOptions.find(opt => opt.value === selectedMetric)?.label || selectedMetric
        }
      }
    },
  };

  // Renderizar estadísticas
  const renderStats = () => {
    if (!stats || !showStats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.growth > 0 ? '+' : ''}{stats.growth}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('metrics.growth', 'Crecimiento')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.average}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('metrics.average', 'Promedio')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.peak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('metrics.peak', 'Pico')}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            stats.trend === 'increasing' ? 'text-green-600' :
            stats.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {stats.trend === 'increasing' ? '↗️' :
             stats.trend === 'decreasing' ? '↘️' : '➡️'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('metrics.trend', 'Tendencia')}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="text-red-800 dark:text-red-200">
          {t('metrics.error', 'Error al cargar métricas')}: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Selector de métrica */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('metrics.metric', 'Métrica')}
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {metricOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de rango de tiempo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('metrics.timeRange', 'Rango de Tiempo')}
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">{t('metrics.last7days', 'Últimos 7 días')}</option>
            <option value="30d">{t('metrics.last30days', 'Últimos 30 días')}</option>
            <option value="90d">{t('metrics.last90days', 'Últimos 90 días')}</option>
            <option value="1y">{t('metrics.lastYear', 'Último año')}</option>
            <option value="all">{t('metrics.allTime', 'Todo el tiempo')}</option>
          </select>
        </div>

        {/* Selector de tipo de gráfico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('metrics.chartType', 'Tipo de Gráfico')}
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="line">{t('metrics.lineChart', 'Línea')}</option>
            <option value="bar">{t('metrics.barChart', 'Barras')}</option>
          </select>
        </div>

        {/* Toggle estadísticas */}
        {!compareMode && (
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('metrics.showStats', 'Mostrar Estadísticas')}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {!compareMode && renderStats()}

      {/* Gráfico */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="h-96">
          {chartType === 'line' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Instrucciones de zoom */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          💡 {t('metrics.zoomHint', 'Usa la rueda del mouse para hacer zoom, arrastra para desplazar')}
        </div>
      </div>
    </div>
  );
};

export default AlbumMetricsChart;