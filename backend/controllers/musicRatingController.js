const MusicRating = require('../models/MusicRating');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Crear o actualizar una valoración
 */
exports.createOrUpdateRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { targetType, targetId } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;

    // Verificar si ya existe una valoración
    const existingRating = await MusicRating.findOne({
      targetType,
      targetId,
      user: userId
    });

    let result;
    if (existingRating) {
      // Actualizar valoración existente
      existingRating.rating = rating;
      existingRating.updatedAt = new Date();
      result = await existingRating.save();
    } else {
      // Crear nueva valoración
      result = await MusicRating.create({
        targetType,
        targetId,
        user: userId,
        rating,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    logger.info(`Rating ${existingRating ? 'updated' : 'created'} for ${targetType}:${targetId} by user ${userId}`);

    res.json({
      success: true,
      message: existingRating ? 'Valoración actualizada' : 'Valoración creada',
      data: {
        rating: result.rating,
        created: !existingRating
      }
    });

  } catch (error) {
    logger.error('Error creating/updating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la valoración'
    });
  }
};

/**
 * Obtener valoración del usuario actual
 */
exports.getUserRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { targetType, targetId } = req.params;
    const userId = req.user._id;

    const rating = await MusicRating.findOne({
      targetType,
      targetId,
      user: userId
    }).select('rating createdAt');

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'No has valorado este elemento'
      });
    }

    res.json({
      success: true,
      data: {
        rating: rating.rating,
        createdAt: rating.createdAt
      }
    });

  } catch (error) {
    logger.error('Error getting user rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la valoración'
    });
  }
};

/**
 * Obtener estadísticas de valoraciones
 */
exports.getRatingStats = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { targetType, targetId } = req.params;

    const stats = await MusicRating.getRatingStats(targetType, targetId);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          averageRating: 0,
          totalRatings: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    const stat = stats[0];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Calcular distribución
    stat.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        averageRating: Math.round(stat.avgRating * 10) / 10,
        totalRatings: stat.totalRatings,
        distribution
      }
    });

  } catch (error) {
    logger.error('Error getting rating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

/**
 * Eliminar valoración del usuario
 */
exports.deleteUserRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { targetType, targetId } = req.params;
    const userId = req.user._id;

    const deletedRating = await MusicRating.findOneAndDelete({
      targetType,
      targetId,
      user: userId
    });

    if (!deletedRating) {
      return res.status(404).json({
        success: false,
        message: 'Valoración no encontrada'
      });
    }

    logger.info(`Rating deleted for ${targetType}:${targetId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Valoración eliminada exitosamente'
    });

  } catch (error) {
    logger.error('Error deleting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la valoración'
    });
  }
};