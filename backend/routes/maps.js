const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Maps API - Coming Soon' });
});

module.exports = router;