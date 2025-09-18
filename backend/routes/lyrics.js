const express = require('express');
const Lyrics = require('../models/Lyrics');
const { authenticateToken } = require('../middleware/auth');
const { paginate, sendPaginatedResponse } = require('../middleware/pagination');

const router = express.Router();

// Obtener letras de una canción
router.get('/song/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const lyrics = await Lyrics.find({ song: songId })
      .populate('submittedBy', 'username')
      .populate('verifiedBy', 'username')
      .sort({ isOfficial: -1, createdAt: -1 });

    res.json(lyrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener letra específica
router.get('/:id', async (req, res) => {
  try {
    const lyrics = await Lyrics.findById(req.params.id)
      .populate('song', 'title')
      .populate('submittedBy', 'username')
      .populate('verifiedBy', 'username');

    if (!lyrics) {
      return res.status(404).json({ error: 'Letra no encontrada' });
    }

    res.json(lyrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar letras por texto
router.get('/search/text', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Término de búsqueda requerido' });
    }

    const lyrics = await Lyrics.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .populate('song', 'title')
    .populate('submittedBy', 'username')
    .sort({ score: { $meta: 'textScore' } })
    .limit(parseInt(limit));

    res.json(lyrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar letra (usuario autenticado)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { songId, content, language = 'en' } = req.body;

    if (!songId || !content) {
      return res.status(400).json({ error: 'ID de canción y contenido requeridos' });
    }

    const lyrics = new Lyrics({
      song: songId,
      content,
      language,
      submittedBy: req.user.userId
    });

    await lyrics.save();
    await lyrics.populate('submittedBy', 'username');

    res.status(201).json(lyrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar letra (solo admin/moderador)
router.put('/:id/verify', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const lyrics = await Lyrics.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verifiedBy: req.user.userId,
        verificationDate: new Date()
      },
      { new: true }
    ).populate('verifiedBy', 'username');

    if (!lyrics) {
      return res.status(404).json({ error: 'Letra no encontrada' });
    }

    res.json(lyrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar letra
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const lyrics = await Lyrics.findById(req.params.id);

    if (!lyrics) {
      return res.status(404).json({ error: 'Letra no encontrada' });
    }

    // Solo el autor o admin puede editar
    if (lyrics.submittedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para editar esta letra' });
    }

    const { content, language } = req.body;
    lyrics.content = content || lyrics.content;
    lyrics.language = language || lyrics.language;

    await lyrics.save();
    await lyrics.populate('submittedBy', 'username');

    res.json(lyrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar letra
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const lyrics = await Lyrics.findById(req.params.id);

    if (!lyrics) {
      return res.status(404).json({ error: 'Letra no encontrada' });
    }

    // Solo el autor o admin puede eliminar
    if (lyrics.submittedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta letra' });
    }

    await Lyrics.findByIdAndDelete(req.params.id);
    res.json({ message: 'Letra eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;