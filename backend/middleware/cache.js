const cacheService = require('../services/cacheService');

/**
 * Middleware para cachear respuestas de rutas
 * @param {string} keyPrefix - Prefijo para la clave de caché
 * @param {number} ttl - Tiempo de vida en segundos
 * @param {function} keyGenerator - Función opcional para generar clave personalizada
 */
const cacheResponse = (keyPrefix, ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      // Generar clave de caché
      let cacheKey;
      if (keyGenerator) {
        cacheKey = keyGenerator(req);
      } else {
        // Clave por defecto basada en ruta y parámetros
        const params = {
          ...req.params,
          ...req.query,
          userId: req.user?.userId
        };
        cacheKey = cacheService.generateKey(keyPrefix, params);
      }

      // Intentar obtener del caché
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        console.log(`📋 Cache hit: ${cacheKey}`);
        return res.json({
          ...cachedData,
          _cached: true,
          _cacheKey: cacheKey
        });
      }

      // Si no está en caché, interceptar la respuesta
      console.log(`💾 Cache miss: ${cacheKey}`);

      // Guardar referencia original de json
      const originalJson = res.json;

      // Sobrescribir res.json para cachear la respuesta
      res.json = function(data) {
        // Solo cachear respuestas exitosas
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl).catch(err =>
            console.error('Error guardando en caché:', err)
          );
        }

        // Restaurar y llamar el método original
        res.json = originalJson;
        return res.json(data);
      };

      next();
    } catch (error) {
      console.error('Error en middleware de caché:', error);
      next();
    }
  };
};

/**
 * Middleware para invalidar caché
 * @param {string|string[]} patterns - Patrones de claves a invalidar
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    // Guardar referencia original de json
    const originalJson = res.json;

    // Sobrescribir res.json para invalidar caché después de respuesta exitosa
    res.json = function(data) {
      // Solo invalidar en respuestas exitosas
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];

        patternArray.forEach(async (pattern) => {
          try {
            await cacheService.clearPattern(pattern);
            console.log(`🗑️  Cache invalidado: ${pattern}`);
          } catch (error) {
            console.error(`Error invalidando caché ${pattern}:`, error);
          }
        });
      }

      // Restaurar y llamar el método original
      res.json = originalJson;
      return res.json(data);
    };

    next();
  };
};

/**
 * Middleware para cachear por usuario
 */
const cachePerUser = (keyPrefix, ttl = 1800) => {
  return cacheResponse(keyPrefix, ttl, (req) => {
    return `${keyPrefix}:user:${req.user?.userId || 'anonymous'}:${req.originalUrl}`;
  });
};

/**
 * Middleware para cachear búsquedas
 */
const cacheSearch = (keyPrefix, ttl = 600) => {
  return cacheResponse(keyPrefix, ttl, (req) => {
    const query = req.query.q || req.query.query || '';
    return `${keyPrefix}:search:${query.toLowerCase()}:${JSON.stringify(req.query)}`;
  });
};

/**
 * Middleware para cachear datos públicos
 */
const cachePublic = (keyPrefix, ttl = 3600) => {
  return cacheResponse(keyPrefix, ttl, (req) => {
    return `${keyPrefix}:public:${req.originalUrl}`;
  });
};

module.exports = {
  cacheResponse,
  invalidateCache,
  cachePerUser,
  cacheSearch,
  cachePublic
};