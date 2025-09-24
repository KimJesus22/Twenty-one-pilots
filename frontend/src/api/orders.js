import axios from 'axios';

// Configuración base de Axios para la API de pedidos
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Orders API Error:', error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('La solicitud tardó demasiado tiempo. Inténtalo de nuevo.');
    }

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data.message || 'Datos de entrada inválidos');
        case 401:
          throw new Error('No autorizado. Inicia sesión nuevamente.');
        case 403:
          throw new Error('Acceso denegado');
        case 404:
          throw new Error('Recurso no encontrado');
        default:
          throw new Error(data.message || `Error del servidor: ${status}`);
      }
    } else if (error.request) {
      throw new Error('Error de conexión. Verifica tu conexión a internet.');
    } else {
      throw new Error(error.message || 'Ha ocurrido un error inesperado');
    }
  }
);

/**
 * Obtener historial de pedidos del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de paginación y filtrado
 * @returns {Promise<Object>} Historial de pedidos con paginación
 */
export const getUserOrders = async (userId, options = {}) => {
  try {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.status && options.status !== 'all' && { status: options.status }),
      ...(options.sortBy && { sortBy: options.sortBy }),
      ...(options.sortOrder && { sortOrder: options.sortOrder }),
    };

    console.log('📦 Obteniendo pedidos del usuario:', { userId, params });

    const response = await apiClient.get(`/orders/user/${userId}`, { params });

    console.log('✅ Pedidos obtenidos:', response.data.data.length);

    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo pedidos del usuario:', error.message);
    throw error;
  }
};

/**
 * Obtener detalles de un pedido específico
 * @param {string} orderId - ID del pedido
 * @param {string} userId - ID del usuario (para verificación)
 * @returns {Promise<Object>} Detalles del pedido
 */
export const getOrderDetails = async (orderId, userId) => {
  try {
    console.log('📋 Obteniendo detalles del pedido:', orderId);

    const response = await apiClient.get(`/orders/${orderId}`, {
      params: { userId }
    });

    console.log('✅ Detalles del pedido obtenidos');

    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo detalles del pedido:', error.message);
    throw error;
  }
};

/**
 * Obtener seguimiento de envío en tiempo real
 * @param {string} orderId - ID del pedido
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Información de seguimiento
 */
export const getOrderTracking = async (orderId, userId) => {
  try {
    console.log('🚚 Obteniendo seguimiento del pedido:', orderId);

    const response = await apiClient.get(`/orders/${orderId}/tracking`, {
      params: { userId }
    });

    console.log('✅ Seguimiento obtenido');

    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo seguimiento:', error.message);
    throw error;
  }
};

/**
 * Reordenar productos de un pedido anterior
 * @param {string} orderId - ID del pedido a reordenar
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Items agregados al carrito
 */
export const reorderOrder = async (orderId, userId) => {
  try {
    console.log('🔄 Reordenando pedido:', orderId);

    const response = await apiClient.post(`/orders/${orderId}/reorder`, { userId });

    console.log('✅ Pedido reordenado');

    return response.data;
  } catch (error) {
    console.error('❌ Error reordenando pedido:', error.message);
    throw error;
  }
};

/**
 * Obtener estadísticas de pedidos del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas de pedidos
 */
export const getOrderStats = async (userId) => {
  try {
    console.log('📊 Obteniendo estadísticas de pedidos:', userId);

    const response = await apiClient.get(`/orders/user/${userId}/stats`);

    console.log('✅ Estadísticas obtenidas');

    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    throw error;
  }
};

/**
 * Formatear estado del pedido para display
 * @param {string} status - Estado del pedido
 * @returns {Object} Objeto con label y color
 */
export const formatOrderStatus = (status) => {
  const statusMap = {
    pending: { label: 'Pendiente', color: '#ffa726' },
    confirmed: { label: 'Confirmado', color: '#42a5f5' },
    processing: { label: 'Procesando', color: '#ab47bc' },
    shipped: { label: 'Enviado', color: '#66bb6a' },
    delivered: { label: 'Entregado', color: '#26a69a' },
    cancelled: { label: 'Cancelado', color: '#ef5350' },
    refunded: { label: 'Reembolsado', color: '#8d6e63' },
    returned: { label: 'Devuelto', color: '#78909c' },
    completed: { label: 'Completado', color: '#4caf50' }
  };

  return statusMap[status] || { label: status, color: '#9e9e9e' };
};

/**
 * Formatear estado de envío para display
 * @param {string} status - Estado del envío
 * @returns {Object} Objeto con label y color
 */
export const formatShippingStatus = (status) => {
  const statusMap = {
    pending: { label: 'Pendiente', color: '#ffa726' },
    picked_up: { label: 'Recogido', color: '#42a5f5' },
    in_transit: { label: 'En tránsito', color: '#ab47bc' },
    out_for_delivery: { label: 'En reparto', color: '#66bb6a' },
    delivered: { label: 'Entregado', color: '#26a69a' },
    failed: { label: 'Fallido', color: '#ef5350' },
    returned: { label: 'Devuelto', color: '#78909c' }
  };

  return statusMap[status] || { label: status, color: '#9e9e9e' };
};

/**
 * Crear un pago para un pedido
 * @param {string} orderId - ID del pedido
 * @param {string} paymentMethod - Método de pago
 * @returns {Promise<Object>} Resultado de la creación del pago
 */
export const createPayment = async (orderId, paymentMethod) => {
  try {
    console.log('💳 Creando pago:', { orderId, paymentMethod });

    const response = await apiClient.post(`/orders/${orderId}/payment`, { paymentMethod });

    console.log('✅ Pago creado');

    return response.data;
  } catch (error) {
    console.error('❌ Error creando pago:', error.message);
    throw error;
  }
};

/**
 * Confirmar un pago completado
 * @param {string} orderId - ID del pedido
 * @param {string} paymentId - ID del pago a confirmar
 * @returns {Promise<Object>} Confirmación del pago
 */
export const confirmPayment = async (orderId, paymentId) => {
  try {
    console.log('✅ Confirmando pago:', { orderId, paymentId });

    const response = await apiClient.post(`/orders/${orderId}/payment/confirm`, { paymentId });

    console.log('✅ Pago confirmado');

    return response.data;
  } catch (error) {
    console.error('❌ Error confirmando pago:', error.message);
    throw error;
  }
};

/**
 * Procesar reembolso de un pedido
 * @param {string} orderId - ID del pedido
 * @param {number} amount - Monto a reembolsar
 * @param {string} reason - Razón del reembolso
 * @returns {Promise<Object>} Resultado del reembolso
 */
export const processRefund = async (orderId, amount, reason) => {
  try {
    console.log('💸 Procesando reembolso:', { orderId, amount, reason });

    const response = await apiClient.post(`/orders/${orderId}/refund`, { amount, reason });

    console.log('✅ Reembolso procesado');

    return response.data;
  } catch (error) {
    console.error('❌ Error procesando reembolso:', error.message);
    throw error;
  }
};

/**
 * Obtener métodos de pago disponibles
 * @param {string} country - Código de país (opcional)
 * @returns {Promise<Object>} Métodos de pago disponibles
 */
export const getPaymentMethods = async (country = null) => {
  try {
    console.log('💳 Obteniendo métodos de pago:', { country });

    const params = country ? { country } : {};
    const response = await apiClient.get('/orders/payment-methods', { params });

    console.log('✅ Métodos de pago obtenidos');

    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo métodos de pago:', error.message);
    throw error;
  }
};

/**
 * Formatear método de pago para display
 * @param {string} method - Método de pago
 * @returns {Object} Objeto con nombre y descripción
 */
export const formatPaymentMethod = (method) => {
  const methodMap = {
    paypal: { name: 'PayPal', description: 'Pago seguro con PayPal', icon: '💳' },
    apple_pay: { name: 'Apple Pay', description: 'Pago rápido con Apple Pay', icon: '📱' },
    mercadopago: { name: 'MercadoPago', description: 'Pago con MercadoPago (México)', icon: '💰' },
    conekta: { name: 'Conekta', description: 'Tarjeta de crédito/débito', icon: '💳' },
    stripe: { name: 'Stripe', description: 'Pago con tarjeta', icon: '💳' },
    bank_transfer: { name: 'Transferencia', description: 'Transferencia bancaria', icon: '🏦' },
    cash_on_delivery: { name: 'Contra entrega', description: 'Paga al recibir', icon: '💵' }
  };

  return methodMap[method] || { name: method, description: 'Método de pago', icon: '💳' };
};

/**
 * Formatear estado de pago para display
 * @param {string} status - Estado del pago
 * @returns {Object} Objeto con label y color
 */
export const formatPaymentStatus = (status) => {
  const statusMap = {
    pending: { label: 'Pendiente', color: '#ffa726' },
    processing: { label: 'Procesando', color: '#42a5f5' },
    completed: { label: 'Completado', color: '#4caf50' },
    failed: { label: 'Fallido', color: '#ef5350' },
    refunded: { label: 'Reembolsado', color: '#8d6e63' },
    partially_refunded: { label: 'Reembolso parcial', color: '#ff9800' }
  };

  return statusMap[status] || { label: status, color: '#9e9e9e' };
};

export default {
  getUserOrders,
  getOrderDetails,
  getOrderTracking,
  reorderOrder,
  getOrderStats,
  formatOrderStatus,
  formatShippingStatus,
  createPayment,
  confirmPayment,
  processRefund,
  getPaymentMethods,
  formatPaymentMethod,
  formatPaymentStatus
};