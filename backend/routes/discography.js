/**
 * @swagger
 * tags:
 *   name: Discography
 *   description: Endpoints para gestión de álbumes y canciones
 */

const express = require('express');
const { Album, Song } = require('../models/Discography');
const { paginate, sendPaginatedResponse } = require('../middleware/pagination');
const { cachePublic, invalidateCache } = require('../middleware/cache');
const router = express.Router();

// Ruta para obtener todos los álbumes con paginación
/**
 * @swagger
 * /api/discography/albums:
 *   get:
 *     summary: Obtener lista de álbumes con paginación
 *     tags: [Discography]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de elementos por página
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [title, releaseYear, createdAt]
 *           default: createdAt
 *         description: Campo por el cual ordenar
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de álbumes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Album'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/albums', cachePublic('albums', 1800), paginate(Album), async (req, res) => {
  try {
    // Configurar populate para la paginación
    req.populate = ['songs'];
    await sendPaginatedResponse(req, res);
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