import { gql } from '@apollo/client';

// Query optimizada para Discography.js - solo datos necesarios para la lista
export const GET_ALBUMS_LIST = gql`
  query GetAlbumsList($filters: AlbumFilters) {
    albums(filters: $filters) {
      albums {
        id
        title
        releaseYear
        coverImage
        artist
        genre
        type
        rating
        ratingCount
        commentCount
        views
        likes
        isAvailable
      }
      pagination {
        page
        pages
        total
        limit
      }
    }
  }
`;

// Query para detalles completos de un álbum (usada en AlbumDetail.js)
export const GET_ALBUM_DETAILS = gql`
  query GetAlbumDetails($id: ID!) {
    album(id: $id) {
      id
      title
      releaseYear
      coverImage
      artist
      genre
      type
      totalDuration
      spotifyId
      youtubeId
      popularity
      views
      likes
      rating
      ratingCount
      ratingDistribution {
        one
        two
        three
        four
        five
      }
      commentCount
      avgCommentRating
      featuredComments
      externalLinks {
        spotify
        appleMusic
        youtube
        youtubeMusic
        genius
      }
      credits {
        executiveProducer
        producers
        engineers
        mixingEngineers
        masteringEngineers
        artworkBy
        photographyBy
      }
      songs {
        id
        title
        duration
        trackNumber
        spotifyId
        youtubeId
        previewUrl
        popularity
        playCount
        likes
      }
    }
  }
`;

// Query ultra-optimizada para SongPreview.js - solo campos críticos
export const GET_SONG_PREVIEW = gql`
  query GetSongPreview($songId: ID!) {
    song(id: $songId) {
      id
      title
      duration
      trackNumber
      spotifyId
      youtubeId
      previewUrl
      popularity
      playCount
      likes
      album {
        id
        title
        coverImage
        artist
        releaseYear
      }
    }
  }
`;

// Query para estadísticas de la discografía
export const GET_ALBUM_STATS = gql`
  query GetAlbumStats {
    albumStats {
      totalAlbums
      totalSongs
      avgRating
      totalViews
      totalLikes
      genreDistribution {
        genre
        count
      }
    }
  }
`;

// Mutations para ratings y comentarios
export const RATE_ALBUM = gql`
  mutation RateAlbum($albumId: ID!, $rating: Int!) {
    rateAlbum(albumId: $albumId, rating: $rating) {
      success
      message
      album {
        id
        rating
        ratingCount
        ratingDistribution {
          one
          two
          three
          four
          five
        }
      }
    }
  }
`;

export const ADD_ALBUM_COMMENT = gql`
  mutation AddAlbumComment(
    $albumId: ID!
    $content: String!
    $title: String
    $pros: [String]
    $cons: [String]
    $recommendation: Boolean
  ) {
    addAlbumComment(
      albumId: $albumId
      content: $content
      title: $title
      pros: $pros
      cons: $cons
      recommendation: $recommendation
    ) {
      success
      message
      comment {
        id
        content
        title
        author {
          id
          username
          avatar
        }
        rating
        pros
        cons
        recommendation
        likes
        createdAt
      }
    }
  }
`;

// Fragmentos reutilizables para optimización
export const ALBUM_BASIC_FRAGMENT = gql`
  fragment AlbumBasic on Album {
    id
    title
    releaseYear
    coverImage
    artist
    genre
    type
    rating
    ratingCount
    views
    likes
    isAvailable
  }
`;

export const SONG_PREVIEW_FRAGMENT = gql`
  fragment SongPreview on Song {
    id
    title
    duration
    trackNumber
    spotifyId
    youtubeId
    previewUrl
    popularity
    playCount
    likes
  }
`;