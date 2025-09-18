const express = require('express');
const { Playlist } = require('../models/Playlist');
const User = require('../models/User');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');

// Obtener playlists del usuario
router.get('/user/:userId', authenticateToken, async (req, res) => {
  console.log('GET /api/playlists/user/:userId - Obteniendo playlists para usuario:', req.params.userId);
  try {
    const { userId } = req.params;
    const playlists = await Playlist.find({ user: userId })
      .populate('songs')
      .sort({ createdAt: -1 });
    console.log(`Encontradas ${playlists.length} playlists`);
    res.json(playlists);
  } catch (error) {
    console.error('Error obteniendo playlists:', error);
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
router.post('/', authenticateToken, async (req, res) => {
  console.log('POST /api/playlists - Creando playlist:', req.body);
  try {
    const { name, description, userId, isPublic } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      console.log('Usuario no encontrado:', userId);
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

    console.log('Playlist creada:', playlist._id);
    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error creando playlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agregar canción a playlist
router.post('/:id/songs', authenticateToken, async (req, res) => {
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
router.delete('/:id/songs/:songId', authenticateToken, async (req, res) => {
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
router.put('/:id', authenticateToken, async (req, res) => {
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
router.delete('/:id', authenticateToken, async (req, res) => {
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
      .populate('likes', 'username')
      .sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dar/quitar like a playlist
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    const likeCount = await playlist.toggleLike(req.user._id);
    res.json({ likes: likeCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compartir playlist
router.get('/:id/share', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    if (!playlist.isPublic) {
      return res.status(403).json({ error: 'Esta playlist no es pública' });
    }

    res.json({
      shareUrl: playlist.shareUrl,
      fullUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/playlist/${playlist.shareUrl}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acceder a playlist por URL de compartir
router.get('/shared/:shareUrl', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ shareUrl: req.params.shareUrl })
      .populate('user', 'username')
      .populate('songs')
      .populate('likes', 'username')
      .populate('collaborators', 'username');

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // Incrementar contador de reproducciones
    playlist.playCount += 1;
    await playlist.save();

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar colaborador a playlist
router.post('/:id/collaborators', authenticateToken, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // Solo el creador puede agregar colaboradores
    if (playlist.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Solo el creador puede gestionar colaboradores' });
    }

    if (!playlist.isCollaborative) {
      return res.status(400).json({ error: 'Esta playlist no es colaborativa' });
    }

    const { userId } = req.body;
    await playlist.addCollaborator(userId);

    await playlist.populate('collaborators', 'username');
    res.json(playlist.collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener playlists más populares
router.get('/popular/all', async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPublic: true })
      .populate('user', 'username')
      .populate('likes', 'username')
      .sort({ likes: -1, playCount: -1 })
      .limit(20);
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;