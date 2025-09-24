import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * API para gestión de comentarios y reseñas de música
 */
class MusicCommentsAPI {
  /**
   * Obtener comentarios de un elemento musical
   */
  async getComments(targetType, targetId, options = {}) {
    try {
      const params = new URLSearchParams();

      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.sort) params.append('sort', options.sort);
      if (options.order) params.append('order', options.order);
      if (options.includeReplies) params.append('includeReplies', options.includeReplies);

      const response = await axios.get(
        `${API_BASE_URL}/music-comments/${targetType}/${targetId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo comentario/reseña
   */
  async createComment(targetType, targetId, commentData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/music-comments/${targetType}/${targetId}`,
        commentData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Obtener respuestas de un comentario
   */
  async getCommentReplies(commentId, options = {}) {
    try {
      const params = new URLSearchParams();

      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const response = await axios.get(
        `${API_BASE_URL}/music-comments/${commentId}/replies?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting comment replies:', error);
      throw error;
    }
  }

  /**
   * Crear una respuesta a un comentario
   */
  async createReply(commentId, replyData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/music-comments/${commentId}/reply`,
        replyData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating reply:', error);
      throw error;
    }
  }

  /**
   * Votar en un comentario
   */
  async voteComment(commentId, voteType) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/music-comments/${commentId}/vote`,
        { voteType },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  }

  /**
   * Reportar un comentario
   */
  async reportComment(commentId, reason) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/music-comments/${commentId}/report`,
        { reason },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  }

  /**
   * Editar un comentario propio
   */
  async editComment(commentId, commentData) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/music-comments/${commentId}`,
        commentData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error editing comment:', error);
      throw error;
    }
  }

  /**
   * Eliminar un comentario propio
   */
  async deleteComment(commentId) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/music-comments/${commentId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Marcar/desmarcar comentario como destacado (solo moderadores)
   */
  async toggleFeatured(commentId, featured) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/music-comments/${commentId}/feature`,
        { featured },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling featured status:', error);
      throw error;
    }
  }

  /**
   * Moderar comentario (solo moderadores)
   */
  async moderateComment(commentId, status, reason = '') {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/music-comments/${commentId}/moderate`,
        { status, reason },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  }
}

export default new MusicCommentsAPI();