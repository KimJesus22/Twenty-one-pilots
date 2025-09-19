const expressSanitizer = require('express-sanitizer');
const logger = require('../utils/logger');

/**
 * Middleware de sanitización avanzada para prevenir XSS e inyecciones
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
      sanitizeObject(req.query);
    }

    // Sanitizar route parameters
    if (req.params && typeof req.params === 'object') {
      sanitizeObject(req.params);
    }

    // Usar express-sanitizer para sanitización adicional
    if (req.sanitize) {
      // Sanitizar campos comunes que podrían contener HTML/XSS
      if (req.body) {
        Object.keys(req.body).forEach(key => {
          if (typeof req.body[key] === 'string') {
            req.body[key] = req.sanitize(req.body[key]);
          }
        });
      }

      if (req.query) {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string') {
            req.query[key] = req.sanitize(req.query[key]);
          }
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error en sanitización de entrada:', error);
    return res.status(400).json({
      success: false,
      message: 'Error procesando la solicitud'
    });
  }
};

/**
 * Función recursiva para sanitizar objetos anidados
 */
function sanitizeObject(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Remover caracteres peligrosos
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Iframes
          .replace(/javascript:/gi, '') // JavaScript URLs
          .replace(/on\w+\s*=/gi, '') // Event handlers
          .replace(/<[^>]*>/g, '') // HTML tags básicos
          .trim();

        // Limitar longitud para prevenir ataques de denial of service
        if (obj[key].length > 10000) {
          obj[key] = obj[key].substring(0, 10000) + '...';
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  }
}

/**
 * Middleware para validar y sanitizar IDs de MongoDB
 */
const validateMongoId = (req, res, next) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

  // Validar IDs en parámetros de ruta
  Object.keys(req.params).forEach(key => {
    if (key.toLowerCase().includes('id') && !mongoIdRegex.test(req.params[key])) {
      logger.warn('ID de MongoDB inválido detectado:', {
        param: key,
        value: req.params[key],
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
  });

  // Validar IDs en query parameters
  Object.keys(req.query).forEach(key => {
    if (key.toLowerCase().includes('id') && req.query[key] && !mongoIdRegex.test(req.query[key])) {
      logger.warn('ID de MongoDB inválido en query:', {
        param: key,
        value: req.query[key],
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        message: 'ID inválido en parámetros de consulta'
      });
    }
  });

  next();
};

/**
 * Middleware para prevenir inyección NoSQL
 */
const preventNoSQLInjection = (req, res, next) => {
  const dangerousPatterns = [
    /\$\w+/g,  // Operadores MongoDB como $gt, $lt, etc.
    /\{.*\}/g, // Objetos JSON
    /eval\(/g, // Eval functions
    /Function\(/g, // Function constructors
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          logger.warn('Patrón peligroso detectado en entrada:', {
            pattern: pattern.toString(),
            value: value.substring(0, 100),
            ip: req.ip
          });
          return true;
        }
      }
    }
    return false;
  };

  const checkObject = (obj) => {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (checkValue(obj[key])) {
          return true;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkObject(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  if (req.body && checkObject(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Contenido no permitido detectado'
    });
  }

  if (req.query && checkObject(req.query)) {
    return res.status(400).json({
      success: false,
      message: 'Parámetros de consulta no válidos'
    });
  }

  next();
};

/**
 * Middleware para rate limiting avanzado por endpoint
 */
const advancedRateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    // Limpiar requests antiguos
    const validRequests = userRequests.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      logger.warn('Rate limit excedido:', {
        ip: req.ip,
        path: req.path,
        requestsCount: validRequests.length
      });
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intente más tarde.'
      });
    }

    validRequests.push(now);
    requests.set(key, validRequests);

    // Limpiar mapa periódicamente para evitar memory leaks
    if (Math.random() < 0.01) { // 1% de probabilidad
      for (const [k, v] of requests.entries()) {
        const valid = v.filter(time => time > windowStart);
        if (valid.length === 0) {
          requests.delete(k);
        } else {
          requests.set(k, valid);
        }
      }
    }

    next();
  };
};

/**
 * Middleware para logging de seguridad
 */
const securityLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log requests sospechosas
    if (req.path.includes('..') || req.path.includes('\\') || req.path.includes('/')) {
      logger.warn('Request sospechoso detectado:', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Log requests lentas (posible ataque DoS)
    if (duration > 5000) {
      logger.warn('Request lenta detectada:', {
        path: req.path,
        method: req.method,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });

  next();
};

module.exports = {
  sanitizeInput,
  validateMongoId,
  preventNoSQLInjection,
  advancedRateLimit,
  securityLogger
};