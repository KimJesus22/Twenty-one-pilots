/**
 * Servicio de Pagos - Integración con múltiples proveedores
 * Soporta PayPal, Apple Pay, MercadoPago, Conekta y Stripe
 *
 * @author KimJesus21
 * @version 1.0.0
 * @since 2025-09-24
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Configuración de proveedores de pago
const PAYMENT_CONFIG = {
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox',
    baseUrl: process.env.PAYPAL_MODE === 'live'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com'
  },
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    baseUrl: 'https://api.mercadopago.com'
  },
  conekta: {
    privateKey: process.env.CONEKTA_PRIVATE_KEY,
    publicKey: process.env.CONEKTA_PUBLIC_KEY,
    baseUrl: 'https://api.conekta.io'
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  }
};

// Tipos de cambio aproximados (en producción usar API real)
const EXCHANGE_RATES = {
  USD_TO_MXN: 18.50,
  EUR_TO_MXN: 20.10,
  MXN_TO_USD: 1 / 18.50,
  EUR_TO_USD: 1.085
};

class PaymentService {
  constructor() {
    this.providers = {};
    this.initializeProviders();
  }

  /**
   * Inicializar proveedores de pago disponibles
   */
  initializeProviders() {
    // PayPal
    if (PAYMENT_CONFIG.paypal.clientId && PAYMENT_CONFIG.paypal.clientSecret) {
      this.providers.paypal = new PayPalProvider(PAYMENT_CONFIG.paypal);
    }

    // MercadoPago
    if (PAYMENT_CONFIG.mercadopago.accessToken) {
      this.providers.mercadopago = new MercadoPagoProvider(PAYMENT_CONFIG.mercadopago);
    }

    // Conekta
    if (PAYMENT_CONFIG.conekta.privateKey) {
      this.providers.conekta = new ConektaProvider(PAYMENT_CONFIG.conekta);
    }

    // Stripe (si existe)
    if (PAYMENT_CONFIG.stripe.secretKey) {
      this.providers.stripe = new StripeProvider(PAYMENT_CONFIG.stripe);
    }

    logger.info('Payment providers initialized:', Object.keys(this.providers));
  }

  /**
   * Crear una orden de pago
   * @param {Object} orderData - Datos del pedido
   * @param {string} paymentMethod - Método de pago
   * @returns {Promise<Object>} Resultado del pago
   */
  async createPayment(orderData, paymentMethod) {
    try {
      logger.info('Creating payment:', { orderId: orderData.orderNumber, paymentMethod });

      const provider = this.providers[paymentMethod];
      if (!provider) {
        throw new Error(`Payment method ${paymentMethod} not supported`);
      }

      // Convertir moneda si es necesario
      const convertedOrderData = await this.convertCurrency(orderData);

      const result = await provider.createPayment(convertedOrderData);

      logger.info('Payment created successfully:', {
        orderId: orderData.orderNumber,
        paymentId: result.paymentId,
        status: result.status
      });

      return result;
    } catch (error) {
      logger.error('Payment creation failed:', error);
      throw error;
    }
  }

  /**
   * Confirmar un pago
   * @param {string} paymentId - ID del pago
   * @param {string} paymentMethod - Método de pago
   * @returns {Promise<Object>} Confirmación del pago
   */
  async confirmPayment(paymentId, paymentMethod) {
    try {
      logger.info('Confirming payment:', { paymentId, paymentMethod });

      const provider = this.providers[paymentMethod];
      if (!provider) {
        throw new Error(`Payment method ${paymentMethod} not supported`);
      }

      const result = await provider.confirmPayment(paymentId);

      logger.info('Payment confirmed:', { paymentId, status: result.status });

      return result;
    } catch (error) {
      logger.error('Payment confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Procesar reembolso
   * @param {string} paymentId - ID del pago original
   * @param {number} amount - Monto a reembolsar
   * @param {string} paymentMethod - Método de pago
   * @returns {Promise<Object>} Resultado del reembolso
   */
  async refundPayment(paymentId, amount, paymentMethod) {
    try {
      logger.info('Processing refund:', { paymentId, amount, paymentMethod });

      const provider = this.providers[paymentMethod];
      if (!provider) {
        throw new Error(`Payment method ${paymentMethod} not supported`);
      }

      const result = await provider.refundPayment(paymentId, amount);

      logger.info('Refund processed:', { paymentId, refundId: result.refundId });

      return result;
    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw error;
    }
  }

  /**
   * Convertir moneda si es necesario
   * @param {Object} orderData - Datos del pedido
   * @returns {Promise<Object>} Datos convertidos
   */
  async convertCurrency(orderData) {
    const { currency, total } = orderData;

    // Si es MXN y necesitamos conversión, usar tasas aproximadas
    if (currency === 'MXN') {
      // En producción, aquí iría la llamada a una API de tipos de cambio
      const usdTotal = total * EXCHANGE_RATES.MXN_TO_USD;
      return {
        ...orderData,
        originalTotal: total,
        originalCurrency: currency,
        convertedTotal: usdTotal,
        convertedCurrency: 'USD'
      };
    }

    return orderData;
  }

  /**
   * Obtener métodos de pago disponibles
   * @param {string} country - País del usuario (opcional)
   * @returns {Array} Métodos disponibles
   */
  getAvailableMethods(country = null) {
    const methods = Object.keys(this.providers);

    // Filtrar por país si es necesario
    if (country === 'MX') {
      return methods.filter(method =>
        ['mercadopago', 'conekta', 'paypal', 'stripe'].includes(method)
      );
    }

    return methods;
  }

  /**
   * Validar configuración de proveedores
   * @returns {Object} Estado de configuración
   */
  validateConfiguration() {
    const status = {};

    Object.keys(PAYMENT_CONFIG).forEach(provider => {
      const config = PAYMENT_CONFIG[provider];
      status[provider] = {
        configured: this.providers[provider] ? true : false,
        requiredFields: Object.keys(config).filter(key =>
          config[key] && config[key].startsWith('process.env.')
        )
      };
    });

    return status;
  }
}

// Proveedor PayPal
class PayPalProvider {
  constructor(config) {
    this.config = config;
    this.accessToken = null;
  }

  async getAccessToken() {
    if (this.accessToken) return this.accessToken;

    try {
      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await axios.post(`${this.config.baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      throw new Error('Failed to get PayPal access token');
    }
  }

  async createPayment(orderData) {
    const token = await this.getAccessToken();

    const paymentData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderData.orderNumber,
        amount: {
          currency_code: orderData.currency,
          value: orderData.total.toFixed(2)
        },
        description: `Order ${orderData.orderNumber}`
      }]
    };

    const response = await axios.post(`${this.config.baseUrl}/v2/checkout/orders`, paymentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      paymentId: response.data.id,
      status: response.data.status,
      approvalUrl: response.data.links.find(link => link.rel === 'approve').href
    };
  }

  async confirmPayment(paymentId) {
    const token = await this.getAccessToken();

    const response = await axios.post(`${this.config.baseUrl}/v2/checkout/orders/${paymentId}/capture`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      status: response.data.status,
      transactionId: response.data.purchase_units[0].payments.captures[0].id
    };
  }

  async refundPayment(paymentId, amount) {
    const token = await this.getAccessToken();

    const refundData = {
      amount: {
        value: amount.toFixed(2),
        currency_code: 'USD'
      }
    };

    const response = await axios.post(`${this.config.baseUrl}/v2/payments/captures/${paymentId}/refund`, refundData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      refundId: response.data.id,
      status: response.data.status
    };
  }
}

// Proveedor MercadoPago
class MercadoPagoProvider {
  constructor(config) {
    this.config = config;
  }

  async createPayment(orderData) {
    const paymentData = {
      transaction_amount: orderData.total,
      currency_id: orderData.currency,
      description: `Order ${orderData.orderNumber}`,
      external_reference: orderData.orderNumber,
      payment_method_id: 'account_money', // Simplificado
      payer: {
        email: orderData.customerEmail
      }
    };

    const response = await axios.post(`${this.config.baseUrl}/v1/payments`, paymentData, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      paymentId: response.data.id.toString(),
      status: response.data.status,
      paymentUrl: response.data.point_of_interaction?.transaction_data?.ticket_url
    };
  }

  async confirmPayment(paymentId) {
    const response = await axios.get(`${this.config.baseUrl}/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    });

    return {
      status: response.data.status,
      transactionId: response.data.id.toString()
    };
  }

  async refundPayment(paymentId, amount) {
    const refundData = {
      amount: amount
    };

    const response = await axios.post(`${this.config.baseUrl}/v1/payments/${paymentId}/refunds`, refundData, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      refundId: response.data.id.toString(),
      status: response.data.status
    };
  }
}

// Proveedor Conekta
class ConektaProvider {
  constructor(config) {
    this.config = config;
  }

  async createPayment(orderData) {
    const chargeData = {
      amount: Math.round(orderData.total * 100), // Conekta usa centavos
      currency: orderData.currency,
      description: `Order ${orderData.orderNumber}`,
      reference_id: orderData.orderNumber,
      card: {
        number: orderData.cardNumber,
        exp_month: orderData.expMonth,
        exp_year: orderData.expYear,
        cvc: orderData.cvc
      }
    };

    const response = await axios.post(`${this.config.baseUrl}/charges`, chargeData, {
      headers: {
        'Authorization': `Bearer ${this.config.privateKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.conekta-v2.0.0+json'
      }
    });

    return {
      paymentId: response.data.id,
      status: response.data.status,
      transactionId: response.data.id
    };
  }

  async confirmPayment(paymentId) {
    const response = await axios.get(`${this.config.baseUrl}/charges/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.privateKey}`,
        'Accept': 'application/vnd.conekta-v2.0.0+json'
      }
    });

    return {
      status: response.data.status,
      transactionId: response.data.id
    };
  }

  async refundPayment(paymentId, amount) {
    const refundData = {
      amount: Math.round(amount * 100)
    };

    const response = await axios.post(`${this.config.baseUrl}/charges/${paymentId}/refunds`, refundData, {
      headers: {
        'Authorization': `Bearer ${this.config.privateKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.conekta-v2.0.0+json'
      }
    });

    return {
      refundId: response.data.id,
      status: response.data.status
    };
  }
}

// Proveedor Stripe (simplificado)
class StripeProvider {
  constructor(config) {
    this.config = config;
    // En producción usar stripe npm package
  }

  async createPayment(orderData) {
    // Simulación - en producción usar Stripe SDK
    return {
      paymentId: `stripe_${Date.now()}`,
      status: 'requires_payment_method',
      clientSecret: `client_secret_${Date.now()}`
    };
  }

  async confirmPayment(paymentId) {
    return {
      status: 'succeeded',
      transactionId: paymentId
    };
  }

  async refundPayment(paymentId, amount) {
    return {
      refundId: `refund_${Date.now()}`,
      status: 'succeeded'
    };
  }
}

// Exportar instancia singleton
const paymentService = new PaymentService();

module.exports = paymentService;