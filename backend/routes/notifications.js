const express = require('express');
const notificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Registrar token de push notification
router.post('/register-token', authenticateToken, async (req, res) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user.userId;

    // En un escenario real, guardaríamos el token en la base de datos
    // Por ahora, solo confirmamos recepción
    console.log(`Token registrado para usuario ${userId}: ${platform}`);

    res.json({
      success: true,
      message: 'Token de notificación registrado correctamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar notificación de prueba
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    const success = await notificationService.sendPushNotification(
      token,
      '¡Hola desde Twenty One Pilots!',
      'Esta es una notificación de prueba de la app.',
      { type: 'test', userId: user.userId }
    );

    res.json({
      success,
      message: success ? 'Notificación enviada' : 'Error enviando notificación'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configurar preferencias de notificación
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, concertAlerts, playlistUpdates } = req.body;
    const userId = req.user.userId;

    // En un escenario real, actualizaríamos las preferencias en la base de datos
    console.log(`Preferencias actualizadas para usuario ${userId}:`, {
      emailNotifications,
      pushNotifications,
      concertAlerts,
      playlistUpdates
    });

    res.json({
      success: true,
      message: 'Preferencias de notificación actualizadas',
      preferences: {
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? true,
        concertAlerts: concertAlerts ?? true,
        playlistUpdates: playlistUpdates ?? true
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de notificaciones (solo admin)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Verificar si es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // En un escenario real, obtendríamos estadísticas de la base de datos
    const stats = {
      totalEmailsSent: 0,
      totalPushNotifications: 0,
      emailDeliveryRate: 0,
      pushDeliveryRate: 0,
      recentNotifications: []
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;