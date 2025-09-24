/**
 * Controlador de Wishlist para la aplicación Twenty One Pilots
 * Maneja todas las operaciones relacionadas con la lista de deseos de productos
 *
 * @author KimJesus21
 * @version 1.0.0
 * @since 2025-09-24
 */

const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Obtener wishlist del usuario
 */
const getUserWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info('📋 Obteniendo wishlist del usuario', { userId });

    const user = await User.findById(userId).populate({
      path: 'wishlist.product',
      select: 'name price images category stock isAvailable'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Filtrar items con productos disponibles
    const availableItems = user.wishlist.filter(item => item.product && item.product.isAvailable);

    res.json({
      success: true,
      data: availableItems,
      totalItems: availableItems.length
    });
  } catch (error) {
    logger.error('❌ Error obteniendo wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Agregar producto a wishlist
 */
const addToWishlist = async (req, res) => {
  try {
    const { userId, productId, notes } = req.body;

    logger.info('➕ Agregando producto a wishlist', { userId, productId });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.addToWishlist(productId, notes);

    // Obtener el item agregado con populate
    await user.populate({
      path: 'wishlist.product',
      select: 'name price images category stock isAvailable'
    });

    const addedItem = user.wishlist.find(item => item.product._id.toString() === productId);

    res.status(201).json({
      success: true,
      data: addedItem,
      message: 'Producto agregado a la wishlist exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error agregando a wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Remover producto de wishlist
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    logger.info('➖ Removiendo producto de wishlist', { userId, productId });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.removeFromWishlist(productId);

    res.json({
      success: true,
      message: 'Producto removido de la wishlist exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error removiendo de wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar si producto está en wishlist
 */
const checkWishlistStatus = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const isInWishlist = user.isInWishlist(productId);
    const item = isInWishlist ? user.getWishlistItem(productId) : null;

    res.json({
      success: true,
      data: {
        isInWishlist,
        item: item,
        productId
      }
    });
  } catch (error) {
    logger.error('❌ Error verificando status de wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar notas de un item en wishlist
 */
const updateWishlistNotes = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { notes } = req.body;

    logger.info('📝 Actualizando notas de wishlist', { userId, productId });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.updateWishlistNotes(productId, notes);

    res.json({
      success: true,
      message: 'Notas actualizadas exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error actualizando notas de wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Limpiar wishlist completa
 */
const clearWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info('🗑️ Limpiando wishlist completa', { userId });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    user.wishlist = [];
    await user.save();

    res.json({
      success: true,
      message: 'Wishlist limpiada exitosamente'
    });
  } catch (error) {
    logger.error('❌ Error limpiando wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener estadísticas de wishlist
 */
const getWishlistStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate({
      path: 'wishlist.product',
      select: 'price category'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const stats = {
      totalItems: user.wishlist.length,
      availableItems: user.wishlist.filter(item => item.product && item.product.isAvailable).length,
      totalValue: user.wishlist
        .filter(item => item.product && item.product.isAvailable)
        .reduce((sum, item) => sum + (item.product.price || 0), 0),
      categories: {}
    };

    // Contar por categorías
    user.wishlist.forEach(item => {
      if (item.product && item.product.category) {
        stats.categories[item.product.category] = (stats.categories[item.product.category] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Error obteniendo estadísticas de wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener recomendaciones basadas en wishlist
 */
const getWishlistRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info('💡 Obteniendo recomendaciones de wishlist', { userId });

    const user = await User.findById(userId).populate({
      path: 'wishlist.product',
      select: 'category'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener categorías de productos en wishlist
    const categories = [...new Set(
      user.wishlist
        .map(item => item.product?.category)
        .filter(Boolean)
    )];

    if (categories.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Importar modelo Product aquí para evitar dependencias circulares
    const Product = require('../models/Product');

    // Obtener productos similares basados en categorías
    const recommendations = await Product.find({
      category: { $in: categories },
      isAvailable: true,
      _id: { $nin: user.wishlist.map(item => item.product?._id).filter(Boolean) }
    })
    .select('name price images category popularity')
    .limit(10)
    .sort({ popularity: -1, createdAt: -1 });

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('❌ Error obteniendo recomendaciones de wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  updateWishlistNotes,
  clearWishlist,
  getWishlistStats,
  getWishlistRecommendations
};