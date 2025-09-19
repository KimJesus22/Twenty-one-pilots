const { validationResult } = require('express-validator');
const { validate } = require('../validations/schemas');
const logger = require('../utils/logger');

/**
 * Middleware para combinar validaciones de express-validator con Joi
 */
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // Primero ejecutar validaciones de express-validator si existen
      const expressErrors = validationResult(req);
      if (!expressErrors.isEmpty()) {
        logger.warn('Errores de validación express-validator:', {
          errors: expressErrors.array(),
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: expressErrors.array()
        });
      }

      // Luego validar con Joi si se proporciona un esquema
      if (schema) {
        const dataToValidate = req[source];
        if (!dataToValidate) {
          return res.status(400).json({
            success: false,
            message: `Datos de ${source} no encontrados`
          });
        }

        const joiResult = validate(schema, dataToValidate);

        if (!joiResult.isValid) {
          logger.warn('Errores de validación Joi:', {
            errors: joiResult.errors,
            path: req.path,
            method: req.method,
            source
          });

          return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: joiResult.errors
          });
        }

        // Reemplazar los datos validados
        req[source] = joiResult.value;
      }

      next();
    } catch (error) {
      logger.error('Error en middleware de validación:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware para validar parámetros de ruta
 */
const validateParams = (paramName, validator) => {
  return (req, res, next) => {
    try {
      const value = req.params[paramName];
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `Parámetro ${paramName} es requerido`
        });
      }

      const joiResult = validate(validator, { [paramName]: value });

      if (!joiResult.isValid) {
        logger.warn(`Error de validación en parámetro ${paramName}:`, {
          errors: joiResult.errors,
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          success: false,
          message: 'Parámetro inválido',
          errors: joiResult.errors
        });
      }

      // Actualizar el parámetro validado
      req.params[paramName] = joiResult.value[paramName];

      next();
    } catch (error) {
      logger.error('Error en validación de parámetros:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware para validar query parameters
 */
const validateQuery = (schema) => {
  return validateRequest(schema, 'query');
};

/**
 * Middleware para validar body
 */
const validateBody = (schema) => {
  return validateRequest(schema, 'body');
};

/**
 * Middleware para validar archivos (si se implementa subida de archivos)
 */
const validateFiles = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    try {
      if (!req.files && !req.file) {
        return next(); // No hay archivos para validar
      }

      const files = req.files || [req.file];

      for (const file of files) {
        // Validar tamaño
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `Archivo ${file.originalname} excede el tamaño máximo permitido (${maxSize / (1024 * 1024)}MB)`
          });
        }

        // Validar tipo si se especifican tipos permitidos
        if (allowedTypes.length > 0) {
          const fileType = file.mimetype.split('/')[1];
          if (!allowedTypes.includes(fileType)) {
            return res.status(400).json({
              success: false,
              message: `Tipo de archivo ${fileType} no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
            });
          }
        }

        // Validar nombre de archivo (prevenir path traversal)
        if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
          return res.status(400).json({
            success: false,
            message: 'Nombre de archivo inválido'
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Error en validación de archivos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware para sanitizar y validar datos de entrada
 */
const sanitizeAndValidate = (schema, options = {}) => {
  const {
    source = 'body',
    sanitize = true,
    strict = false
  } = options;

  return (req, res, next) => {
    try {
      // Sanitización básica (si está habilitada)
      if (sanitize && req[source]) {
        const data = req[source];

        // Recursivamente sanitizar strings
        const sanitizeValue = (value) => {
          if (typeof value === 'string') {
            return value
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .trim();
          } else if (typeof value === 'object' && value !== null) {
            for (const key in value) {
              if (value.hasOwnProperty(key)) {
                value[key] = sanitizeValue(value[key]);
              }
            }
          }
          return value;
        };

        req[source] = sanitizeValue(data);
      }

      // Validación con Joi
      if (schema) {
        const joiResult = validate(schema, req[source], { abortEarly: !strict });

        if (!joiResult.isValid) {
          logger.warn('Errores de validación:', {
            errors: joiResult.errors,
            path: req.path,
            method: req.method,
            source
          });

          return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: joiResult.errors
          });
        }

        req[source] = joiResult.value;
      }

      next();
    } catch (error) {
      logger.error('Error en sanitización y validación:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

module.exports = {
  validateRequest,
  validateParams,
  validateQuery,
  validateBody,
  validateFiles,
  sanitizeAndValidate
};