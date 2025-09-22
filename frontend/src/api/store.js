const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class StoreAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/store`;
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Obtener productos con filtros y paginación
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(endpoint);
    return response;
  }

  // Obtener producto específico
  async getProductById(id) {
    const response = await this.request(`/products/${id}`);
    return response;
  }

  // Obtener categorías
  async getCategories() {
    const response = await this.request('/categories');
    return response;
  }

  // Crear producto (solo admin)
  async createProduct(productData) {
    const response = await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return response;
  }

  // Actualizar producto (solo admin)
  async updateProduct(id, productData) {
    const response = await this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return response;
  }

  // Eliminar producto (solo admin)
  async deleteProduct(id) {
    const response = await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Procesar pago
  async processPayment(cartItems, successUrl, cancelUrl) {
    const items = cartItems.map(item => ({
      productId: item.product._id,
      quantity: item.quantity
    }));

    const response = await this.request('/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items,
        successUrl,
        cancelUrl
      }),
    });
    return response;
  }
}

export default new StoreAPI();