const MusicComment = require('../models/MusicComment');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const moderationService = require('../services/moderationService');

/**
 * Obtener comentarios de un elemento musical
 */
exports.getComments = async (req, res) => {
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
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      includeReplies = false
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
      includeReplies: includeReplies === 'true'
    };

    const comments = await MusicComment.getComments(targetType, targetId, options);
    const totalCount = await MusicComment.countComments(targetType, targetId);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios'
    });
  }
};

/**
 * Crear un nuevo comentario/reseña
 */
exports.createComment = async (req, res) => {
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

    // Verificar si el usuario ya tiene una reseña para este elemento
    const existingComment = await MusicComment.canUserComment(targetType, targetId, userId);
    if (existingComment) {
      return res.status(409).json({
        success: false,
        message: 'Ya has dejado una reseña para este elemento'
      });
    }

    const commentData = {
      targetType,
      targetId,
      author: userId,
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Moderación automática del contenido
    const moderationResult = moderationService.moderateContent(
      commentData.content,
      commentData.title
    );

    // Si no pasa la moderación automática, marcar como pendiente
    if (!moderationResult.isApproved) {
      commentData.status = 'pending';
      logger.warn('Comentario marcado como pendiente por moderación automática', {
        userId,
        reasons: moderationResult.reasons,
        score: moderationResult.score
      });
    }

    const comment = await MusicComment.create(commentData);

    // Agregar información de moderación al comentario
    if (!moderationResult.isApproved) {
      comment.moderationReason = moderationResult.reasons.join('; ');
      await comment.save();
    }

    // Populate author data
    await comment.populate('author', 'username avatar');

    logger.info(`Comment created for ${targetType}:${targetId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Comentario creado exitosamente',
      data: comment
    });

  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el comentario'
    });
  }
};

/**
 * Obtener respuestas de un comentario
 */
exports.getCommentReplies = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const replies = await MusicComment.getCommentReplies(
      commentId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        replies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error getting comment replies:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener respuestas'
    });
  }
};

/**
 * Crear una respuesta a un comentario
 */
exports.createReply = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const userId = req.user._id;

    // Verificar que el comentario padre existe
    const parentComment = await MusicComment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario padre no encontrado'
      });
    }

    const replyData = {
      targetType: parentComment.targetType,
      targetId: parentComment.targetId,
      author: userId,
      parentComment: commentId,
      content: req.body.content,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const reply = await MusicComment.create(replyData);
    await reply.populate('author', 'username avatar');

    logger.info(`Reply created for comment ${commentId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Respuesta creada exitosamente',
      data: reply
    });

  } catch (error) {
    logger.error('Error creating reply:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la respuesta'
    });
  }
};

/**
 * Votar en un comentario
 */
exports.voteComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    const comment = await MusicComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    await comment.addVote(userId, voteType);

    logger.info(`Vote ${voteType} added to comment ${commentId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Voto registrado exitosamente',
      data: {
        likes: comment.voteCount.likes,
        dislikes: comment.voteCount.dislikes,
        userVote: voteType
      }
    });

  } catch (error) {
    logger.error('Error voting on comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el voto'
    });
  }
};

/**
 * Reportar un comentario
 */
exports.reportComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const comment = await MusicComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    try {
      await comment.report(userId, reason);
      logger.info(`Comment ${commentId} reported by user ${userId}`);
    } catch (error) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Reporte enviado exitosamente'
    });

  } catch (error) {
    logger.error('Error reporting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reportar el comentario'
    });
  }
};

/**
 * Editar un comentario propio
 */
exports.editComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await MusicComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    // Verificar que el usuario es el autor
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este comentario'
      });
    }

    try {
      await comment.edit(req.body.title, req.body.content);
      logger.info(`Comment ${commentId} edited by user ${userId}`);
    } catch (error) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Comentario editado exitosamente',
      data: comment
    });

  } catch (error) {
    logger.error('Error editing comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar el comentario'
    });
  }
};

/**
 * Eliminar un comentario propio
 */
exports.deleteComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await MusicComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    // Verificar que el usuario es el autor
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este comentario'
      });
    }

    await MusicComment.findByIdAndDelete(commentId);

    logger.info(`Comment ${commentId} deleted by user ${userId}`);

    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente'
    });

  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el comentario'
    });
  }
};

/**
 * Marcar/desmarcar comentario como destacado (solo moderadores)
 */
exports.toggleFeatured = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const { featured } = req.body;
    const moderatorId = req.user._id;

    const comment = await MusicComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    await comment.feature(featured);

    logger.info(`Comment ${commentId} ${featured ? 'featured' : 'unfeatured'} by moderator ${moderatorId}`);

    res.json({
      success: true,
      message: `Comentario ${featured ? 'marcado como destacado' : 'desmarcado como destacado'}`,
      data: { isFeatured: comment.isFeatured }
    });

  } catch (error) {
    logger.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado destacado'
    });
  }
};

/**
 * Moderar comentario (solo moderadores)
 */
exports.moderateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { commentId } = req.params;
    const { status, reason } = req.body;
    const moderatorId = req.user._id;

    const comment = await MusicComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    await comment.moderate(status, moderatorId, reason);

    logger.info(`Comment ${commentId} moderated to ${status} by moderator ${moderatorId}`);

    res.json({
      success: true,
      message: 'Comentario moderado exitosamente',
      data: { status: comment.status }
    });

  } catch (error) {
    logger.error('Error moderating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al moderar el comentario'
    });
  }
};