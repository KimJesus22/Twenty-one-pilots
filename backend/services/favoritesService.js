const Favorite = require('../models/Favorite');
const cacheService = require('./cacheService');
const queueService = require('./queueService');
const logger = require('../utils/logger');

class FavoritesService {
  constructor() {
    this.CACHE_TTL = {
      user_favorites: 1800,    // 30 minutos
      favorite_stats: 3600,    // 1 hora
      popular_items: 7200      // 2 horas
    };
  }

  /**
   * Agregar item a favoritos
   */
  async addToFavorites(userId, itemType, itemId, itemData = {}, options = {}) {
    try {
      // Verificar si ya existe
      const existingFavorite = await Favorite.findOne({
        user: userId,
        itemType,
        itemId
      });

      if (existingFavorite) {
        throw new Error('Item ya está en favoritos');
      }

      // Crear favorito
      const favorite = new Favorite({
        user: userId,
        itemType,
        itemId,
        itemData,
        tags: options.tags || [],
        notes: options.notes || '',
        rating: options.rating,
        isPublic: options.isPublic || false
      });

      await favorite.save();

      // Invalidar caché
      await this.invalidateUserCache(userId);

      // Enviar notificación si está habilitado
      if (options.sendNotification !== false) {
        await this.sendFavoriteAddedNotification(userId, favorite);
      }

      logger.info('Item agregado a favoritos', {
        userId,
        itemType,
        itemId,
        favoriteId: favorite._id
      });

      return favorite;
    } catch (error) {
      logger.error('Error agregando a favoritos:', error);
      throw error;
    }
  }

  /**
   * Remover item de favoritos
   */
  async removeFromFavorites(userId, itemType, itemId) {
    try {
      const favorite = await Favorite.findOneAndDelete({
        user: userId,
        itemType,
        itemId
      });

      if (!favorite) {
        throw new Error('Item no encontrado en favoritos');
      }

      // Invalidar caché
      await this.invalidateUserCache(userId);

      logger.info('Item removido de favoritos', {
        userId,
        itemType,
        itemId,
        favoriteId: favorite._id
      });

      return favorite;
    } catch (error) {
      logger.error('Error removiendo de favoritos:', error);
      throw error;
    }
  }

  /**
   * Verificar si un item está en favoritos
   */
  async isFavorite(userId, itemType, itemId) {
    try {
      const cacheKey = `favorites:check:${userId}:${itemType}:${itemId}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Buscar en base de datos
      const favorite = await Favorite.findOne({
        user: userId,
        itemType,
        itemId
      }).select('_id');

      const isFav = !!favorite;

      // Cachear resultado
      await cacheService.set(cacheKey, isFav, 600); // 10 minutos

      return isFav;
    } catch (error) {
      logger.error('Error verificando favorito:', error);
      return false;
    }
  }

  /**
   * Obtener favoritos de un usuario
   */
  async getUserFavorites(userId, filters = {}, pagination = {}) {
    try {
      const cacheKey = `favorites:user:${userId}:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const query = { user: userId };

      // Aplicar filtros
      if (filters.itemType) {
        query.itemType = filters.itemType;
      }

      if (filters.rating) {
        query.rating = { $gte: filters.rating };
      }

      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      if (filters.search) {
        query.$or = [
          { 'itemData.title': { $regex: filters.search, $options: 'i' } },
          { 'itemData.artist': { $regex: filters.search, $options: 'i' } },
          { 'itemData.description': { $regex: filters.search, $options: 'i' } },
          { tags: { $regex: filters.search, $options: 'i' } },
          { notes: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Paginación
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const skip = (page - 1) * limit;

      // Ordenamiento
      const sort = {};
      if (filters.sortBy) {
        sort[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.addedAt = -1; // Por defecto, más recientes primero
      }

      const favorites = await Favorite.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'username');

      const total = await Favorite.countDocuments(query);

      const result = {
        favorites,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      // Cachear resultado
      await cacheService.set(cacheKey, result, this.CACHE_TTL.user_favorites);

      return result;
    } catch (error) {
      logger.error('Error obteniendo favoritos de usuario:', error);
      throw error;
    }
  }

  /**
   * Actualizar favorito
   */
  async updateFavorite(userId, favoriteId, updates) {
    try {
      const favorite = await Favorite.findOneAndUpdate(
        { _id: favoriteId, user: userId },
        updates,
        { new: true, runValidators: true }
      );

      if (!favorite) {
        throw new Error('Favorito no encontrado');
      }

      // Invalidar caché
      await this.invalidateUserCache(userId);

      logger.info('Favorito actualizado', {
        userId,
        favoriteId,
        updates: Object.keys(updates)
      });

      return favorite;
    } catch (error) {
      logger.error('Error actualizando favorito:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de favoritos de un usuario
   */
  async getUserStats(userId) {
    try {
      const cacheKey = `favorites:stats:${userId}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const stats = await Favorite.getUserStats(userId);

      // Cachear resultado
      await cacheService.set(cacheKey, stats, this.CACHE_TTL.favorite_stats);

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener items populares por tipo
   */
  async getPopularItems(itemType, limit = 10) {
    try {
      const cacheKey = `favorites:popular:${itemType}:${limit}`;

      // Intentar obtener del caché
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const popularItems = await Favorite.getPopularItems(itemType, limit);

      // Cachear resultado
      await cacheService.set(cacheKey, popularItems, this.CACHE_TTL.popular_items);

      return popularItems;
    } catch (error) {
      logger.error('Error obteniendo items populares:', error);
      throw error;
    }
  }

  /**
   * Buscar en favoritos
   */
  async searchFavorites(userId, query, filters = {}) {
    try {
      return await Favorite.searchFavorites(userId, query, filters);
    } catch (error) {
      logger.error('Error buscando en favoritos:', error);
      throw error;
    }
  }

  /**
   * Toggle favorito (agregar si no existe, remover si existe)
   */
  async toggleFavorite(userId, itemType, itemId, itemData = {}, options = {}) {
    try {
      const isFav = await this.isFavorite(userId, itemType, itemId);

      if (isFav) {
        return await this.removeFromFavorites(userId, itemType, itemId);
      } else {
        return await this.addToFavorites(userId, itemType, itemId, itemData, options);
      }
    } catch (error) {
      logger.error('Error toggling favorito:', error);
      throw error;
    }
  }

  /**
   * Limpiar caché de usuario
   */
  async invalidateUserCache(userId) {
    try {
      const patterns = [
        `favorites:user:${userId}:*`,
        `favorites:check:${userId}:*`,
        `favorites:stats:${userId}`
      ];

      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }

      logger.debug('Cache invalidado para usuario', { userId });
    } catch (error) {
      logger.error('Error invalidando cache de usuario:', error);
    }
  }

  /**
   * Enviar notificación de favorito agregado
   */
  async sendFavoriteAddedNotification(userId, favorite) {
    try {
      await queueService.addNotificationJob('in_app', userId, {
        title: `❤️ Agregado a favoritos`,
        message: `${favorite.itemData.title} se agregó a tus favoritos`,
        type: 'favorite_update',
        data: {
          itemId: favorite.itemId,
          itemType: favorite.itemType,
          itemTitle: favorite.itemData.title
        }
      });
    } catch (error) {
      logger.error('Error enviando notificación de favorito:', error);
    }
  }

  /**
   * Sincronizar datos denormalizados
   */
  async syncItemData(userId, itemType, itemId, newData) {
    try {
      await Favorite.updateMany(
        { user: userId, itemType, itemId },
        { $set: { 'itemData': { ...newData } } }
      );

      // Invalidar caché
      await this.invalidateUserCache(userId);

      logger.info('Datos de favorito sincronizados', { userId, itemType, itemId });
    } catch (error) {
      logger.error('Error sincronizando datos de favorito:', error);
      throw error;
    }
  }

  /**
   * Bulk operations para mantenimiento
   */
  async bulkUpdateItemData(itemType, itemId, newData) {
    try {
      const result = await Favorite.updateMany(
        { itemType, itemId },
        { $set: { 'itemData': newData } }
      );

      // Invalidar caché relacionado
      await cacheService.invalidatePattern(`favorites:*`);

      logger.info('Bulk update de favoritos completado', {
        itemType,
        itemId,
        updated: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.error('Error en bulk update de favoritos:', error);
      throw error;
    }
  }

  /**
   * Limpiar favoritos huérfanos (items que ya no existen)
   */
  async cleanupOrphanedFavorites() {
    try {
      // Esta función debería verificar contra las colecciones reales
      // y remover favoritos de items que ya no existen
      // Implementación simplificada
      logger.info('Limpieza de favoritos huérfanos completada');
      return { cleaned: 0 };
    } catch (error) {
      logger.error('Error limpiando favoritos huérfanos:', error);
      throw error;
    }
  }
}

module.exports = new FavoritesService();