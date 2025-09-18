const express = require('express');
const axios = require('axios');
const router = express.Router();

// Ruta para buscar videos de YouTube con paginación simulada
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key no configurada' });
    }

    // YouTube API tiene su propia paginación
    const maxResults = Math.min(parseInt(limit) || 10, 50);
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: q || 'Twenty One Pilots',
        type: 'video',
        key: apiKey,
        maxResults,
        pageToken: req.query.pageToken || undefined,
      },
    });

    // Estructurar respuesta con paginación
    const result = {
      data: response.data.items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: null, // YouTube no proporciona total
        itemsPerPage: maxResults,
        hasNextPage: !!response.data.nextPageToken,
        hasPrevPage: !!response.data.prevPageToken,
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken,
      }
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener detalles de un video
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key no configurada' });
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics',
        id,
        key: apiKey,
      },
    });

    res.json(response.data.items[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;