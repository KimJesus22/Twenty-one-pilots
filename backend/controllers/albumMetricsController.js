const AlbumMetrics = require('../models/AlbumMetrics');
const { Album } = require('../models/Discography');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Obtener métricas históricas de un álbum
 */
exports.getAlbumMetrics = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { albumId } = req.params;
    const {
      metric = 'popularity',
      startDate,
      endDate,
      source,
      limit = 100
    } = req.query;

    // Verificar que el álbum existe
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }

    // Construir query
    const query = { album: albumId };

    if (startDate || endDate) {
      query.capturedAt = {};
      if (startDate) query.capturedAt.$gte = new Date(startDate);
      if (endDate) query.capturedAt.$lte = new Date(endDate);
    }

    if (source) {
      query.source = source;
    }

    // Obtener métricas
    const metrics = await AlbumMetrics.find(query)
      .sort({ capturedAt: 1 })
      .limit(parseInt(limit))
      .select(`capturedAt ${metric}`)
      .lean();

    // Formatear datos para gráficos
    const chartData = metrics.map(item => ({
      date: item.capturedAt.toISOString().split('T')[0], // YYYY-MM-DD
      value: item[metric] || 0,
      timestamp: item.capturedAt.getTime()
    }));

    res.json({
      success: true,
      data: {
        album: {
          id: album._id,
          title: album.title,
          artist: album.artist
        },
        metric,
        data: chartData,
        totalPoints: chartData.length
      }
    });

  } catch (error) {
    logger.error('Error getting album metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas del álbum'
    });
  }
};

/**
 * Obtener métricas de múltiples álbumes para comparación
 */
exports.getMultipleAlbumsMetrics = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const {
      albumIds,
      metric = 'popularity',
      startDate,
      endDate,
      source,
      limit = 50
    } = req.query;

    if (!albumIds || !Array.isArray(albumIds)) {
      return res.status(400).json({
        success: false,
        message: 'albumIds es requerido y debe ser un array'
      });
    }

    // Verificar que los álbumes existen
    const albums = await Album.find({ _id: { $in: albumIds } })
      .select('title artist')
      .lean();

    if (albums.length !== albumIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Uno o más álbumes no encontrados'
      });
    }

    // Construir query
    const query = { album: { $in: albumIds } };

    if (startDate || endDate) {
      query.capturedAt = {};
      if (startDate) query.capturedAt.$gte = new Date(startDate);
      if (endDate) query.capturedAt.$lte = new Date(endDate);
    }

    if (source) {
      query.source = source;
    }

    // Obtener métricas agrupadas por álbum
    const metrics = await AlbumMetrics.find(query)
      .sort({ capturedAt: 1 })
      .limit(parseInt(limit) * albumIds.length)
      .select(`album capturedAt ${metric}`)
      .lean();

    // Agrupar por álbum
    const albumData = {};
    albums.forEach(album => {
      albumData[album._id.toString()] = {
        album: {
          id: album._id,
          title: album.title,
          artist: album.artist
        },
        data: []
      };
    });

    // Procesar métricas
    metrics.forEach(item => {
      const albumId = item.album.toString();
      if (albumData[albumId]) {
        albumData[albumId].data.push({
          date: item.capturedAt.toISOString().split('T')[0],
          value: item[metric] || 0,
          timestamp: item.capturedAt.getTime()
        });
      }
    });

    res.json({
      success: true,
      data: {
        metric,
        albums: Object.values(albumData),
        totalAlbums: albums.length
      }
    });

  } catch (error) {
    logger.error('Error getting multiple albums metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de álbumes'
    });
  }
};

/**
 * Obtener métricas actuales de un álbum
 */
exports.getCurrentAlbumMetrics = async (req, res) => {
  try {
    const { albumId } = req.params;

    // Verificar que el álbum existe
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }

    // Obtener últimas métricas
    const latestMetrics = await AlbumMetrics.getLatestMetrics(albumId);

    const currentMetrics = {
      popularity: album.popularity || 0,
      views: album.views || 0,
      likes: album.likes?.length || 0,
      playCount: album.playCount || 0,
      rating: album.rating || 0,
      ratingCount: album.ratingCount || 0,
      commentCount: album.commentCount || 0,
      lastUpdated: album.updatedAt
    };

    res.json({
      success: true,
      data: {
        album: {
          id: album._id,
          title: album.title,
          artist: album.artist
        },
        current: currentMetrics,
        historical: latestMetrics ? {
          capturedAt: latestMetrics.capturedAt,
          source: latestMetrics.source
        } : null
      }
    });

  } catch (error) {
    logger.error('Error getting current album metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas actuales del álbum'
    });
  }
};

/**
 * Crear snapshot de métricas (para administradores)
 */
exports.createMetricsSnapshot = async (req, res) => {
  try {
    const { albumId } = req.params;
    const { source = 'manual' } = req.body;

    const snapshot = await AlbumMetrics.createSnapshot(albumId, source);

    logger.info(`Metrics snapshot created for album ${albumId} by user ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Snapshot de métricas creado exitosamente',
      data: snapshot
    });

  } catch (error) {
    logger.error('Error creating metrics snapshot:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear snapshot de métricas'
    });
  }
};

/**
 * Obtener estadísticas generales de métricas
 */
exports.getMetricsStats = async (req, res) => {
  try {
    const { albumId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Obtener métricas del período
    const metrics = await AlbumMetrics.find({
      album: albumId,
      capturedAt: { $gte: startDate }
    }).sort({ capturedAt: 1 });

    if (metrics.length === 0) {
      return res.json({
        success: true,
        data: {
          growth: 0,
          average: 0,
          peak: 0,
          trend: 'stable'
        }
      });
    }

    // Calcular estadísticas
    const firstValue = metrics[0].popularity || 0;
    const lastValue = metrics[metrics.length - 1].popularity || 0;
    const growth = lastValue - firstValue;
    const average = metrics.reduce((sum, m) => sum + (m.popularity || 0), 0) / metrics.length;
    const peak = Math.max(...metrics.map(m => m.popularity || 0));

    // Determinar tendencia
    let trend = 'stable';
    if (growth > 0) trend = 'increasing';
    else if (growth < 0) trend = 'decreasing';

    res.json({
      success: true,
      data: {
        growth,
        growthPercentage: firstValue > 0 ? (growth / firstValue) * 100 : 0,
        average: Math.round(average * 100) / 100,
        peak,
        dataPoints: metrics.length,
        period: `${days} days`,
        trend
      }
    });

  } catch (error) {
    logger.error('Error getting metrics stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de métricas'
    });
  }
};