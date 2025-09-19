const express = require('express');
const { query, param } = require('express-validator');
const youtubeService = require('../services/youtubeService');
const logger = require('../utils/logger');

const router = express.Router();

// Ruta para buscar videos de YouTube
router.get('/search',
  [
    query('q').optional().isString().withMessage('Query debe ser un string'),
    query('maxResults').optional().isInt({ min: 1, max: 50 }).withMessage('maxResults debe ser entre 1 y 50'),
  ],
  async (req, res) => {
    try {
      const { q, maxResults = 10 } = req.query;

      const result = await youtubeService.searchVideos(q, parseInt(maxResults));

      if (!result.success) {
        logger.externalApi('YouTube', 'search', false, { query: q, error: result.error });
        return res.status(500).json({
          success: false,
          message: 'Error buscando videos',
          error: result.error
        });
      }

      logger.externalApi('YouTube', 'search', true, { query: q, resultsCount: result.data.length });
      res.json({
        success: true,
        data: result.data,
        totalResults: result.totalResults
      });
    } catch (error) {
      logger.error('Error en ruta /videos/search:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Ruta para obtener detalles de un video específico
router.get('/:id',
  [
    param('id').isString().notEmpty().withMessage('ID de video requerido'),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await youtubeService.getVideoDetails(id);

      if (!result.success) {
        logger.externalApi('YouTube', 'getVideoDetails', false, { videoId: id, error: result.error });
        return res.status(404).json({
          success: false,
          message: 'Video no encontrado',
          error: result.error
        });
      }

      logger.externalApi('YouTube', 'getVideoDetails', true, { videoId: id });
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Error en ruta /videos/:id:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Ruta para obtener videos relacionados
router.get('/:id/related',
  [
    param('id').isString().notEmpty().withMessage('ID de video requerido'),
    query('maxResults').optional().isInt({ min: 1, max: 10 }).withMessage('maxResults debe ser entre 1 y 10'),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { maxResults = 5 } = req.query;

      const result = await youtubeService.getRelatedVideos(id, parseInt(maxResults));

      if (!result.success) {
        logger.externalApi('YouTube', 'getRelatedVideos', false, { videoId: id, error: result.error });
        return res.status(500).json({
          success: false,
          message: 'Error obteniendo videos relacionados',
          error: result.error
        });
      }

      logger.externalApi('YouTube', 'getRelatedVideos', true, { videoId: id, resultsCount: result.data.length });
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Error en ruta /videos/:id/related:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;