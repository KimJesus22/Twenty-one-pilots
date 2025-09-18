const express = require('express');
const cacheService = require('../services/cacheService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener estadísticas de caché (solo admin)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const stats = await cacheService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Limpiar todo el caché (solo admin)
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const success = await cacheService.clearAll();
    if (success) {
      res.json({ message: 'Caché limpiado correctamente' });
    } else {
      res.status(500).json({ error: 'Error limpiando caché' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Limpiar caché por patrón (solo admin)
router.delete('/clear/:pattern', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { pattern } = req.params;
    const success = await cacheService.clearPattern(pattern);

    if (success) {
      res.json({ message: `Caché limpiado para patrón: ${pattern}` });
    } else {
      res.status(500).json({ error: `Error limpiando caché para patrón: ${pattern}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar estado de Redis
router.get('/health', (req, res) => {
  try {
    const isAvailable = cacheService.isAvailable();
    res.json({
      redis: {
        available: isAvailable,
        status: isAvailable ? 'connected' : 'disconnected'
      },
      cache: {
        service: 'running',
        defaultTTL: cacheService.defaultTTL
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener claves de caché por patrón (solo admin)
router.get('/keys/:pattern', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (!cacheService.isAvailable()) {
      return res.status(503).json({ error: 'Redis no disponible' });
    }

    const { pattern } = req.params;
    const keys = await cacheService.client.keys(pattern);

    res.json({
      pattern,
      count: keys.length,
      keys: keys.slice(0, 100) // Limitar a 100 claves para evitar respuestas muy grandes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener valor de una clave específica (solo admin)
router.get('/key/:key', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { key } = req.params;
    const value = await cacheService.get(key);

    if (value === null) {
      return res.status(404).json({ error: 'Clave no encontrada en caché' });
    }

    res.json({
      key,
      value,
      type: typeof value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar clave específica (solo admin)
router.delete('/key/:key', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { key } = req.params;
    const success = await cacheService.del(key);

    if (success) {
      res.json({ message: `Clave eliminada: ${key}` });
    } else {
      res.status(404).json({ error: `Clave no encontrada: ${key}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;