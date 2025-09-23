const { Album, Song } = require('../models/Discography');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class DiscographyController {
  // Obtener todos los álbumes con paginación y filtros avanzados
  async getAlbums(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        sort = 'releaseYear',
        order = 'desc',
        search = '',
        genre,
        type,
        minYear,
        maxYear,
        minPopularity,
        maxPopularity
      } = req.query;

      const query = { isAvailable: true };

      // Búsqueda por título o artista
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { artist: { $regex: search, $options: 'i' } }
        ];
      }

      // Filtros adicionales
      if (genre && genre !== 'all') query.genre = genre;
      if (type && type !== 'all') query.type = type;
      if (minYear || maxYear) {
        query.releaseYear = {};
        if (minYear) query.releaseYear.$gte = parseInt(minYear);
        if (maxYear) query.releaseYear.$lte = parseInt(maxYear);
      }
      if (minPopularity || maxPopularity) {
        query.popularity = {};
        if (minPopularity) query.popularity.$gte = parseInt(minPopularity);
        if (maxPopularity) query.popularity.$lte = parseInt(maxPopularity);
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        populate: {
          path: 'songs',
          options: { sort: { trackNumber: 1 } }
        }
      };

      const result = await Album.paginate(query, options);

      res.json({
        success: true,
        data: {
          albums: result.docs,
          pagination: {
            page: result.page,
            pages: result.totalPages,
            total: result.totalDocs,
            limit: result.limit
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo álbumes:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo álbumes'
      });
    }
  }

  // Obtener un álbum específico
  async getAlbumById(req, res) {
    try {
      const { id } = req.params;

      const album = await Album.findById(id).populate('songs');
      if (!album) {
        return res.status(404).json({
          success: false,
          message: 'Álbum no encontrado'
        });
      }

      res.json({
        success: true,
        data: { album }
      });
    } catch (error) {
      logger.error('Error obteniendo álbum:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo álbum'
      });
    }
  }

  // Crear nuevo álbum (solo admin)
  async createAlbum(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const album = new Album(req.body);
      await album.save();

      res.status(201).json({
        success: true,
        message: 'Álbum creado exitosamente',
        data: { album }
      });
    } catch (error) {
      logger.error('Error creando álbum:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando álbum'
      });
    }
  }

  // Actualizar álbum (solo admin)
  async updateAlbum(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const album = await Album.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });

      if (!album) {
        return res.status(404).json({
          success: false,
          message: 'Álbum no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Álbum actualizado exitosamente',
        data: { album }
      });
    } catch (error) {
      logger.error('Error actualizando álbum:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando álbum'
      });
    }
  }

  // Eliminar álbum (solo admin)
  async deleteAlbum(req, res) {
    try {
      const { id } = req.params;

      const album = await Album.findByIdAndDelete(id);
      if (!album) {
        return res.status(404).json({
          success: false,
          message: 'Álbum no encontrado'
        });
      }

      // Eliminar también las canciones asociadas
      await Song.deleteMany({ album: id });

      res.json({
        success: true,
        message: 'Álbum eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando álbum:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando álbum'
      });
    }
  }

  // Obtener todas las canciones
  async getSongs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        album,
        search = ''
      } = req.query;

      const query = {};
      if (album) query.album = album;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { lyrics: { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: 'album'
      };

      const result = await Song.paginate(query, options);

      res.json({
        success: true,
        data: {
          songs: result.docs,
          pagination: {
            page: result.page,
            pages: result.totalPages,
            total: result.totalDocs,
            limit: result.limit
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo canciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo canciones'
      });
    }
  }

  // Obtener canción por ID
  async getSongById(req, res) {
    try {
      const { id } = req.params;

      const song = await Song.findById(id).populate('album');
      if (!song) {
        return res.status(404).json({
          success: false,
          message: 'Canción no encontrada'
        });
      }

      res.json({
        success: true,
        data: { song }
      });
    } catch (error) {
      logger.error('Error obteniendo canción:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo canción'
      });
    }
  }

  // Crear nueva canción (solo admin)
  async createSong(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const song = new Song(req.body);
      await song.save();

      // Agregar la canción al álbum correspondiente
      if (song.album) {
        await Album.findByIdAndUpdate(song.album, {
          $push: { songs: song._id }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Canción creada exitosamente',
        data: { song }
      });
    } catch (error) {
      logger.error('Error creando canción:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando canción'
      });
    }
  }

  // Actualizar canción (solo admin)
  async updateSong(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const song = await Song.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      }).populate('album');

      if (!song) {
        return res.status(404).json({
          success: false,
          message: 'Canción no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Canción actualizada exitosamente',
        data: { song }
      });
    } catch (error) {
      logger.error('Error actualizando canción:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando canción'
      });
    }
  }

  // Eliminar canción (solo admin)
  async deleteSong(req, res) {
    try {
      const { id } = req.params;

      const song = await Song.findByIdAndDelete(id);
      if (!song) {
        return res.status(404).json({
          success: false,
          message: 'Canción no encontrada'
        });
      }

      // Remover la canción del álbum
      if (song.album) {
        await Album.findByIdAndUpdate(song.album, {
          $pull: { songs: song._id }
        });
      }

      res.json({
        success: true,
        message: 'Canción eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando canción:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando canción'
      });
    }
  }

  // Dar/quitar like a un álbum
  async toggleAlbumLike(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const album = await Album.findById(id);
      if (!album) {
        return res.status(404).json({
          success: false,
          message: 'Álbum no encontrado'
        });
      }

      const userIndex = album.likes.indexOf(userId);
      if (userIndex > -1) {
        album.likes.splice(userIndex, 1);
      } else {
        album.likes.push(userId);
      }

      await album.save();

      res.json({
        success: true,
        data: {
          likes: album.likes.length,
          isLiked: userIndex === -1
        }
      });
    } catch (error) {
      logger.error('Error toggling album like:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando like'
      });
    }
  }

  // Dar/quitar like a una canción
  async toggleSongLike(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const song = await Song.findById(id);
      if (!song) {
        return res.status(404).json({
          success: false,
          message: 'Canción no encontrada'
        });
      }

      const userIndex = song.likes.indexOf(userId);
      if (userIndex > -1) {
        song.likes.splice(userIndex, 1);
      } else {
        song.likes.push(userId);
      }

      await song.save();

      res.json({
        success: true,
        data: {
          likes: song.likes.length,
          isLiked: userIndex === -1
        }
      });
    } catch (error) {
      logger.error('Error toggling song like:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando like'
      });
    }
  }

  // Incrementar contador de reproducciones
  async incrementPlayCount(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.body; // 'album' or 'song'

      if (type === 'album') {
        await Album.findByIdAndUpdate(id, { $inc: { views: 1 } });
      } else if (type === 'song') {
        await Song.findByIdAndUpdate(id, { $inc: { playCount: 1 } });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Error incrementing play count:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando contador'
      });
    }
  }

  // Obtener estadísticas de popularidad
  async getPopularityStats(req, res) {
    try {
      // Verificar conexión a MongoDB
      if (!require('mongoose').connection.readyState) {
        logger.warn('MongoDB no conectado, devolviendo estadísticas por defecto');
        return res.json({
          success: true,
          data: {
            albums: { totalAlbums: 0, totalViews: 0, totalLikes: 0, avgPopularity: 0 },
            songs: { totalSongs: 0, totalPlays: 0, totalLikes: 0, avgPopularity: 0 }
          }
        });
      }

      const albumStats = await Album.aggregate([
        {
          $group: {
            _id: null,
            totalAlbums: { $sum: 1 },
            totalViews: { $sum: '$views' },
            totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
            avgPopularity: { $avg: '$popularity' }
          }
        }
      ]);

      const songStats = await Song.aggregate([
        {
          $group: {
            _id: null,
            totalSongs: { $sum: 1 },
            totalPlays: { $sum: '$playCount' },
            totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
            avgPopularity: { $avg: '$popularity' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          albums: albumStats[0] || { totalAlbums: 0, totalViews: 0, totalLikes: 0, avgPopularity: 0 },
          songs: songStats[0] || { totalSongs: 0, totalPlays: 0, totalLikes: 0, avgPopularity: 0 }
        }
      });
    } catch (error) {
      logger.error('Error getting popularity stats:', error);
      // En caso de error, devolver estadísticas por defecto
      res.json({
        success: true,
        data: {
          albums: { totalAlbums: 0, totalViews: 0, totalLikes: 0, avgPopularity: 0 },
          songs: { totalSongs: 0, totalPlays: 0, totalLikes: 0, avgPopularity: 0 }
        }
      });
    }
  }
}

module.exports = new DiscographyController();