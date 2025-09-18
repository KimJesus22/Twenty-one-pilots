const express = require('express');
const router = express.Router();

// Ruta para obtener todos los álbumes
router.get('/albums', async (req, res) => {
  try {
    // Lógica para obtener álbumes de la DB
    res.json({ message: 'Lista de álbumes' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener una canción específica
router.get('/songs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Lógica para obtener canción por ID
    res.json({ message: `Canción con ID ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;