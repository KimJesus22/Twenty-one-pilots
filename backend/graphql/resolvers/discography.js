const { Album, Song } = require('../../models/Discography');
const { MusicRating } = require('../../models/MusicRating');
const { MusicComment } = require('../../models/MusicComment');

const discographyResolvers = {
  Query: {
    // Query optimizada para Discography.js - solo datos necesarios para lista
    albums: async (_, { filters = {} }) => {
      const {
        page = 1,
        limit = 12,
        sort = 'releaseYear',
        order = 'desc',
        search,
        genre,
        type,
        minYear,
        maxYear,
        minPopularity,
        maxPopularity,
        artist
      } = filters;

      // Construir query base
      const query = {};
      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { artist: new RegExp(search, 'i') }
        ];
      }
      if (genre) query.genre = genre;
      if (type) query.type = type;
      if (minYear || maxYear) {
        query.releaseYear = {};
        if (minYear) query.releaseYear.$gte = minYear;
        if (maxYear) query.releaseYear.$lte = maxYear;
      }
      if (minPopularity || maxPopularity) {
        query.popularity = {};
        if (minPopularity) query.popularity.$gte = minPopularity;
        if (maxPopularity) query.popularity.$lte = maxPopularity;
      }
      if (artist) query.artist = new RegExp(artist, 'i');

      // Ejecutar query con paginación
      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        select: 'title releaseYear coverImage artist genre type popularity rating ratingCount commentCount' // Solo campos necesarios
      };

      const result = await Album.paginate(query, options);

      return {
        albums: result.docs,
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Query para álbum individual con datos completos
    album: async (_, { id }) => {
      return await Album.findById(id)
        .populate('songs')
        .populate('relatedProducts', 'name price image')
        .populate('relatedEvents', 'name date venue');
    },

    // Query optimizada para lista de álbumes (sin songs anidadas)
    albumList: async (_, { filters = {} }) => {
      // Reutilizar lógica de albums pero sin populate de songs
      const {
        page = 1,
        limit = 20,
        sort = 'releaseYear',
        order = 'desc',
        search,
        genre,
        type,
        minYear,
        maxYear,
        artist
      } = filters;

      const query = {};
      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { artist: new RegExp(search, 'i') }
        ];
      }
      if (genre) query.genre = genre;
      if (type) query.type = type;
      if (minYear || maxYear) {
        query.releaseYear = {};
        if (minYear) query.releaseYear.$gte = minYear;
        if (maxYear) query.releaseYear.$lte = maxYear;
      }
      if (artist) query.artist = new RegExp(artist, 'i');

      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        select: '-songs -credits -productionNotes -externalLinks' // Excluir campos pesados
      };

      const result = await Album.paginate(query, options);

      return {
        albums: result.docs,
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Query para detalles de álbum con songs optimizados
    albumWithSongs: async (_, { id, includeLyrics = false }) => {
      const select = includeLyrics
        ? 'title releaseYear coverImage songs artist genre type totalDuration spotifyId youtubeId popularity rating ratingCount commentCount externalLinks credits productionNotes'
        : 'title releaseYear coverImage songs.title songs.duration songs.trackNumber songs.spotifyId songs.youtubeId songs.previewUrl songs.popularity songs.playCount artist genre type totalDuration spotifyId youtubeId popularity rating ratingCount commentCount';

      return await Album.findById(id).select(select).populate('songs');
    },

    // Estadísticas de álbumes
    albumStats: async () => {
      const [
        totalAlbums,
        totalSongs,
        albumsWithRatings,
        genreStats
      ] = await Promise.all([
        Album.countDocuments(),
        Song.countDocuments(),
        Album.find({ ratingCount: { $gt: 0 } }).select('rating ratingCount'),
        Album.aggregate([
          { $group: { _id: '$genre', count: { $sum: 1 } } }
        ])
      ]);

      // Calcular rating promedio
      let totalRating = 0;
      let totalRatingCount = 0;
      albumsWithRatings.forEach(album => {
        totalRating += album.rating * album.ratingCount;
        totalRatingCount += album.ratingCount;
      });
      const avgRating = totalRatingCount > 0 ? totalRating / totalRatingCount : 0;

      // Calcular estadísticas adicionales
      const albums = await Album.find().select('views likes');
      const totalViews = albums.reduce((sum, album) => sum + album.views, 0);
      const totalLikes = albums.reduce((sum, album) => sum + album.likes.length, 0);

      return {
        totalAlbums,
        totalSongs,
        avgRating,
        totalViews,
        totalLikes,
        genreDistribution: genreStats.map(stat => ({
          genre: stat._id,
          count: stat.count
        }))
      };
    }
  },

  Mutation: {
    rateAlbum: async (_, { albumId, rating }, { user }) => {
      if (!user) throw new Error('Authentication required');

      const album = await Album.findById(albumId);
      if (!album) throw new Error('Album not found');

      // Buscar rating existente
      let existingRating = await MusicRating.findOne({
        album: albumId,
        user: user._id
      });

      if (existingRating) {
        // Actualizar rating existente
        const oldRating = existingRating.rating;
        existingRating.rating = rating;
        existingRating.updatedAt = new Date();
        await existingRating.save();

        // Actualizar estadísticas del álbum
        await updateAlbumRatingStats(albumId, oldRating, rating);
      } else {
        // Crear nuevo rating
        const newRating = new MusicRating({
          album: albumId,
          user: user._id,
          rating
        });
        await newRating.save();

        // Actualizar estadísticas del álbum
        await updateAlbumRatingStats(albumId, null, rating);
      }

      return {
        success: true,
        message: 'Rating submitted successfully',
        album: await Album.findById(albumId)
      };
    },

    addAlbumComment: async (_, { albumId, content, title, pros, cons, recommendation }, { user }) => {
      if (!user) throw new Error('Authentication required');

      const album = await Album.findById(albumId);
      if (!album) throw new Error('Album not found');

      const comment = new MusicComment({
        album: albumId,
        user: user._id,
        content,
        title,
        pros,
        cons,
        recommendation,
        rating: recommendation ? 5 : 3 // Rating basado en recomendación
      });

      await comment.save();

      // Actualizar contador de comentarios del álbum
      album.commentCount += 1;
      await album.save();

      return {
        success: true,
        message: 'Comment added successfully',
        comment: await MusicComment.findById(comment._id).populate('user', 'username avatar')
      };
    }
  },

  // Resolvers para campos relacionados
  Album: {
    songs: async (album, _, { includeLyrics = false }) => {
      if (!album.songs || album.songs.length === 0) return [];

      const select = includeLyrics
        ? undefined // Todos los campos
        : '-lyrics -credits -externalLinks'; // Excluir campos pesados

      return await Song.find({ _id: { $in: album.songs } }).select(select);
    }
  },

  Song: {
    album: async (song) => {
      return await Album.findById(song.album).select('title artist releaseYear coverImage');
    }
  }
};

// Función helper para actualizar estadísticas de rating
async function updateAlbumRatingStats(albumId, oldRating, newRating) {
  const album = await Album.findById(albumId);
  if (!album) return;

  // Obtener todos los ratings del álbum
  const ratings = await MusicRating.find({ album: albumId }).select('rating');

  if (ratings.length === 0) {
    album.rating = 0;
    album.ratingCount = 0;
    album.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  } else {
    // Calcular promedio
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    album.rating = totalRating / ratings.length;
    album.ratingCount = ratings.length;

    // Calcular distribución
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });
    album.ratingDistribution = distribution;
  }

  await album.save();
}

module.exports = discographyResolvers;