import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { logout, authenticatedRequest } = useAuth();

  // Tipos de errores específicos
  const ERROR_TYPES = {
    NETWORK: 'NETWORK',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    VALIDATION: 'VALIDATION',
    RATE_LIMIT: 'RATE_LIMIT',
    SERVER: 'SERVER',
    NOT_FOUND: 'NOT_FOUND',
    UNKNOWN: 'UNKNOWN'
  };

  // Función para clasificar errores
  const classifyError = useCallback((error, response = null) => {
    // Errores de red
    if (!navigator.onLine) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: 'Sin conexión a internet. Verifica tu conexión.',
        userMessage: 'No hay conexión a internet. Revisa tu conexión e intenta nuevamente.',
        retryable: true,
        statusCode: 0
      };
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: 'Error de conexión con el servidor.',
        userMessage: 'No se pudo conectar con el servidor. Intenta nuevamente.',
        retryable: true,
        statusCode: 0
      };
    }

    // Errores HTTP
    if (response) {
      const { status } = response;

      switch (status) {
        case 401:
          return {
            type: ERROR_TYPES.AUTHENTICATION,
            message: 'Sesión expirada o inválida.',
            userMessage: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
            retryable: false,
            statusCode: status,
            action: 'LOGOUT'
          };

        case 403:
          return {
            type: ERROR_TYPES.AUTHORIZATION,
            message: 'No tienes permisos para esta acción.',
            userMessage: 'No tienes permisos para realizar esta acción.',
            retryable: false,
            statusCode: status
          };

        case 404:
          return {
            type: ERROR_TYPES.NOT_FOUND,
            message: 'Recurso no encontrado.',
            userMessage: 'El elemento que buscas no existe.',
            retryable: false,
            statusCode: status
          };

        case 422:
          return {
            type: ERROR_TYPES.VALIDATION,
            message: 'Datos de entrada inválidos.',
            userMessage: 'Los datos proporcionados no son válidos.',
            retryable: false,
            statusCode: status
          };

        case 429:
          return {
            type: ERROR_TYPES.RATE_LIMIT,
            message: 'Demasiadas solicitudes.',
            userMessage: 'Has realizado demasiadas solicitudes. Espera un momento e intenta nuevamente.',
            retryable: true,
            statusCode: status,
            retryAfter: response.headers?.get('Retry-After')
          };

        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: ERROR_TYPES.SERVER,
            message: 'Error interno del servidor.',
            userMessage: 'Error temporal del servidor. Intenta nuevamente en unos minutos.',
            retryable: true,
            statusCode: status
          };

        default:
          return {
            type: ERROR_TYPES.UNKNOWN,
            message: `Error HTTP ${status}`,
            userMessage: 'Ha ocurrido un error inesperado.',
            retryable: status >= 500,
            statusCode: status
          };
      }
    }

    // Errores de API personalizados
    if (error.response?.data?.message) {
      return {
        type: ERROR_TYPES.UNKNOWN,
        message: error.response.data.message,
        userMessage: error.response.data.message,
        retryable: false,
        statusCode: error.response.status
      };
    }

    // Error desconocido
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: error.message || 'Error desconocido',
      userMessage: 'Ha ocurrido un error inesperado.',
      retryable: false,
      statusCode: null
    };
  }, []);

  // Función principal para manejar errores
  const handleError = useCallback(async (error, response = null, context = {}) => {
    const classifiedError = classifyError(error, response);

    // Log del error para debugging
    console.error('Error handled:', {
      error,
      response,
      context,
      classifiedError
    });

    // Acciones específicas según el tipo de error
    switch (classifiedError.action) {
      case 'LOGOUT':
        await logout();
        break;
      default:
        break;
    }

    setError({
      ...classifiedError,
      timestamp: new Date().toISOString(),
      context
    });

    return classifiedError;
  }, [classifyError, logout]);

  // Función para reintentar operaciones
  const retryOperation = useCallback(async (operation, maxRetries = 3, delay = 1000) => {
    setIsRetrying(true);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        setIsRetrying(false);
        setError(null);
        return result;
      } catch (error) {
        const classifiedError = classifyError(error);

        if (!classifiedError.retryable || attempt === maxRetries) {
          setIsRetrying(false);
          throw error;
        }

        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }, [classifyError]);

  // Función para hacer requests con manejo de errores
  const safeRequest = useCallback(async (url, options = {}, context = {}) => {
    try {
      const response = await authenticatedRequest(url, options);

      if (!response.ok) {
        await handleError(new Error(`HTTP ${response.status}`), response, context);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Verificar si la respuesta tiene errores
      if (data.success === false) {
        const apiError = new Error(data.message || 'Error en la API');
        await handleError(apiError, response, context);
        throw apiError;
      }

      setError(null);
      return data;
    } catch (error) {
      await handleError(error, null, context);
      throw error;
    }
  }, [authenticatedRequest, handleError]);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Función para verificar conectividad
  const checkConnectivity = useCallback(async () => {
    try {
      // Intentar hacer un ping al servidor
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/health`, {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    error,
    isRetrying,
    ERROR_TYPES,
    handleError,
    retryOperation,
    safeRequest,
    clearError,
    checkConnectivity,
    classifyError
  };
};

export default useErrorHandler;