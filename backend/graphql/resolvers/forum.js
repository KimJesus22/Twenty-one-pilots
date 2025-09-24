const { Thread, Comment } = require('../../models/Forum');

const forumResolvers = {
  Query: {
    // Query principal para threads
    threads: async (_, { filters = {} }) => {
      const {
        page = 1,
        limit = 20,
        sort = 'lastActivity',
        order = 'desc',
        search,
        category,
        author,
        tags,
        isPinned,
        minViews,
        maxViews,
        createdAfter,
        createdBefore
      } = filters;

      // Construir query
      const query = {};
      if (search) {
        query.$text = { $search: search };
      }
      if (category) query.category = category;
      if (author) query.author = author;
      if (tags && tags.length > 0) query.tags = { $in: tags };
      if (isPinned !== undefined) query.isPinned = isPinned;
      if (minViews || maxViews) {
        query.viewCount = {};
        if (minViews) query.viewCount.$gte = minViews;
        if (maxViews) query.viewCount.$lte = maxViews;
      }
      if (createdAfter || createdBefore) {
        query.createdAt = {};
        if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
        if (createdBefore) query.createdAt.$lte = new Date(createdBefore);
      }

      // Ejecutar query con paginación
      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        populate: [
          { path: 'author', select: 'username avatar' },
          { path: 'comments', select: 'author createdAt', options: { limit: 3, sort: { createdAt: -1 } } }
        ]
      };

      const result = await Thread.paginate(query, options);

      return {
        threads: result.docs,
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Query para thread individual con comments completos
    thread: async (_, { id }) => {
      const thread = await Thread.findById(id)
        .populate('author', 'username avatar')
        .populate({
          path: 'comments',
          populate: [
            { path: 'author', select: 'username avatar' },
            { path: 'replies', populate: { path: 'author', select: 'username avatar' } }
          ]
        });

      if (thread) {
        await thread.incrementViews();
      }

      return thread;
    },

    // Query optimizada para lista de threads
    threadsList: async (_, { filters = {} }) => {
      const {
        page = 1,
        limit = 25,
        sort = 'lastActivity',
        order = 'desc',
        search,
        category,
        isPinned
      } = filters;

      const query = {};
      if (search) query.$text = { $search: search };
      if (category) query.category = category;
      if (isPinned !== undefined) query.isPinned = isPinned;

      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        select: 'title author category tags voteCount viewCount commentCount isPinned lastActivity createdAt' // Solo campos necesarios
      };

      const result = await Thread.paginate(query, options);

      return {
        threads: result.docs.map(thread => ({
          id: thread._id,
          title: thread.title,
          author: thread.author,
          category: thread.category,
          tags: thread.tags,
          voteCount: thread.voteCount,
          viewCount: thread.viewCount,
          commentCount: thread.commentCount,
          isPinned: thread.isPinned,
          lastActivity: thread.lastActivity.toISOString(),
          createdAt: thread.createdAt.toISOString()
        })),
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Comments de un thread específico
    threadComments: async (_, { threadId, filters = {} }) => {
      const {
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'asc',
        parentCommentId
      } = filters;

      const query = { thread: threadId };
      if (parentCommentId) {
        query.parentComment = parentCommentId;
      } else {
        query.parentComment = null; // Solo comentarios raíz
      }

      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        populate: [
          { path: 'author', select: 'username avatar' },
          { path: 'replies', populate: { path: 'author', select: 'username avatar' } }
        ]
      };

      const result = await Comment.paginate(query, options);

      return {
        comments: result.docs,
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Threads populares
    popularThreads: async (_, { limit = 10 }) => {
      return await Thread.find()
        .sort({ 'voteCount.likes': -1, viewCount: -1 })
        .limit(limit)
        .populate('author', 'username avatar');
    },

    // Threads recientes
    recentThreads: async (_, { limit = 10 }) => {
      return await Thread.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('author', 'username avatar');
    },

    // Threads por categoría
    threadsByCategory: async (_, { category, limit = 20 }) => {
      return await Thread.find({ category })
        .sort({ lastActivity: -1 })
        .limit(limit)
        .populate('author', 'username avatar');
    },

    // Threads por usuario
    userThreads: async (_, { userId, limit = 20 }) => {
      return await Thread.find({ author: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('author', 'username avatar');
    },

    // Estadísticas del forum
    forumStats: async () => {
      const [
        totalThreads,
        totalComments,
        totalUsers,
        threadsToday,
        commentsToday,
        categoryStats,
        topContributors
      ] = await Promise.all([
        Thread.countDocuments(),
        Comment.countDocuments(),
        Thread.distinct('author'),
        Thread.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        Comment.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        Thread.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        Thread.aggregate([
          { $group: { _id: '$author', threadCount: { $sum: 1 } } },
          { $lookup: { from: 'comments', localField: '_id', foreignField: 'author', as: 'comments' } },
          { $addFields: { commentCount: { $size: '$comments' } } },
          { $project: { user: '$_id', threadCount: 1, commentCount: 1 } },
          { $sort: { threadCount: -1, commentCount: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        totalThreads,
        totalComments,
        totalUsers: totalUsers.length,
        threadsToday,
        commentsToday,
        categoryDistribution: categoryStats.map(stat => ({
          category: stat._id,
          count: stat.count
        })),
        topContributors: topContributors.map(contrib => ({
          user: contrib.user,
          threadCount: contrib.threadCount,
          commentCount: contrib.commentCount
        }))
      };
    }
  },

  Mutation: {
    // Crear thread
    createThread: async (_, { title, content, category, tags }, { user }) => {
      if (!user) throw new Error('Authentication required');

      const thread = new Thread({
        title,
        content,
        category,
        tags,
        author: user._id
      });

      await thread.save();

      return {
        success: true,
        message: 'Thread created successfully',
        thread: await Thread.findById(thread._id).populate('author', 'username avatar')
      };
    },

    // Actualizar thread
    updateThread: async (_, { id, title, content, tags }, { user }) => {
      const thread = await Thread.findById(id);
      if (!thread) throw new Error('Thread not found');
      if (thread.author.toString() !== user._id.toString()) {
        throw new Error('Unauthorized');
      }

      thread.title = title || thread.title;
      thread.content = content || thread.content;
      thread.tags = tags || thread.tags;
      thread.isEdited = true;
      thread.editedAt = new Date();

      await thread.save();

      return {
        success: true,
        message: 'Thread updated successfully',
        thread
      };
    },

    // Eliminar thread
    deleteThread: async (_, { id }, { user }) => {
      const thread = await Thread.findById(id);
      if (!thread) throw new Error('Thread not found');
      if (thread.author.toString() !== user._id.toString()) {
        throw new Error('Unauthorized');
      }

      await Thread.findByIdAndDelete(id);
      await Comment.deleteMany({ thread: id });

      return {
        success: true,
        message: 'Thread deleted successfully'
      };
    },

    // Crear comentario
    createComment: async (_, { threadId, content, parentCommentId }, { user }) => {
      if (!user) throw new Error('Authentication required');

      const comment = new Comment({
        content,
        thread: threadId,
        author: user._id,
        parentComment: parentCommentId || null
      });

      await comment.save();

      // Actualizar contador de comentarios del thread
      const thread = await Thread.findById(threadId);
      if (thread) {
        await thread.updateCommentCount();
      }

      return {
        success: true,
        message: 'Comment created successfully',
        comment: await Comment.findById(comment._id).populate('author', 'username avatar')
      };
    },

    // Actualizar comentario
    updateComment: async (_, { id, content }, { user }) => {
      const comment = await Comment.findById(id);
      if (!comment) throw new Error('Comment not found');
      if (comment.author.toString() !== user._id.toString()) {
        throw new Error('Unauthorized');
      }

      comment.content = content;
      comment.isEdited = true;
      comment.editedAt = new Date();

      await comment.save();

      return {
        success: true,
        message: 'Comment updated successfully',
        comment
      };
    },

    // Eliminar comentario
    deleteComment: async (_, { id }, { user }) => {
      const comment = await Comment.findById(id);
      if (!comment) throw new Error('Comment not found');
      if (comment.author.toString() !== user._id.toString()) {
        throw new Error('Unauthorized');
      }

      await Comment.findByIdAndDelete(id);

      // Actualizar contador de comentarios del thread
      const thread = await Thread.findById(comment.thread);
      if (thread) {
        await thread.updateCommentCount();
      }

      return {
        success: true,
        message: 'Comment deleted successfully'
      };
    },

    // Votar
    vote: async (_, { targetId, targetType, voteType }, { user }) => {
      if (!user) throw new Error('Authentication required');

      if (targetType === 'thread') {
        const thread = await Thread.findById(targetId);
        if (!thread) throw new Error('Thread not found');

        await thread.addVote(user._id, voteType);

        return {
          success: true,
          message: 'Vote recorded',
          voteCount: thread.voteCount
        };
      } else if (targetType === 'comment') {
        const comment = await Comment.findById(targetId);
        if (!comment) throw new Error('Comment not found');

        await comment.addVote(user._id, voteType);

        return {
          success: true,
          message: 'Vote recorded',
          voteCount: comment.voteCount
        };
      }

      throw new Error('Invalid target type');
    },

    // Reportar contenido
    reportContent: async (_, { contentId, contentType, reason }, { user }) => {
      if (!user) throw new Error('Authentication required');

      // Aquí iría la lógica de reportes
      console.log(`Content ${contentId} (${contentType}) reported by user ${user._id}: ${reason}`);

      return {
        success: true,
        message: 'Content reported successfully'
      };
    }
  },

  // Resolvers para campos relacionados
  Thread: {
    comments: async (thread, _, { limit = 10 }) => {
      return await Comment.find({ thread: thread._id, parentComment: null })
        .sort({ createdAt: 1 })
        .limit(limit)
        .populate('author', 'username avatar')
        .populate({
          path: 'replies',
          populate: { path: 'author', select: 'username avatar' }
        });
    }
  },

  Comment: {
    replies: async (comment) => {
      return await Comment.find({ parentComment: comment._id })
        .sort({ createdAt: 1 })
        .populate('author', 'username avatar');
    }
  }
};

module.exports = forumResolvers;