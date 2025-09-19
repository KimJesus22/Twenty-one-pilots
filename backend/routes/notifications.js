const express = require('express');
const router = express.Router();

// Placeholder para notificaciones
router.get('/', (req, res) => {
  res.json({
    message: 'Notifications API - Coming Soon',
    features: ['Push notifications', 'Email notifications', 'In-app notifications']
  });
});

module.exports = router;