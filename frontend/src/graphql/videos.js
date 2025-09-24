import { gql } from '@apollo/client';

// Query optimizada para Videos.jsx - lista ligera para reducir overfetching
export const GET_VIDEOS_LIST = gql`
  query GetVideosList($filters: VideoFilters) {
    videosList(filters: $filters) {
      videos {
        id
        videoId
        title
        thumbnail
        channelTitle
        publishedAt
        duration
        statistics {
          viewCount
          likeCount
          commentCount
        }
        type
        isVerified
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

// Query para video individual con datos completos
export const GET_VIDEO_DETAILS = gql`
  query GetVideoDetails($id: ID!) {
    video(id: $id) {
      id
      videoId
      title
      description
      channelId
      channelTitle
      url
      embedUrl
      thumbnail
      publishedAt
      statistics {
        viewCount
        likeCount
        commentCount
        favoriteCount
      }
      duration
      durationSeconds
      tags
      categoryId
      genre
      artist
      year
      type
      privacyStatus
      isAvailable
      associatedSongs {
        id
        title
        artist
        duration
        previewUrl
      }
      associatedAlbums {
        id
        title
        artist
        coverImage
        releaseYear
      }
      isVerified
      qualityScore
      createdBy {
        id
        username
      }
      lastAccessed
      accessCount
    }
  }
`;

// Query para videos populares (carga inicial optimizada)
export const GET_POPULAR_VIDEOS = gql`
  query GetPopularVideos($limit: Int) {
    popularVideos(limit: $limit) {
      id
      videoId
      title
      thumbnail
      channelTitle
      publishedAt
      duration
      statistics {
        viewCount
        likeCount
      }
      type
      isVerified
    }
  }
`;

// Query para videos recientes
export const GET_RECENT_VIDEOS = gql`
  query GetRecentVideos($limit: Int) {
    recentVideos(limit: $limit) {
      id
      videoId
      title
      thumbnail
      channelTitle
      publishedAt
      duration
      statistics {
        viewCount
      }
      type
      isVerified
    }
  }
`;

// Query para videos por canal
export const GET_VIDEOS_BY_CHANNEL = gql`
  query GetVideosByChannel($channelId: String!, $limit: Int) {
    videosByChannel(channelId: $channelId, limit: $limit) {
      id
      videoId
      title
      thumbnail
      publishedAt
      duration
      statistics {
        viewCount
        likeCount
      }
      type
      isVerified
    }
  }
`;

// Query para videos asociados a canción/álbum
export const GET_VIDEOS_FOR_SONG = gql`
  query GetVideosForSong($songId: ID!) {
    videosForSong(songId: $songId) {
      id
      videoId
      title
      thumbnail
      channelTitle
      publishedAt
      duration
      statistics {
        viewCount
        likeCount
      }
      type
      isVerified
    }
  }
`;

export const GET_VIDEOS_FOR_ALBUM = gql`
  query GetVideosForAlbum($albumId: ID!) {
    videosForAlbum(albumId: $albumId) {
      id
      videoId
      title
      thumbnail
      channelTitle
      publishedAt
      duration
      statistics {
        viewCount
        likeCount
      }
      type
      isVerified
    }
  }
`;

// Query para recomendaciones personalizadas
export const GET_RECOMMENDED_VIDEOS = gql`
  query GetRecommendedVideos($userId: ID, $limit: Int) {
    recommendedVideos(userId: $userId, limit: $limit) {
      id
      videoId
      title
      thumbnail
      channelTitle
      publishedAt
      duration
      statistics {
        viewCount
      }
      genre
      artist
      type
      isVerified
    }
  }
`;

// Estadísticas de videos
export const GET_VIDEO_STATS = gql`
  query GetVideoStats {
    videoStats {
      totalVideos
      totalViews
      avgQualityScore
      verifiedVideos
      genreDistribution {
        genre
        count
      }
      typeDistribution {
        type
        count
      }
    }
  }
`;

// Mutations para interacciones con videos
export const MARK_VIDEO_WATCHED = gql`
  mutation MarkVideoWatched($videoId: ID!) {
    markVideoWatched(videoId: $videoId) {
      success
      message
      video {
        id
        lastAccessed
        accessCount
      }
    }
  }
`;

export const TOGGLE_VIDEO_FAVORITE = gql`
  mutation ToggleVideoFavorite($videoId: ID!) {
    toggleVideoFavorite(videoId: $videoId) {
      success
      message
      isFavorite
    }
  }
`;

export const REPORT_VIDEO = gql`
  mutation ReportVideo($videoId: ID!, $reason: String!) {
    reportVideo(videoId: $videoId, reason: $reason) {
      success
      message
    }
  }
`;

// Fragmentos para reutilización
export const VIDEO_LIST_FRAGMENT = gql`
  fragment VideoList on VideoListItem {
    id
    videoId
    title
    thumbnail
    channelTitle
    publishedAt
    duration
    statistics {
      viewCount
      likeCount
      commentCount
    }
    type
    isVerified
  }
`;

export const VIDEO_DETAILS_FRAGMENT = gql`
  fragment VideoDetails on Video {
    id
    videoId
    title
    description
    channelTitle
    publishedAt
    statistics {
      viewCount
      likeCount
      commentCount
    }
    duration
    tags
    genre
    artist
    type
    isVerified
    qualityScore
  }
`;