const axios = require('axios');
const logger = require('../utils/logger');

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    this.maxResults = 10;
  }

  // Buscar videos
  async searchVideos(query = 'Twenty One Pilots', maxResults = this.maxResults) {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          key: this.apiKey,
          maxResults,
          order: 'relevance',
          safeSearch: 'moderate'
        },
        timeout: 10000 // 10 segundos timeout
      });

      // Transformar respuesta para incluir solo datos necesarios
      const videos = response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));

      return {
        success: true,
        data: videos,
        totalResults: response.data.pageInfo?.totalResults || 0
      };
    } catch (error) {
      logger.error('Error buscando videos en YouTube:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Obtener detalles de un video específico
  async getVideoDetails(videoId) {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: videoId,
          key: this.apiKey
        },
        timeout: 10000
      });

      if (!response.data.items || response.data.items.length === 0) {
        return {
          success: false,
          error: 'Video no encontrado'
        };
      }

      const video = response.data.items[0];
      const details = {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium.url,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails?.duration,
        viewCount: parseInt(video.statistics?.viewCount) || 0,
        likeCount: parseInt(video.statistics?.likeCount) || 0,
        commentCount: parseInt(video.statistics?.commentCount) || 0,
        tags: video.snippet.tags || [],
        url: `https://www.youtube.com/watch?v=${video.id}`,
        embedUrl: `https://www.youtube.com/embed/${video.id}`
      };

      return {
        success: true,
        data: details
      };
    } catch (error) {
      logger.error('Error obteniendo detalles del video:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener videos de un canal específico
  async getChannelVideos(channelId, maxResults = this.maxResults) {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      // Primero obtener el ID de uploads del canal
      const channelResponse = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          part: 'contentDetails',
          id: channelId,
          key: this.apiKey
        }
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        return {
          success: false,
          error: 'Canal no encontrado'
        };
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

      // Obtener videos de la playlist de uploads
      const videosResponse = await axios.get(`${this.baseUrl}/playlistItems`, {
        params: {
          part: 'snippet',
          playlistId: uploadsPlaylistId,
          key: this.apiKey,
          maxResults
        }
      });

      const videos = videosResponse.data.items.map(item => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
      }));

      return {
        success: true,
        data: videos,
        totalResults: videosResponse.data.pageInfo?.totalResults || 0
      };
    } catch (error) {
      logger.error('Error obteniendo videos del canal:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Buscar videos relacionados
  async getRelatedVideos(videoId, maxResults = 5) {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key no configurada');
      }

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          relatedToVideoId: videoId,
          type: 'video',
          key: this.apiKey,
          maxResults
        }
      });

      const videos = response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));

      return {
        success: true,
        data: videos
      };
    } catch (error) {
      logger.error('Error obteniendo videos relacionados:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Validar API key
  async validateApiKey() {
    try {
      if (!this.apiKey) {
        return { valid: false, error: 'API key no configurada' };
      }

      await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet',
          id: 'dQw4w9WgXcQ', // Video de prueba
          key: this.apiKey
        },
        timeout: 5000
      });

      return { valid: true };
    } catch (error) {
      logger.error('Error validando API key de YouTube:', error);
      return {
        valid: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}

module.exports = new YouTubeService();