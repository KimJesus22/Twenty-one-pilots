const Video = require('../../models/Video');

const videosResolvers = {
  Query: {
    // Query principal para lista de videos
    videos: async (_, { filters = {} }) => {
      const {
        page = 1,
        limit = 12,
        sort = 'publishedAt',
        order = 'desc',
        search,
        genre,
        artist,
        year,
        type,
        channelId,
        minViews,
        maxViews,
        publishedAfter,
        publishedBefore,
        isVerified,
        minQualityScore
      } = filters;

      // Construir query
      const query = { isAvailable: true };
      if (search) {
        query.$text = { $search: search };
      }
      if (genre) query.genre = genre;
      if (artist) query.artist = new RegExp(artist, 'i');
      if (year) query.year = year;
      if (type) query.type = type;
      if (channelId) query.channelId = channelId;
      if (minViews || maxViews) {
        query['statistics.viewCount'] = {};
        if (minViews) query['statistics.viewCount'].$gte = minViews;
        if (maxViews) query['statistics.viewCount'].$lte = maxViews;
      }
      if (publishedAfter || publishedBefore) {
        query.publishedAt = {};
        if (publishedAfter) query.publishedAt.$gte = new Date(publishedAfter);
        if (publishedBefore) query.publishedAt.$lte = new Date(publishedBefore);
      }
      if (isVerified !== undefined) query.isVerified = isVerified;
      if (minQualityScore) query.qualityScore = { $gte: minQualityScore };

      // Ejecutar query con paginación
      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        populate: [
          { path: 'associatedSongs', select: 'title artist' },
          { path: 'associatedAlbums', select: 'title artist releaseYear' },
          { path: 'createdBy', select: 'username' }
        ]
      };

      const result = await Video.paginate(query, options);

      return {
        videos: result.docs,
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Query para video individual
    video: async (_, { id }) => {
      return await Video.findById(id)
        .populate('associatedSongs')
        .populate('associatedAlbums')
        .populate('createdBy', 'username');
    },

    // Query optimizada para Videos.jsx (lista ligera)
    videosList: async (_, { filters = {} }) => {
      const {
        page = 1,
        limit = 20,
        sort = 'publishedAt',
        order = 'desc',
        search,
        genre,
        artist,
        type
      } = filters;

      const query = { isAvailable: true };
      if (search) query.$text = { $search: search };
      if (genre) query.genre = genre;
      if (artist) query.artist = new RegExp(artist, 'i');
      if (type) query.type = type;

      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        select: 'videoId title thumbnail channelTitle publishedAt duration statistics type isVerified' // Solo campos necesarios
      };

      const result = await Video.paginate(query, options);

      return {
        videos: result.docs.map(video => ({
          id: video._id,
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle,
          publishedAt: video.publishedAt.toISOString(),
          duration: video.duration,
          statistics: video.statistics,
          type: video.type,
          isVerified: video.isVerified
        })),
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Videos populares
    popularVideos: async (_, { limit = 10 }) => {
      return await Video.findPopular(limit);
    },

    // Videos recientes
    recentVideos: async (_, { limit = 10 }) => {
      return await Video.findRecent(limit);
    },

    // Videos por canal
    videosByChannel: async (_, { channelId, limit = 20 }) => {
      return await Video.findByChannel(channelId, limit);
    },

    // Videos asociados a canción
    videosForSong: async (_, { songId }) => {
      return await Video.find({ associatedSongs: songId, isAvailable: true })
        .sort({ 'statistics.viewCount': -1 })
        .limit(10);
    },

    // Videos asociados a álbum
    videosForAlbum: async (_, { albumId }) => {
      return await Video.find({ associatedAlbums: albumId, isAvailable: true })
        .sort({ 'statistics.viewCount': -1 })
        .limit(10);
    },

    // Recomendaciones
    recommendedVideos: async (_, { userId, limit = 10 }) => {
      return await Video.getRecommendations(userId, limit);
    },

    // Estadísticas de videos
    videoStats: async () => {
      const [
        totalVideos,
        totalViews,
        avgQualityScore,
        genreStats,
        typeStats,
        verifiedCount
      ] = await Promise.all([
        Video.countDocuments({ isAvailable: true }),
        Video.aggregate([
          { $match: { isAvailable: true } },
          { $group: { _id: null, total: { $sum: '$statistics.viewCount' } } }
        ]),
        Video.aggregate([
          { $match: { isAvailable: true } },
          { $group: { _id: null, avg: { $avg: '$qualityScore' } } }
        ]),
        Video.aggregate([
          { $match: { isAvailable: true } },
          { $group: { _id: '$genre', count: { $sum: 1 } } }
        ]),
        Video.aggregate([
          { $match: { isAvailable: true } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        Video.countDocuments({ isAvailable: true, isVerified: true })
      ]);

      return {
        totalVideos,
        totalViews: totalViews[0]?.total || 0,
        avgQualityScore: avgQualityScore[0]?.avg || 0,
        verifiedVideos: verifiedCount,
        genreDistribution: genreStats.map(stat => ({
          genre: stat._id,
          count: stat.count
        })),
        typeDistribution: typeStats.map(stat => ({
          type: stat._id,
          count: stat.count
        }))
      };
    }
  },

  Mutation: {
    // Marcar video como visto
    markVideoWatched: async (_, { videoId }, { user }) => {
      if (!user) throw new Error('Authentication required');

      const video = await Video.findById(videoId);
      if (!video) throw new Error('Video not found');

      await video.incrementAccess();

      return {
        success: true,
        message: 'Video marked as watched',
        video
      };
    },

    // Agregar/quitar de favoritos
    toggleVideoFavorite: async (_, { videoId }, { user }) => {
      if (!user) throw new Error('Authentication required');

      // Aquí iría la lógica de favoritos para videos
      // Por ahora, solo devolver respuesta mock
      return {
        success: true,
        message: 'Favorite toggled',
        isFavorite: false
      };
    },

    // Reportar video
    reportVideo: async (_, { videoId, reason }, { user }) => {
      if (!user) throw new Error('Authentication required');

      // Aquí iría la lógica de reportes
      console.log(`Video ${videoId} reported by user ${user._id}: ${reason}`);

      return {
        success: true,
        message: 'Video reported successfully'
      };
    }
  }
};

module.exports = videosResolvers;