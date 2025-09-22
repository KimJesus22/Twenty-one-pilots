const { Thread, Comment } = require('../models/Forum');
const User = require('../models/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

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

      const thread = new Thread({
        title,
        content,
        author: authorId,
        category: category || 'general',
        tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : []
      });

      await thread.save();
      await thread.populate('author', 'username');

      logger.info('Nuevo hilo creado:', {
        threadId: thread._id,
        authorId,
        title: title.substring(0, 50)
      });

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

      const comment = new Comment({
        content,
        author: authorId,
        thread: id,
        parentComment: parentCommentId || null
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
        recentThreads
      ] = await Promise.all([
        Thread.countDocuments(),
        Comment.countDocuments(),
        User.countDocuments(),
        Thread.find()
          .populate('author', 'username')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            totalThreads,
            totalComments,
            totalUsers
          },
          recentThreads
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
}

module.exports = new ForumController();