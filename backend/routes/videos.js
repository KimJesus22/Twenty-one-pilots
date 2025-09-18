const express = require('express');
const axios = require('axios');
const router = express.Router();

// Ruta para buscar videos de YouTube
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key no configurada' });
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: q || 'Twenty One Pilots',
        type: 'video',
        key: apiKey,
        maxResults: 10,
      },
    });

    res.json(response.data.items);
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