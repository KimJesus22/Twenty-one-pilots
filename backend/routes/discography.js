/**
 * @swagger
 * tags:
 *   name: Discography
 *   description: Endpoints para gestión de álbumes y canciones
 */

const express = require('express');
const { query, param, body } = require('express-validator');
const discographyController = require('../controllers/discographyController');
const authService = require('../services/authService');
const logger = require('../utils/logger');

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
router.get('/albums',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100'),
    query('sort').optional().isIn(['title', 'releaseYear', 'createdAt']).withMessage('Sort inválido'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order debe ser asc o desc'),
    query('search').optional().isString().withMessage('Search debe ser un string'),
  ],
  discographyController.getAlbums
);

// Ruta para obtener un álbum específico
router.get('/albums/:id',
  [
    param('id').isMongoId().withMessage('ID de álbum inválido'),
  ],
  discographyController.getAlbumById
);

// Crear álbum (solo admin)
router.post('/albums',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Título requerido (1-200 caracteres)'),
    body('releaseYear').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Año de lanzamiento inválido'),
    body('coverImage').optional().isURL().withMessage('URL de imagen inválida'),
  ],
  discographyController.createAlbum
);

// Actualizar álbum (solo admin)
router.put('/albums/:id',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    param('id').isMongoId().withMessage('ID de álbum inválido'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Título inválido'),
    body('releaseYear').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Año de lanzamiento inválido'),
    body('coverImage').optional().isURL().withMessage('URL de imagen inválida'),
  ],
  discographyController.updateAlbum
);

// Eliminar álbum (solo admin)
router.delete('/albums/:id',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    param('id').isMongoId().withMessage('ID de álbum inválido'),
  ],
  discographyController.deleteAlbum
);

// Ruta para obtener todas las canciones
router.get('/songs',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100'),
    query('album').optional().isMongoId().withMessage('ID de álbum inválido'),
    query('search').optional().isString().withMessage('Search debe ser un string'),
  ],
  discographyController.getSongs
);

// Ruta para obtener una canción específica
router.get('/songs/:id',
  [
    param('id').isMongoId().withMessage('ID de canción inválido'),
  ],
  discographyController.getSongById
);

// Crear canción (solo admin)
router.post('/songs',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Título requerido (1-200 caracteres)'),
    body('album').isMongoId().withMessage('ID de álbum inválido'),
    body('lyrics').optional().isString().withMessage('Lyrics debe ser un string'),
    body('duration').optional().matches(/^(\d{1,2}:)?\d{1,2}:\d{2}$/).withMessage('Formato de duración inválido (MM:SS o H:MM:SS)'),
  ],
  discographyController.createSong
);

// Actualizar canción (solo admin)
router.put('/songs/:id',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    param('id').isMongoId().withMessage('ID de canción inválido'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Título inválido'),
    body('album').optional().isMongoId().withMessage('ID de álbum inválido'),
    body('lyrics').optional().isString().withMessage('Lyrics debe ser un string'),
    body('duration').optional().matches(/^(\d{1,2}:)?\d{1,2}:\d{2}$/).withMessage('Formato de duración inválido'),
  ],
  discographyController.updateSong
);

// Eliminar canción (solo admin)
router.delete('/songs/:id',
  authService.authenticateToken,
  authService.requireAdmin,
  [
    param('id').isMongoId().withMessage('ID de canción inválido'),
  ],
  discographyController.deleteSong
);

// Dar/quitar like a álbum
router.post('/albums/:id/like',
  [
    param('id').isMongoId().withMessage('ID de álbum inválido'),
    body('userId').isMongoId().withMessage('ID de usuario inválido'),
  ],
  discographyController.toggleAlbumLike
);

// Dar/quitar like a canción
router.post('/songs/:id/like',
  [
    param('id').isMongoId().withMessage('ID de canción inválido'),
    body('userId').isMongoId().withMessage('ID de usuario inválido'),
  ],
  discographyController.toggleSongLike
);

// Incrementar contador de reproducciones
router.post('/:type/:id/play',
  [
    param('type').isIn(['albums', 'songs']).withMessage('Tipo debe ser albums o songs'),
    param('id').isMongoId().withMessage('ID inválido'),
  ],
  discographyController.incrementPlayCount
);

// Obtener estadísticas de popularidad
router.get('/stats/popularity', discographyController.getPopularityStats);

// Obtener géneros disponibles
router.get('/genres', async (req, res) => {
  try {
    const genres = await require('../models/Discography').Album.distinct('genre');
    res.json({
      success: true,
      data: { genres }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo géneros'
    });
  }
});

// Obtener tipos disponibles
router.get('/types', async (req, res) => {
  try {
    const types = await require('../models/Discography').Album.distinct('type');
    res.json({
      success: true,
      data: { types }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tipos'
    });
  }
});

module.exports = router;