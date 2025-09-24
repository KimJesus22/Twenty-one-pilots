const { gql } = require('graphql-tag');

const discographyTypeDefs = gql`
  # Tipos básicos
  type ExternalLinks {
    genius: String
    musicbrainz: String
    wikidata: String
    lyricsUrl: String
    officialLyrics: String
    spotify: String
    appleMusic: String
    youtube: String
    youtubeMusic: String
    deezer: String
    tidal: String
    amazonMusic: String
    discogs: String
    allmusic: String
    wikipedia: String
    officialWebsite: String
  }

  type SongCredits {
    writers: [String]
    producers: [String]
    featuredArtists: [String]
    additionalCredits: [AdditionalCredit]
  }

  type AdditionalCredit {
    role: String
    name: String
  }

  type AlbumCredits {
    executiveProducer: String
    producers: [String]
    coProducers: [String]
    engineers: [String]
    mixingEngineers: [String]
    masteringEngineers: [String]
    additionalCredits: [AlbumAdditionalCredit]
    artworkBy: String
    photographyBy: String
    designBy: String
  }

  type AlbumAdditionalCredit {
    role: String
    names: [String]
  }

  type ProductionNotes {
    recordingLocation: String
    recordingDates: String
    mixingLocation: String
    masteringLocation: String
    studio: String
    equipment: String
    additionalInfo: String
  }

  type RatingDistribution {
    1: Int
    2: Int
    3: Int
    4: Int
    5: Int
  }

  # Tipos principales
  type Song {
    id: ID!
    title: String!
    lyrics: String
    duration: String
    trackNumber: Int
    album: Album
    spotifyId: String
    youtubeId: String
    previewUrl: String
    popularity: Int
    playCount: Int
    likes: [ID]
    externalLinks: ExternalLinks
    credits: SongCredits
    isrc: String
    bpm: Int
    key: String
    createdAt: String
    updatedAt: String
  }

  type Album {
    id: ID!
    title: String!
    releaseYear: Int!
    coverImage: String
    songs: [Song]
    artist: String
    genre: String
    type: String
    totalDuration: String
    spotifyId: String
    youtubeId: String
    popularity: Int
    views: Int
    likes: [ID]
    price: Float
    isAvailable: Boolean
    rating: Float
    ratingCount: Int
    ratingDistribution: RatingDistribution
    commentCount: Int
    avgCommentRating: Float
    featuredComments: Int
    externalLinks: ExternalLinks
    credits: AlbumCredits
    productionNotes: ProductionNotes
    upc: String
    catalogNumber: String
    label: String
    copyright: String
    releaseDate: String
    createdAt: String
    updatedAt: String
  }

  # Tipos de input para filtros
  input AlbumFilters {
    page: Int
    limit: Int
    sort: String
    order: String
    search: String
    genre: String
    type: String
    minYear: Int
    maxYear: Int
    minPopularity: Int
    maxPopularity: Int
    artist: String
  }

  input SongFilters {
    page: Int
    limit: Int
    sort: String
    order: String
    search: String
    album: ID
    minPopularity: Int
    maxPopularity: Int
  }

  # Queries optimizadas para reducir overfetching
  type Query {
    # Queries para Discography.js - solo datos necesarios
    albums(filters: AlbumFilters): AlbumsResponse!
    album(id: ID!): Album

    # Queries optimizadas para SongPreview.js
    songs(filters: SongFilters): SongsResponse!
    song(id: ID!): Song

    # Query específica para lista de álbumes (sin songs anidadas)
    albumList(filters: AlbumFilters): AlbumsResponse!

    # Query para detalles de álbum con songs optimizados
    albumWithSongs(id: ID!, includeLyrics: Boolean = false): Album

    # Query para estadísticas de popularidad
    albumStats: AlbumStats!
  }

  type AlbumsResponse {
    albums: [Album!]!
    pagination: Pagination!
  }

  type SongsResponse {
    songs: [Song!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    pages: Int!
    total: Int!
    limit: Int!
  }

  type AlbumStats {
    totalAlbums: Int!
    totalSongs: Int!
    avgRating: Float!
    totalViews: Int!
    totalLikes: Int!
    genreDistribution: [GenreCount!]!
  }

  type GenreCount {
    genre: String!
    count: Int!
  }

  # Mutations para ratings y comentarios
  type Mutation {
    rateAlbum(albumId: ID!, rating: Int!): RatingResponse!
    addAlbumComment(albumId: ID!, content: String!, title: String, pros: [String], cons: [String], recommendation: Boolean): CommentResponse!
  }

  type RatingResponse {
    success: Boolean!
    message: String
    album: Album
  }

  type CommentResponse {
    success: Boolean!
    message: String
    comment: Comment
  }

  type Comment {
    id: ID!
    content: String!
    title: String
    author: User!
    rating: Int
    pros: [String]
    cons: [String]
    recommendation: Boolean
    likes: Int
    createdAt: String!
  }

  type User {
    id: ID!
    username: String!
    avatar: String
  }
`;

module.exports = discographyTypeDefs;