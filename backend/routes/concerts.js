const express = require('express');
const axios = require('axios');
const router = express.Router();

// Ruta para buscar conciertos con paginación simulada
router.get('/search', async (req, res) => {
  try {
    const { q, location, page = 1, limit = 10 } = req.query;
    const apiKey = process.env.EVENTBRITE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Eventbrite API key no configurada' });
    }

    // Eventbrite API tiene paginación nativa
    const pageSize = Math.min(parseInt(limit) || 10, 50);
    const response = await axios.get('https://www.eventbriteapi.com/v3/events/search/', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        q: q || 'Twenty One Pilots',
        location: location || 'all',
        categories: '103', // Music category
        sort_by: 'date',
        page: page,
        page_size: pageSize,
      },
    });

    // Estructurar respuesta con paginación
    const result = {
      data: response.data.events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: response.data.pagination.page_count,
        totalItems: response.data.pagination.object_count,
        itemsPerPage: pageSize,
        hasNextPage: response.data.pagination.has_more_items,
        hasPrevPage: parseInt(page) > 1,
      }
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener detalles de un concierto
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.EVENTBRITE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Eventbrite API key no configurada' });
    }

    const response = await axios.get(`https://www.eventbriteapi.com/v3/events/${id}/`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;