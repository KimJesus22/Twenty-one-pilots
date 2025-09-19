const { Album, Song } = require('../models/Discography');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class DiscographyController {
  // Obtener todos los álbumes con paginación y filtros
  async getAlbums(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'releaseYear',
        order = 'desc',
        search = ''
      } = req.query;

      const query = search
        ? { title: { $regex: search, $options: 'i' } }
        : {};

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        populate: 'songs'
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
}

module.exports = new DiscographyController();