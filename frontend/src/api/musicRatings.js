import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * API para gestión de valoraciones de música
 */
class MusicRatingsAPI {
  /**
   * Crear o actualizar una valoración
   */
  async createOrUpdateRating(targetType, targetId, rating) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/music-ratings/${targetType}/${targetId}`,
        { rating },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating/updating rating:', error);
      throw error;
    }
  }

  /**
   * Obtener valoración del usuario actual
   */
  async getUserRating(targetType, targetId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/music-ratings/${targetType}/${targetId}/user`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No rating found
      }
      console.error('Error getting user rating:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de valoraciones
   */
  async getRatingStats(targetType, targetId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/music-ratings/${targetType}/${targetId}/stats`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting rating stats:', error);
      throw error;
    }
  }

  /**
   * Eliminar valoración del usuario
   */
  async deleteUserRating(targetType, targetId) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/music-ratings/${targetType}/${targetId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting rating:', error);
      throw error;
    }
  }
}

export default new MusicRatingsAPI();
