const express = require('express');
const { Playlist } = require('../models/Playlist');
const User = require('../models/User');
const router = express.Router();

// Middleware para verificar autenticación (simplificado)
const requireAuth = (req, res, next) => {
  // En producción, verificar JWT token
  next();
};

// Obtener playlists del usuario
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const playlists = await Playlist.find({ user: userId })
      .populate('songs')
      .sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener playlist específica
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('user', 'username')
      .populate('songs');
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva playlist
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, userId, isPublic } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const playlist = new Playlist({
      name,
      description,
      user: userId,
      isPublic: isPublic || false,
    });

    await playlist.save();
    await playlist.populate('user', 'username');

    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar canción a playlist
router.post('/:id/songs', requireAuth, async (req, res) => {
  try {
    const { songId, userId } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // Verificar que el usuario sea el propietario
    if (playlist.user.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Verificar que la canción no esté ya en la playlist
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ error: 'Canción ya está en la playlist' });
    }

    playlist.songs.push(songId);
    await playlist.save();
    await playlist.populate('songs');

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar canción de playlist
router.delete('/:id/songs/:songId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // Verificar que el usuario sea el propietario
    if (playlist.user.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    playlist.songs = playlist.songs.filter(song => song.toString() !== req.params.songId);
    await playlist.save();
    await playlist.populate('songs');

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar playlist
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { userId, name, description, isPublic } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // Verificar que el usuario sea el propietario
    if (playlist.user.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    playlist.name = name || playlist.name;
    playlist.description = description || playlist.description;
    playlist.isPublic = isPublic !== undefined ? isPublic : playlist.isPublic;

    await playlist.save();
    await playlist.populate('user', 'username');

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar playlist
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // Verificar que el usuario sea el propietario
    if (playlist.user.toString() !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Playlist eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener playlists públicas
router.get('/public/all', async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPublic: true })
      .populate('user', 'username')
      .populate('songs')
      .sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;