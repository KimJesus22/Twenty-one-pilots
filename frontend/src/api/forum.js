import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const forumAPI = {
  // ===== THREADS =====

  // Obtener threads con filtros
  getThreads: async (params = {}) => {
    const response = await api.get('/forum/threads', { params });
    return response.data;
  },

  // Obtener thread por ID
  getThread: async (id) => {
    const response = await api.get(`/forum/threads/${id}`);
    return response.data;
  },

  // Crear nuevo thread
  createThread: async (threadData) => {
    const response = await api.post('/forum/threads', threadData);
    return response.data;
  },

  // Actualizar thread
  updateThread: async (id, threadData) => {
    const response = await api.put(`/forum/threads/${id}`, threadData);
    return response.data;
  },

  // Eliminar thread
  deleteThread: async (id) => {
    const response = await api.delete(`/forum/threads/${id}`);
    return response.data;
  },

  // Votar en thread
  voteThread: async (id, voteType) => {
    const response = await api.post(`/forum/threads/${id}/vote`, { voteType });
    return response.data;
  },

  // ===== COMMENTS =====

  // Obtener comentarios de un thread
  getComments: async (threadId, params = {}) => {
    const response = await api.get(`/forum/threads/${threadId}/comments`, { params });
    return response.data;
  },

  // Crear comentario
  createComment: async (threadId, commentData) => {
    const response = await api.post(`/forum/threads/${threadId}/comments`, commentData);
    return response.data;
  },

  // Actualizar comentario
  updateComment: async (commentId, commentData) => {
    const response = await api.put(`/forum/comments/${commentId}`, commentData);
    return response.data;
  },

  // Eliminar comentario
  deleteComment: async (commentId) => {
    const response = await api.delete(`/forum/comments/${commentId}`);
    return response.data;
  },

  // Votar en comentario
  voteComment: async (commentId, voteType) => {
    const response = await api.post(`/forum/comments/${commentId}/vote`, { voteType });
    return response.data;
  },

  // ===== TAGS =====

  // Obtener tags populares
  getPopularTags: async (limit = 20) => {
    const response = await api.get('/forum/tags/popular', { params: { limit } });
    return response.data;
  },

  // Buscar por tags
  searchByTags: async (tags, params = {}) => {
    const response = await api.get('/forum/tags/search', {
      params: { tags: tags.join(','), ...params }
    });
    return response.data;
  },

  // Obtener sugerencias de tags
  getTagSuggestions: async (query, limit = 10) => {
    const response = await api.get('/forum/tags/suggestions', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // ===== MENTIONS =====

  // Obtener sugerencias de menciones
  getMentionSuggestions: async (query, limit = 10) => {
    const response = await api.get('/forum/mentions/suggestions', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // ===== STATS =====

  // Obtener estadísticas del foro
  getStats: async () => {
    const response = await api.get('/forum/stats');
    return response.data;
  }
};

export default forumAPI;