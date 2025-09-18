const express = require('express');
const { Album, Song } = require('../models/Discography');
const router = express.Router();

// Ruta para obtener todos los álbumes
router.get('/albums', async (req, res) => {
  try {
    const albums = await Album.find().populate('songs');
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener un álbum específico
router.get('/albums/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).populate('songs');
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener todas las canciones
router.get('/songs', async (req, res) => {
  try {
    const songs = await Song.find().populate('album');
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener una canción específica
router.get('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate('album');
    if (!song) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;