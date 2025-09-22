const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ForumAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/forum`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Forum API request failed:', error);
      throw error;
    }
  }

  // Obtener estadísticas del foro
  async getStats() {
    const response = await this.request('/stats');
    return response;
  }

  // Obtener categorías disponibles
  async getCategories() {
    const response = await this.request('/categories');
    return response;
  }

  // Obtener hilos con filtros
  async getThreads(params = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/threads${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener hilo específico
  async getThreadById(id) {
    const response = await this.request(`/threads/${id}`);
    return response;
  }

  // Crear nuevo hilo
  async createThread(threadData) {
    const response = await this.request('/threads', {
      method: 'POST',
      body: JSON.stringify(threadData),
    });
    return response;
  }

  // Actualizar hilo
  async updateThread(id, threadData) {
    const response = await this.request(`/threads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(threadData),
    });
    return response;
  }

  // Eliminar hilo
  async deleteThread(id) {
    const response = await this.request(`/threads/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Votar en hilo
  async voteThread(threadId, voteType) {
    const response = await this.request(`/threads/${threadId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType }),
    });
    return response;
  }

  // Crear comentario
  async createComment(threadId, commentData) {
    const response = await this.request(`/threads/${threadId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
    return response;
  }

  // Actualizar comentario
  async updateComment(commentId, commentData) {
    const response = await this.request(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    });
    return response;
  }

  // Eliminar comentario
  async deleteComment(commentId) {
    const response = await this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Votar en comentario
  async voteComment(commentId, voteType) {
    const response = await this.request(`/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType }),
    });
    return response;
  }
}

export default new ForumAPI();