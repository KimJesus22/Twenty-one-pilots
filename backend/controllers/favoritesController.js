const favoritesService = require('../services/favoritesService');
const notificationsService = require('../services/notificationsService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class FavoritesController {
  /**
   * Agregar item a favoritos
   */
  async addToFavorites(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { itemType, itemId, itemData, tags, notes, rating, isPublic } = req.body;
      const userId = req.user.id;

      const favorite = await favoritesService.addToFavorites(userId, itemType, itemId, itemData, {
        tags,
        notes,
        rating,
        isPublic,
        sendNotification: true
      });

      res.status(201).json({
        success: true,
        message: 'Item agregado a favoritos exitosamente',
        data: { favorite }
      });
    } catch (error) {
      logger.error('Error en addToFavorites:', error);
      res.status(error.message === 'Item ya está en favoritos' ? 409 : 500).json({
        success: false,
        message: error.message || 'Error agregando item a favoritos'
      });
    }
  }

  /**
   * Remover item de favoritos
   */
  async removeFromFavorites(req, res) {
    try {
      const { itemType, itemId } = req.params;
      const userId = req.user.id;

      const favorite = await favoritesService.removeFromFavorites(userId, itemType, itemId);

      res.json({
        success: true,
        message: 'Item removido de favoritos exitosamente',
        data: { favorite }
      });
    } catch (error) {
      logger.error('Error en removeFromFavorites:', error);
      res.status(error.message === 'Item no encontrado en favoritos' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error removiendo item de favoritos'
      });
    }
  }

  /**
   * Verificar si un item está en favoritos
   */
  async checkFavorite(req, res) {
    try {
      const { itemType, itemId } = req.params;
      const userId = req.user.id;

      const isFavorite = await favoritesService.isFavorite(userId, itemType, itemId);

      res.json({
        success: true,
        data: { isFavorite }
      });
    } catch (error) {
      logger.error('Error en checkFavorite:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando favorito'
      });
    }
  }

  /**
   * Toggle favorito
   */
  async toggleFavorite(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { itemType, itemId, itemData, tags, notes, rating, isPublic } = req.body;
      const userId = req.user.id;

      const result = await favoritesService.toggleFavorite(userId, itemType, itemId, itemData, {
        tags,
        notes,
        rating,
        isPublic
      });

      const isAdding = result.constructor.modelName === 'Favorite';

      res.json({
        success: true,
        message: isAdding ? 'Item agregado a favoritos' : 'Item removido de favoritos',
        data: {
          favorite: isAdding ? result : null,
          removed: !isAdding ? result : null,
          isFavorite: isAdding
        }
      });
    } catch (error) {
      logger.error('Error en toggleFavorite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error cambiando estado de favorito'
      });
    }
  }

  /**
   * Obtener favoritos del usuario
   */
  async getUserFavorites(req, res) {
    try {
      const userId = req.user.id;
      const {
        itemType,
        search,
        rating,
        tags,
        sortBy = 'addedAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        itemType,
        search,
        rating: rating ? parseInt(rating) : undefined,
        tags: tags ? tags.split(',') : undefined,
        sortBy,
        sortOrder
      };

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await favoritesService.getUserFavorites(userId, filters, pagination);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error en getUserFavorites:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo favoritos'
      });
    }
  }

  /**
   * Actualizar favorito
   */
  async updateFavorite(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Remover campos que no se pueden actualizar directamente
      delete updates.user;
      delete updates.itemType;
      delete updates.itemId;
      delete updates.addedAt;

      const favorite = await favoritesService.updateFavorite(userId, id, updates);

      res.json({
        success: true,
        message: 'Favorito actualizado exitosamente',
        data: { favorite }
      });
    } catch (error) {
      logger.error('Error en updateFavorite:', error);
      res.status(error.message === 'Favorito no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error actualizando favorito'
      });
    }
  }

  /**
   * Agregar tags a favorito
   */
  async addTags(req, res) {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(tags) && typeof tags !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Tags debe ser un array o string'
        });
      }

      const Favorite = require('../models/Favorite');
      const favorite = await Favorite.findOne({ _id: id, user: userId });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorito no encontrado'
        });
      }

      await favorite.addTags(tags);

      res.json({
        success: true,
        message: 'Tags agregados exitosamente',
        data: { favorite }
      });
    } catch (error) {
      logger.error('Error en addTags:', error);
      res.status(500).json({
        success: false,
        message: 'Error agregando tags'
      });
    }
  }

  /**
   * Remover tags de favorito
   */
  async removeTags(req, res) {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(tags) && typeof tags !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Tags debe ser un array o string'
        });
      }

      const Favorite = require('../models/Favorite');
      const favorite = await Favorite.findOne({ _id: id, user: userId });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          message: 'Favorito no encontrado'
        });
      }

      await favorite.removeTags(tags);

      res.json({
        success: true,
        message: 'Tags removidos exitosamente',
        data: { favorite }
      });
    } catch (error) {
      logger.error('Error en removeTags:', error);
      res.status(500).json({
        success: false,
        message: 'Error removiendo tags'
      });
    }
  }

  /**
   * Obtener estadísticas de favoritos del usuario
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await favoritesService.getUserStats(userId);

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Error en getUserStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas'
      });
    }
  }

  /**
   * Obtener items populares
   */
  async getPopularItems(req, res) {
    try {
      const { itemType } = req.params;
      const { limit = 10 } = req.query;

      const popularItems = await favoritesService.getPopularItems(itemType, parseInt(limit));

      res.json({
        success: true,
        data: { popularItems }
      });
    } catch (error) {
      logger.error('Error en getPopularItems:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo items populares'
      });
    }
  }

  /**
   * Buscar en favoritos
   */
  async searchFavorites(req, res) {
    try {
      const userId = req.user.id;
      const { q: query, itemType, rating, tags, limit = 50 } = req.query;

      const filters = {
        itemType,
        rating: rating ? parseInt(rating) : undefined,
        tags: tags ? tags.split(',') : undefined,
        limit: parseInt(limit)
      };

      const favorites = await favoritesService.searchFavorites(userId, query, filters);

      res.json({
        success: true,
        data: { favorites }
      });
    } catch (error) {
      logger.error('Error en searchFavorites:', error);
      res.status(500).json({
        success: false,
        message: 'Error buscando en favoritos'
      });
    }
  }

  /**
   * Sincronizar datos de item
   */
  async syncItemData(req, res) {
    try {
      const { itemType, itemId } = req.params;
      const { data } = req.body;
      const userId = req.user.id;

      await favoritesService.syncItemData(userId, itemType, itemId, data);

      res.json({
        success: true,
        message: 'Datos sincronizados exitosamente'
      });
    } catch (error) {
      logger.error('Error en syncItemData:', error);
      res.status(500).json({
        success: false,
        message: 'Error sincronizando datos'
      });
    }
  }
}

module.exports = new FavoritesController();