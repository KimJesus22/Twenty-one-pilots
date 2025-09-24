const { gql } = require('graphql-tag');

const videosTypeDefs = gql`
  # Tipos básicos para videos
  type VideoStatistics {
    viewCount: Int!
    likeCount: Int!
    commentCount: Int!
    favoriteCount: Int!
  }

  # Tipo principal de Video optimizado
  type Video {
    id: ID!
    videoId: String!
    title: String!
    description: String
    channelId: String!
    channelTitle: String!
    url: String!
    embedUrl: String!
    thumbnail: String!
    publishedAt: String!
    fetchedAt: String
    updatedAt: String
    statistics: VideoStatistics!
    duration: String!
    durationSeconds: Int!
    tags: [String!]!
    categoryId: String!
    genre: String
    artist: String
    year: Int
    type: String!
    privacyStatus: String!
    isAvailable: Boolean!
    associatedSongs: [Song]
    associatedAlbums: [Album]
    searchQuery: String
    source: String!
    isVerified: Boolean!
    qualityScore: Int!
    cacheExpiry: String
    createdBy: User
    lastAccessed: String
    accessCount: Int!
    createdAt: String!
  }

  # Tipos de input para filtros de video
  input VideoFilters {
    page: Int
    limit: Int
    sort: String
    order: String
    search: String
    genre: String
    artist: String
    year: Int
    type: String
    channelId: String
    minViews: Int
    maxViews: Int
    publishedAfter: String
    publishedBefore: String
    isVerified: Boolean
    minQualityScore: Int
  }

  # Queries optimizadas para Videos.jsx
  type Query {
    # Query principal para lista de videos (sin datos pesados)
    videos(filters: VideoFilters): VideosResponse!

    # Query para video individual con datos completos
    video(id: ID!): Video

    # Query optimizada para Videos.jsx - solo campos necesarios
    videosList(filters: VideoFilters): VideosListResponse!

    # Query para videos populares (usado en carga inicial)
    popularVideos(limit: Int): [Video!]!

    # Query para videos recientes
    recentVideos(limit: Int): [Video!]!

    # Query para videos por canal
    videosByChannel(channelId: String!, limit: Int): [Video!]!

    # Query para videos asociados a canción/álbum
    videosForSong(songId: ID!): [Video!]!
    videosForAlbum(albumId: ID!): [Video!]!

    # Query para recomendaciones
    recommendedVideos(userId: ID, limit: Int): [Video!]!

    # Estadísticas de videos
    videoStats: VideoStats!
  }

  # Respuestas optimizadas
  type VideosResponse {
    videos: [Video!]!
    pagination: Pagination!
  }

  # Respuesta ultra-ligera para listas (reduce overfetching)
  type VideosListResponse {
    videos: [VideoListItem!]!
    pagination: Pagination!
  }

  # Tipo ligero para listas de videos
  type VideoListItem {
    id: ID!
    videoId: String!
    title: String!
    thumbnail: String!
    channelTitle: String!
    publishedAt: String!
    duration: String!
    statistics: VideoStatistics!
    type: String!
    isVerified: Boolean!
  }

  type Pagination {
    page: Int!
    pages: Int!
    total: Int!
    limit: Int!
  }

  type VideoStats {
    totalVideos: Int!
    totalViews: Int!
    totalLikes: Int!
    avgQualityScore: Float!
    genreDistribution: [GenreCount!]!
    typeDistribution: [TypeCount!]!
    verifiedVideos: Int!
  }

  type GenreCount {
    genre: String!
    count: Int!
  }

  type TypeCount {
    type: String!
    count: Int!
  }

  # Mutations para interacciones con videos
  type Mutation {
    # Marcar video como visto
    markVideoWatched(videoId: ID!): VideoResponse!

    # Agregar/quitar de favoritos
    toggleVideoFavorite(videoId: ID!): FavoriteResponse!

    # Reportar video
    reportVideo(videoId: ID!, reason: String!): ReportResponse!
  }

  type VideoResponse {
    success: Boolean!
    message: String
    video: Video
  }

  type FavoriteResponse {
    success: Boolean!
    message: String
    isFavorite: Boolean!
  }

  type ReportResponse {
    success: Boolean!
    message: String
  }

  # Tipos reutilizados de discography
  type Song {
    id: ID!
    title: String!
    duration: String
    trackNumber: Int
    spotifyId: String
    youtubeId: String
    previewUrl: String
    popularity: Int
    playCount: Int
  }

  type Album {
    id: ID!
    title: String!
    releaseYear: Int!
    coverImage: String
    artist: String
    genre: String
    type: String
    spotifyId: String
    youtubeId: String
    popularity: Int
    rating: Float
  }

  type User {
    id: ID!
    username: String!
    avatar: String
  }
`;

module.exports = videosTypeDefs;