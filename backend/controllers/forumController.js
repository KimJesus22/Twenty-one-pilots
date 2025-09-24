const { Thread, Comment } = require('../models/Forum');
const User = require('../models/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const forumUtils = require('../utils/forumUtils');

class ForumController {
  // Obtener hilos con filtros avanzados y paginación
  async getThreads(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        tags,
        author,
        search,
        sort = 'lastActivity',
        order = 'desc',
        minDate,
        maxDate
      } = req.query;

      // Construir query
      const query = {};

      if (category && category !== 'all') {
        query.category = category;
      }

      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query.tags = { $in: tagArray };
      }

      if (author) {
        query.author = author;
      }

      if (search) {
        query.$text = { $search: search };
      }

      if (minDate || maxDate) {
        query.createdAt = {};
        if (minDate) query.createdAt.$gte = new Date(minDate);
        if (maxDate) query.createdAt.$lte = new Date(maxDate);
      }

      // Configurar ordenamiento
      let sortOptions = {};
      switch (sort) {
        case 'createdAt':
          sortOptions = { createdAt: order === 'desc' ? -1 : 1 };
          break;
        case 'popularity':
          sortOptions = { 'voteCount.likes': -1, 'voteCount.dislikes': 1 };
          break;
        case 'comments':
          sortOptions = { commentCount: -1 };
          break;
        case 'views':
          sortOptions = { viewCount: -1 };
          break;
        case 'lastActivity':
        default:
          sortOptions = { isPinned: -1, lastActivity: -1 };
          break;
      }

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50),
        sort: sortOptions,
        populate: [
          { path: 'author', select: 'username' },
          { path: 'comments', select: 'author createdAt', populate: { path: 'author', select: 'username' } }
        ]
      };

      const result = await Thread.paginate(query, options);

      res.json({
        success: true,
        data: {
          threads: result.docs,
          pagination: {
            page: result.page,
            pages: result.totalPages,
            total: result.totalDocs,
            limit: result.limit
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo hilos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo hilos'
      });
    }
  }

  // Obtener hilo específico con incremento de vistas
  async getThreadById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Para marcar si el usuario ya votó

      const thread = await Thread.findById(id)
        .populate('author', 'username')
        .populate({
          path: 'comments',
          populate: { path: 'author', select: 'username' },
          options: { sort: { createdAt: 1 } }
        });

      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Hilo no encontrado'
        });
      }

      // Incrementar contador de vistas (solo si no es el autor)
      if (userId && thread.author._id.toString() !== userId) {
        await thread.incrementViews();
      }

      // Agregar información de votos del usuario actual
      const threadWithUserVotes = {
        ...thread.toObject(),
        userVote: userId ? thread.votes.find(v => v.user.toString() === userId)?.type : null,
        comments: thread.comments.map(comment => ({
          ...comment.toObject(),
          userVote: userId ? comment.votes.find(v => v.user.toString() === userId)?.type : null
        }))
      };

      res.json({
        success: true,
        data: { thread: threadWithUserVotes }
      });
    } catch (error) {
      logger.error('Error obteniendo hilo:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo hilo'
      });
    }
  }

  // Crear nuevo hilo
  async createThread(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { title, content, category, tags } = req.body;
      const authorId = req.user.id;

      // Extraer menciones y tags del contenido
      const contentMentions = forumUtils.extractMentions(content);
      const titleMentions = forumUtils.extractMentions(title);
      const allMentions = [...new Set([...contentMentions, ...titleMentions])];

      const contentTags = forumUtils.extractTags(content);
      const titleTags = forumUtils.extractTags(title);
      const manualTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
      const allTags = [...new Set([...contentTags, ...titleTags, ...manualTags])];

      // Validar menciones
      const { valid: validMentions } = await forumUtils.validateMentions(allMentions, User);

      const thread = new Thread({
        title,
        content,
        author: authorId,
        category: category || 'general',
        tags: allTags,
        mentions: validMentions.map(m => m.userId)
      });

      await thread.save();
      await thread.populate('author', 'username');

      logger.info('Nuevo hilo creado:', {
        threadId: thread._id,
        authorId,
        title: title.substring(0, 50)
      });

      // Emitir evento en tiempo real
      if (global.io) {
        global.io.to('forum').emit('thread-created', {
          thread: thread.toObject(),
          author: thread.author
        });

        // Notificar a usuarios mencionados
        validMentions.forEach(mention => {
          if (mention.userId.toString() !== authorId) {
            global.io.to(`user-${mention.userId}`).emit('notification', {
              type: 'mention',
              threadId: thread._id,
              threadTitle: thread.title,
              mentionedBy: thread.author.username,
              message: `${thread.author.username} te mencionó en un hilo: "${thread.title}"`
            });
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Hilo creado exitosamente',
        data: { thread }
      });
    } catch (error) {
      logger.error('Error creando hilo:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando hilo'
      });
    }
  }

  // Actualizar hilo (solo autor)
  async updateThread(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { title, content, category, tags } = req.body;
      const userId = req.user.id;

      const thread = await Thread.findById(id);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Hilo no encontrado'
        });
      }

      // Verificar permisos
      if (thread.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este hilo'
        });
      }

      // Actualizar campos
      thread.title = title;
      thread.content = content;
      thread.category = category || thread.category;
      thread.tags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : thread.tags;
      thread.isEdited = true;
      thread.editedAt = new Date();

      await thread.save();
      await thread.populate('author', 'username');

      logger.info('Hilo actualizado:', { threadId: id, userId });

      res.json({
        success: true,
        message: 'Hilo actualizado exitosamente',
        data: { thread }
      });
    } catch (error) {
      logger.error('Error actualizando hilo:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando hilo'
      });
    }
  }

  // Eliminar hilo (solo autor)
  async deleteThread(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const thread = await Thread.findById(id);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Hilo no encontrado'
        });
      }

      // Verificar permisos
      if (thread.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este hilo'
        });
      }

      await Thread.findByIdAndDelete(id);
      // Los comentarios se eliminan automáticamente por el middleware

      logger.info('Hilo eliminado:', { threadId: id, userId });

      res.json({
        success: true,
        message: 'Hilo eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando hilo:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando hilo'
      });
    }
  }

  // Votar en hilo
  async voteThread(req, res) {
    try {
      const { id } = req.params;
      const { voteType } = req.body; // 'like' o 'dislike'
      const userId = req.user.id;

      if (!['like', 'dislike'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de voto inválido'
        });
      }

      const thread = await Thread.findById(id);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Hilo no encontrado'
        });
      }

      await thread.addVote(userId, voteType);

      // Emitir evento en tiempo real
      if (global.io) {
        global.io.to(`thread-${id}`).emit('thread-vote', {
          threadId: id,
          voteCount: thread.voteCount,
          userVote: voteType,
          voterId: userId
        });
      }

      res.json({
        success: true,
        message: 'Voto registrado',
        data: {
          voteCount: thread.voteCount,
          userVote: voteType
        }
      });
    } catch (error) {
      logger.error('Error votando en hilo:', error);
      res.status(500).json({
        success: false,
        message: 'Error registrando voto'
      });
    }
  }

  // Crear comentario
  async createComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params; // thread ID
      const { content, parentCommentId } = req.body;
      const authorId = req.user.id;

      const thread = await Thread.findById(id);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Hilo no encontrado'
        });
      }

      if (thread.isLocked) {
        return res.status(403).json({
          success: false,
          message: 'Este hilo está cerrado para comentarios'
        });
      }

      // Extraer menciones y tags del contenido
      const mentions = forumUtils.extractMentions(content);
      const tags = forumUtils.extractTags(content);

      // Validar menciones
      const { valid: validMentions } = await forumUtils.validateMentions(mentions, User);

      const comment = new Comment({
        content,
        author: authorId,
        thread: id,
        parentComment: parentCommentId || null,
        mentions: validMentions.map(m => m.userId),
        tags
      });

      await comment.save();
      await comment.populate('author', 'username');

      // Actualizar contador de comentarios en el hilo
      await thread.updateCommentCount();

      logger.info('Comentario creado:', {
        commentId: comment._id,
        threadId: id,
        authorId
      });

      // Emitir evento en tiempo real
      if (global.io) {
        // Emitir a la sala del hilo específico
        global.io.to(`thread-${id}`).emit('new-comment', {
          comment: comment.toObject(),
          threadId: id,
          threadTitle: thread.title
        });

        // Emitir notificación al autor del hilo si no es el mismo usuario
        if (thread.author.toString() !== authorId) {
          global.io.to(`user-${thread.author}`).emit('notification', {
            type: 'new-comment',
            threadId: id,
            threadTitle: thread.title,
            commentAuthor: comment.author.username,
            message: `${comment.author.username} comentó en tu hilo "${thread.title}"`
          });
        }

        // Si es una respuesta, notificar al autor del comentario padre
        if (parentCommentId) {
          const parentComment = await Comment.findById(parentCommentId);
          if (parentComment && parentComment.author.toString() !== authorId) {
            global.io.to(`user-${parentComment.author}`).emit('notification', {
              type: 'new-reply',
              threadId: id,
              threadTitle: thread.title,
              commentId: comment._id,
              replyAuthor: comment.author.username,
              message: `${comment.author.username} respondió a tu comentario en "${thread.title}"`
            });
          }
        }

        // Notificar a usuarios mencionados en el comentario
        validMentions.forEach(mention => {
          if (mention.userId.toString() !== authorId) {
            global.io.to(`user-${mention.userId}`).emit('notification', {
              type: 'mention',
              threadId: id,
              threadTitle: thread.title,
              commentId: comment._id,
              mentionedBy: comment.author.username,
              message: `${comment.author.username} te mencionó en un comentario en "${thread.title}"`
            });
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Comentario creado exitosamente',
        data: { comment }
      });
    } catch (error) {
      logger.error('Error creando comentario:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando comentario'
      });
    }
  }

  // Actualizar comentario (solo autor)
  async updateComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comentario no encontrado'
        });
      }

      // Verificar permisos
      if (comment.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este comentario'
        });
      }

      comment.content = content;
      comment.isEdited = true;
      comment.editedAt = new Date();

      await comment.save();
      await comment.populate('author', 'username');

      logger.info('Comentario actualizado:', { commentId, userId });

      res.json({
        success: true,
        message: 'Comentario actualizado exitosamente',
        data: { comment }
      });
    } catch (error) {
      logger.error('Error actualizando comentario:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando comentario'
      });
    }
  }

  // Eliminar comentario (solo autor)
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comentario no encontrado'
        });
      }

      // Verificar permisos
      if (comment.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este comentario'
        });
      }

      await Comment.findByIdAndDelete(commentId);

      // Actualizar contador de comentarios en el hilo
      const thread = await Thread.findById(comment.thread);
      if (thread) {
        await thread.updateCommentCount();
      }

      logger.info('Comentario eliminado:', { commentId, userId });

      res.json({
        success: true,
        message: 'Comentario eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando comentario:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando comentario'
      });
    }
  }

  // Votar en comentario
  async voteComment(req, res) {
    try {
      const { commentId } = req.params;
      const { voteType } = req.body;
      const userId = req.user.id;

      if (!['like', 'dislike'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de voto inválido'
        });
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comentario no encontrado'
        });
      }

      await comment.addVote(userId, voteType);

      // Emitir evento en tiempo real
      if (global.io) {
        global.io.to(`thread-${comment.thread}`).emit('comment-vote', {
          commentId: commentId,
          threadId: comment.thread,
          voteCount: comment.voteCount,
          userVote: voteType,
          voterId: userId
        });
      }

      res.json({
        success: true,
        message: 'Voto registrado',
        data: {
          voteCount: comment.voteCount,
          userVote: voteType
        }
      });
    } catch (error) {
      logger.error('Error votando en comentario:', error);
      res.status(500).json({
        success: false,
        message: 'Error registrando voto'
      });
    }
  }

  // Obtener categorías disponibles
  async getCategories(req, res) {
    try {
      const categories = [
        { value: 'general', label: 'General' },
        { value: 'music', label: 'Música' },
        { value: 'concerts', label: 'Conciertos' },
        { value: 'merchandise', label: 'Merchandise' },
        { value: 'fan-art', label: 'Fan Art' },
        { value: 'questions', label: 'Preguntas' },
        { value: 'announcements', label: 'Anuncios' }
      ];

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Error obteniendo categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo categorías'
      });
    }
  }

  // Obtener estadísticas del foro
  async getStats(req, res) {
    try {
      const [
        totalThreads,
        totalComments,
        totalUsers,
        recentThreads,
        popularTags
      ] = await Promise.all([
        Thread.countDocuments(),
        Comment.countDocuments(),
        User.countDocuments(),
        Thread.find()
          .populate('author', 'username')
          .sort({ createdAt: -1 })
          .limit(5),
        forumUtils.getPopularTags(Thread, 10)
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            totalThreads,
            totalComments,
            totalUsers
          },
          recentThreads,
          popularTags
        }
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas'
      });
    }
  }

  // Obtener tags populares
  async getPopularTags(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const popularTags = await forumUtils.getPopularTags(Thread, limit);

      res.json({
        success: true,
        data: { popularTags }
      });
    } catch (error) {
      logger.error('Error obteniendo tags populares:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo tags populares'
      });
    }
  }

  // Buscar por tags
  async searchByTags(req, res) {
    try {
      const { tags } = req.query;
      if (!tags) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren tags para la búsqueda'
        });
      }

      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 50),
        sort: req.query.sort || 'lastActivity'
      };

      const result = await forumUtils.searchByTags(Thread, tagArray, options);

      res.json({
        success: true,
        data: {
          threads: result.docs,
          pagination: {
            page: result.page,
            pages: result.totalPages,
            total: result.totalDocs,
            limit: result.limit
          }
        }
      });
    } catch (error) {
      logger.error('Error buscando por tags:', error);
      res.status(500).json({
        success: false,
        message: 'Error buscando por tags'
      });
    }
  }

  // Obtener sugerencias de tags
  async getTagSuggestions(req, res) {
    try {
      const { q } = req.query;
      const suggestions = await forumUtils.getTagSuggestions(Thread, q);

      res.json({
        success: true,
        data: { suggestions }
      });
    } catch (error) {
      logger.error('Error obteniendo sugerencias de tags:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sugerencias de tags'
      });
    }
  }

  // Obtener sugerencias de menciones
  async getMentionSuggestions(req, res) {
    try {
      const { q } = req.query;
      const suggestions = await forumUtils.getMentionSuggestions(User, q);

      res.json({
        success: true,
        data: { suggestions }
      });
    } catch (error) {
      logger.error('Error obteniendo sugerencias de menciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sugerencias de menciones'
      });
    }
  }
}

module.exports = new ForumController();