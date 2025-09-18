const express = require('express');
const locationService = require('../services/locationService');
const calendarService = require('../services/calendarService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Geocodificar dirección
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Dirección requerida' });
    }

    const location = await locationService.geocodeAddress(address);

    if (!location) {
      return res.status(404).json({ error: 'Dirección no encontrada' });
    }

    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reverse geocoding
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!locationService.validateCoordinates(latitude, longitude)) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    const address = await locationService.reverseGeocode(latitude, longitude);

    if (!address) {
      return res.status(404).json({ error: 'Dirección no encontrada' });
    }

    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calcular distancia
router.post('/distance', async (req, res) => {
  try {
    const { from, to } = req.body;

    if (!from || !to || !from.latitude || !from.longitude || !to.latitude || !to.longitude) {
      return res.status(400).json({ error: 'Coordenadas de origen y destino requeridas' });
    }

    const distance = locationService.calculateDistance(
      from.latitude, from.longitude,
      to.latitude, to.longitude
    );

    res.json({
      distance: Math.round(distance * 100) / 100, // Redondear a 2 decimales
      unit: 'km'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar lugares cercanos
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10, type = 'venue' } = req.query;

    if (!locationService.validateCoordinates(lat, lng)) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    const places = await locationService.findNearbyPlaces(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius),
      type
    );

    res.json(places);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear evento en Google Calendar
router.post('/calendar/event', authenticateToken, async (req, res) => {
  try {
    const { concert, userEmail } = req.body;

    if (!concert || !concert.name || !concert.start_date) {
      return res.status(400).json({ error: 'Datos del concierto requeridos' });
    }

    const result = await calendarService.createConcertEvent(concert, userEmail);

    if (!result) {
      return res.status(500).json({ error: 'Error creando evento en calendario' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener eventos del calendario
router.get('/calendar/events', authenticateToken, async (req, res) => {
  try {
    const { calendarId, maxResults = 10 } = req.query;

    const events = await calendarService.getUpcomingEvents(calendarId, parseInt(maxResults));

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear recordatorio personalizado
router.post('/calendar/reminder', authenticateToken, async (req, res) => {
  try {
    const { concert, reminderTime } = req.body;
    const userEmail = req.user.email;

    if (!concert || !reminderTime) {
      return res.status(400).json({ error: 'Concierto y tiempo de recordatorio requeridos' });
    }

    const result = await calendarService.createCustomReminder(concert, userEmail, reminderTime);

    if (!result) {
      return res.status(500).json({ error: 'Error creando recordatorio' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compartir calendario
router.post('/calendar/share', authenticateToken, async (req, res) => {
  try {
    const { calendarId, email } = req.body;

    if (!calendarId || !email) {
      return res.status(400).json({ error: 'ID de calendario y email requeridos' });
    }

    const success = await calendarService.shareCalendar(calendarId, email);

    if (!success) {
      return res.status(500).json({ error: 'Error compartiendo calendario' });
    }

    res.json({ success: true, message: 'Calendario compartido correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;