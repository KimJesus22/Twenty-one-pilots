const express = require('express');
const ConcertTrivia = require('../models/ConcertTrivia');
const { authenticateToken } = require('../middleware/auth');
const { paginate, sendPaginatedResponse } = require('../middleware/pagination');

const router = express.Router();

// Obtener curiosidades/reseñas de un concierto
router.get('/concert/:concertId', paginate(ConcertTrivia), async (req, res) => {
  try {
    req.filter = { concert: req.params.concertId };
    req.populate = ['author', 'verifiedBy', 'comments.user'];
    await sendPaginatedResponse(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener por tipo (trivia, review, etc.)
router.get('/type/:type', paginate(ConcertTrivia), async (req, res) => {
  try {
    req.filter = { type: req.params.type };
    req.populate = ['concert', 'author', 'verifiedBy'];
    await sendPaginatedResponse(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar por tags
router.get('/tags/:tag', paginate(ConcertTrivia), async (req, res) => {
  try {
    req.filter = { tags: req.params.tag };
    req.populate = ['concert', 'author'];
    await sendPaginatedResponse(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener item específico
router.get('/:id', async (req, res) => {
  try {
    const trivia = await ConcertTrivia.findById(req.params.id)
      .populate('concert', 'name venue_name city')
      .populate('author', 'username')
      .populate('verifiedBy', 'username')
      .populate('comments.user', 'username');

    if (!trivia) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    res.json(trivia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva curiosidad/reseña
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { concertId, type, title, content, images, tags, rating } = req.body;

    if (!concertId || !type || !title || !content) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const trivia = new ConcertTrivia({
      concert: concertId,
      type,
      title,
      content,
      author: req.user.userId,
      images: images || [],
      tags: tags || [],
      rating: type === 'review' ? rating : undefined
    });

    await trivia.save();
    await trivia.populate('author', 'username');
    await trivia.populate('concert', 'name');

    res.status(201).json(trivia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dar like a una curiosidad/reseña
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const trivia = await ConcertTrivia.findById(req.params.id);

    if (!trivia) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    const userId = req.user.userId;
    const likeIndex = trivia.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Ya le dio like, quitar
      trivia.likes.splice(likeIndex, 1);
    } else {
      // Agregar like
      trivia.likes.push(userId);
    }

    await trivia.save();
    await trivia.populate('likes', 'username');

    res.json({
      liked: likeIndex === -1,
      likesCount: trivia.likes.length,
      likes: trivia.likes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar comentario
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Contenido del comentario requerido' });
    }

    const trivia = await ConcertTrivia.findById(req.params.id);

    if (!trivia) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    const comment = {
      user: req.user.userId,
      content,
      createdAt: new Date()
    };

    trivia.comments.push(comment);
    await trivia.save();
    await trivia.populate('comments.user', 'username');

    res.status(201).json(trivia.comments[trivia.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar contenido (solo admin)
router.put('/:id/verify', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const trivia = await ConcertTrivia.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verifiedBy: req.user.userId
      },
      { new: true }
    ).populate('verifiedBy', 'username');

    if (!trivia) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    res.json(trivia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar contenido
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const trivia = await ConcertTrivia.findById(req.params.id);

    if (!trivia) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    // Solo el autor o admin puede editar
    if (trivia.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para editar este contenido' });
    }

    const { title, content, images, tags, rating } = req.body;

    if (title) trivia.title = title;
    if (content) trivia.content = content;
    if (images) trivia.images = images;
    if (tags) trivia.tags = tags;
    if (rating && trivia.type === 'review') trivia.rating = rating;

    await trivia.save();
    await trivia.populate('author', 'username');

    res.json(trivia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar contenido
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const trivia = await ConcertTrivia.findById(req.params.id);

    if (!trivia) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }

    // Solo el autor o admin puede eliminar
    if (trivia.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este contenido' });
    }

    await ConcertTrivia.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contenido eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;