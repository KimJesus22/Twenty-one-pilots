const express = require('express');
const mapService = require('../services/mapService');
const locationService = require('../services/locationService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener configuración de mapa para un concierto específico
router.get('/concert/:concertId', async (req, res) => {
  try {
    const { concertId } = req.params;

    // En un escenario real, obtendríamos el concierto de la base de datos
    // Por ahora, simulamos datos
    const mockConcert = {
      _id: concertId,
      name: 'Twenty One Pilots Live',
      venue_name: 'Madison Square Garden',
      latitude: 40.7505,
      longitude: -73.9934,
      start_date: new Date().toISOString(),
      price: '$50-200'
    };

    const mapConfig = mapService.generateConcertMapConfig(mockConcert);

    if (!mapConfig) {
      return res.status(404).json({ error: 'Ubicación del concierto no disponible' });
    }

    res.json(mapConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mapa con múltiples conciertos
router.get('/concerts', async (req, res) => {
  try {
    const { city, radius = 50, limit = 20 } = req.query;

    // En un escenario real, buscaríamos conciertos en la base de datos
    // Por ahora, simulamos datos
    const mockConcerts = [
      {
        _id: '1',
        name: 'Twenty One Pilots - The Bandito Tour',
        venue_name: 'Barclays Center',
        latitude: 40.6829,
        longitude: -73.9750,
        city: 'Brooklyn',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: '$60-150'
      },
      {
        _id: '2',
        name: 'Twenty One Pilots - Emotional Roadshow',
        venue_name: 'United Center',
        latitude: 41.8807,
        longitude: -87.6742,
        city: 'Chicago',
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        price: '$55-180'
      }
    ];

    const mapConfig = mapService.generateConcertsMapConfig(mockConcerts);
    res.json(mapConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mapa de lugares cercanos para conciertos
router.get('/nearby-venues', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!locationService.validateCoordinates(lat, lng)) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    const mapConfig = await mapService.generateNearbyVenuesMap(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );

    res.json(mapConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generar mapa con ruta a un concierto
router.post('/route', authenticateToken, async (req, res) => {
  try {
    const { userLat, userLng, concertLat, concertLng, transport = 'driving' } = req.body;

    if (!locationService.validateCoordinates(userLat, userLng) ||
        !locationService.validateCoordinates(concertLat, concertLng)) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    const routeMap = mapService.generateRouteMap(
      { lat: parseFloat(userLat), lng: parseFloat(userLng) },
      { lat: parseFloat(concertLat), lng: parseFloat(concertLng) }
    );

    res.json(routeMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener datos de mapa de calor para densidad de conciertos
router.get('/heatmap', async (req, res) => {
  try {
    const { city, days = 30 } = req.query;

    // En un escenario real, obtendríamos conciertos de la base de datos
    // Por ahora, simulamos datos
    const mockConcerts = [
      { _id: '1', name: 'Concert 1', latitude: 40.7128, longitude: -74.0060, start_date: new Date() },
      { _id: '2', name: 'Concert 2', latitude: 40.7589, longitude: -73.9851, start_date: new Date() },
      { _id: '3', name: 'Concert 3', latitude: 40.7505, longitude: -73.9934, start_date: new Date() }
    ];

    const heatmapData = mapService.generateHeatmapData(mockConcerts);
    res.json(heatmapData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estilos de mapa disponibles
router.get('/styles', (req, res) => {
  try {
    const styles = mapService.getMapStyles();
    res.json(styles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar ubicación por dirección para mapas
router.post('/search-location', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Consulta de búsqueda requerida' });
    }

    const location = await locationService.geocodeAddress(query);

    if (!location) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    // Crear configuración de mapa para la ubicación encontrada
    const mapConfig = {
      center: {
        lat: location.latitude,
        lng: location.longitude
      },
      zoom: 15,
      markers: [{
        id: 'searched-location',
        position: {
          lat: location.latitude,
          lng: location.longitude
        },
        title: location.formattedAddress,
        type: 'search-result',
        data: location
      }]
    };

    res.json(mapConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener configuración de mapa por defecto
router.get('/default', (req, res) => {
  try {
    const defaultConfig = mapService.getDefaultMapConfig();
    res.json(defaultConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;