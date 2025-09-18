const express = require('express');
const User = require('../models/User');
const { Album } = require('../models/Discography');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Obtener favoritos del usuario
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar álbum a favoritos
router.post('/albums/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;

    // Verificar que el álbum existe
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }

    // Verificar que no esté ya en favoritos
    const user = await User.findById(req.user._id);
    if (user.favorites.includes(albumId)) {
      return res.status(400).json({ error: 'El álbum ya está en favoritos' });
    }

    // Agregar a favoritos
    user.favorites.push(albumId);
    await user.save();

    // Retornar álbum completo
    await user.populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remover álbum de favoritos
router.delete('/albums/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;

    const user = await User.findById(req.user._id);
    user.favorites = user.favorites.filter(fav => fav.toString() !== albumId);
    await user.save();

    await user.populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar si un álbum está en favoritos
router.get('/albums/:albumId/status', async (req, res) => {
  try {
    const { albumId } = req.params;
    const user = await User.findById(req.user._id);

    const isFavorite = user.favorites.includes(albumId);
    res.json({ isFavorite });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seguir artista
router.post('/artists/:artistName', async (req, res) => {
  try {
    const { artistName } = req.params;

    const user = await User.findById(req.user._id);
    if (user.followedArtists.includes(artistName)) {
      return res.status(400).json({ error: 'Ya sigues a este artista' });
    }

    user.followedArtists.push(artistName);
    await user.save();

    res.json({ followedArtists: user.followedArtists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dejar de seguir artista
router.delete('/artists/:artistName', async (req, res) => {
  try {
    const { artistName } = req.params;

    const user = await User.findById(req.user._id);
    user.followedArtists = user.followedArtists.filter(artist => artist !== artistName);
    await user.save();

    res.json({ followedArtists: user.followedArtists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener artistas seguidos
router.get('/artists', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.followedArtists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar si sigue a un artista
router.get('/artists/:artistName/status', async (req, res) => {
  try {
    const { artistName } = req.params;
    const user = await User.findById(req.user._id);

    const isFollowing = user.followedArtists.includes(artistName);
    res.json({ isFollowing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;