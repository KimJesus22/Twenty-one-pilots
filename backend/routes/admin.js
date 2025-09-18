const express = require('express');
const { Album, Song } = require('../models/Discography');
const Product = require('../models/Product');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { albumSchemas, songSchemas, productSchemas, validate } = require('../validations/schemas');

const router = express.Router();

// Middleware para todas las rutas admin
router.use(authenticateToken);
router.use(requireRole('admin'));

// Gestión de Álbumes
router.get('/albums', async (req, res) => {
  try {
    const albums = await Album.find().populate('songs').sort({ createdAt: -1 });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/albums', validate(albumSchemas.create), async (req, res) => {
  try {
    const album = new Album(req.body);
    await album.save();
    res.status(201).json(album);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un álbum con ese título' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/albums/:id', validate(albumSchemas.update), async (req, res) => {
  try {
    const album = await Album.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/albums/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }

    // Eliminar todas las canciones del álbum
    await Song.deleteMany({ album: req.params.id });

    // Eliminar el álbum
    await Album.findByIdAndDelete(req.params.id);

    res.json({ message: 'Álbum y canciones asociadas eliminados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gestión de Canciones
router.get('/songs', async (req, res) => {
  try {
    const songs = await Song.find().populate('album').sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/songs', validate(songSchemas.create), async (req, res) => {
  try {
    const song = new Song(req.body);
    await song.save();
    await song.populate('album');
    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/songs/:id', validate(songSchemas.update), async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('album');

    if (!song) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }
    res.json({ message: 'Canción eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gestión de Productos
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', validate(productSchemas.create), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/products/:id', validate(productSchemas.update), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas del sistema
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      albums: await Album.countDocuments(),
      songs: await Song.countDocuments(),
      products: await Product.countDocuments(),
      users: await require('../models/User').countDocuments()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;