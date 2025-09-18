const express = require('express');
const { Thread } = require('../models/Forum');
const User = require('../models/User');
const router = express.Router();

// Middleware para verificar autenticación (simplificado)
const requireAuth = (req, res, next) => {
  // En producción, verificar JWT token
  next();
};

// Obtener todos los hilos
router.get('/threads', async (req, res) => {
  try {
    const threads = await Thread.find()
      .populate('author', 'username')
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un hilo específico
router.get('/threads/:id', async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments.author', 'username');
    if (!thread) {
      return res.status(404).json({ error: 'Hilo no encontrado' });
    }
    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo hilo
router.post('/threads', requireAuth, async (req, res) => {
  try {
    const { title, content, authorId } = req.body;

    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const thread = new Thread({
      title,
      content,
      author: authorId,
    });

    await thread.save();
    await thread.populate('author', 'username');

    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar comentario a un hilo
router.post('/threads/:id/comments', requireAuth, async (req, res) => {
  try {
    const { content, authorId } = req.body;

    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Hilo no encontrado' });
    }

    thread.comments.push({
      content,
      author: authorId,
    });

    await thread.save();
    await thread.populate('comments.author', 'username');

    res.status(201).json(thread.comments[thread.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;