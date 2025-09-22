const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/auth`;
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

    // Agregar token de autenticación si existe (excepto para login/register)
    const token = localStorage.getItem('token');
    if (token && !endpoint.includes('/login') && !endpoint.includes('/register')) {
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
      console.error('Auth API request failed:', error);
      throw error;
    }
  }

  // Iniciar sesión
  async login(credentials) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  }

  // Registrarse
  async register(userData) {
    const response = await this.request('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }

  // Verificar token actual
  async verifyToken() {
    const response = await this.request('/verify');
    return response;
  }

  // Obtener perfil del usuario
  async getProfile() {
    const response = await this.request('/profile');
    return response;
  }

  // Actualizar perfil
  async updateProfile(userData) {
    const response = await this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response;
  }

  // Cambiar contraseña
  async changePassword(passwordData) {
    const response = await this.request('/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
    return response;
  }

  // Cerrar sesión (invalidar token)
  async logout() {
    try {
      await this.request('/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Ignorar errores en logout
      console.warn('Logout API call failed:', error);
    }
  }
}

export default new AuthAPI();