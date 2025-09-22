const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * Middleware de caché para Express
 * Cachea respuestas JSON de rutas específicas
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutos por defecto
    keyGenerator = null,
    condition = null,
    invalidateOnUpdate = false
  } = options;

  return async (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Verificar condición personalizada
    if (condition && !condition(req)) {
      return next();
    }

    // Generar clave de caché
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : generateDefaultCacheKey(req);

    try {
      // Intentar obtener del caché
      const cachedResponse = await cacheService.get(cacheKey);

      if (cachedResponse) {
        logger.debug(`Cache hit for ${req.originalUrl}`);

        // Restaurar headers y enviar respuesta cacheada
        if (cachedResponse.headers) {
          Object.entries(cachedResponse.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }

        // Agregar header indicando que viene del caché
        res.setHeader('X-Cache-Status', 'HIT');
        res.setHeader('X-Cache-TTL', ttl);

        return res.status(cachedResponse.status || 200).json(cachedResponse.data);
      }

      logger.debug(`Cache miss for ${req.originalUrl}`);

      // Interceptar la respuesta para cachearla
      const originalJson = res.json;
      const originalStatus = res.status;

      let responseData = null;
      let responseStatus = 200;
      let responseHeaders = {};

      // Override res.json para capturar la respuesta
      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Override res.status para capturar el status
      res.status = function(code) {
        responseStatus = code;
        return originalStatus.call(this, code);
      };

      // Hook para después de que se envíe la respuesta
      res.on('finish', async () => {
        // Solo cachear respuestas exitosas
        if (responseStatus >= 200 && responseStatus < 300 && responseData) {
          try {
            // Capturar headers importantes
            const importantHeaders = ['content-type', 'cache-control', 'etag'];
            importantHeaders.forEach(header => {
              const value = res.getHeader(header);
              if (value) {
                responseHeaders[header] = value;
              }
            });

            const cacheData = {
              data: responseData,
              status: responseStatus,
              headers: responseHeaders,
              cachedAt: new Date().toISOString(),
              ttl
            };

            await cacheService.set(cacheKey, cacheData, ttl);
            logger.debug(`Response cached for ${req.originalUrl} with key ${cacheKey}`);
          } catch (error) {
            logger.error('Error caching response:', error);
          }
        }
      });

      // Agregar header indicando cache miss
      res.setHeader('X-Cache-Status', 'MISS');

      next();

    } catch (error) {
      logger.error('Cache middleware error:', error);
      // En caso de error del caché, continuar normalmente
      res.setHeader('X-Cache-Status', 'ERROR');
      next();
    }
  };
};

/**
 * Genera una clave de caché por defecto basada en la URL y parámetros
 */
function generateDefaultCacheKey(req) {
  const { originalUrl, query, user } = req;

  // Incluir user ID si está autenticado para cache personalizado
  const userId = user ? user._id : 'anonymous';

  // Crear hash de los parámetros de query ordenados
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');

  return `route:${userId}:${originalUrl}:${queryString}`;
}

/**
 * Middleware para invalidar caché cuando se actualizan datos
 */
const cacheInvalidationMiddleware = (patterns) => {
  return async (req, res, next) => {
    // Almacenar el estado original para comparación
    const originalJson = res.json;

    res.json = async function(data) {
      const result = originalJson.call(this, data);

      // Solo invalidar en respuestas exitosas
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          if (Array.isArray(patterns)) {
            for (const pattern of patterns) {
              await cacheService.invalidatePattern(pattern);
            }
          } else {
            await cacheService.invalidatePattern(patterns);
          }

          logger.info(`Cache invalidated for patterns: ${Array.isArray(patterns) ? patterns.join(', ') : patterns}`);
        } catch (error) {
          logger.error('Error invalidating cache:', error);
        }
      }

      return result;
    };

    next();
  };
};

/**
 * Función helper para crear middleware de caché con configuración específica
 */
const createCacheMiddleware = (config) => {
  return cacheMiddleware(config);
};

/**
 * Función helper para crear middleware de invalidación
 */
const createInvalidationMiddleware = (patterns) => {
  return cacheInvalidationMiddleware(patterns);
};

/**
 * Middleware para rutas específicas de la aplicación
 */

// Cache para búsquedas de conciertos
const concertsCache = createCacheMiddleware({
  ttl: 600, // 10 minutos
  keyGenerator: (req) => {
    const { city, date, artist, page = 1, limit = 10 } = req.query;
    return `concerts:search:${city || 'all'}:${date || 'all'}:${artist || 'all'}:${page}:${limit}`;
  },
  condition: (req) => !req.query.refresh // No cachear si se solicita refresh
});

// Cache para letras de canciones
const lyricsCache = createCacheMiddleware({
  ttl: 1800, // 30 minutos
  keyGenerator: (req) => {
    const { query, artist, song, page = 1, limit = 10 } = req.query;
    return `lyrics:search:${query || 'all'}:${artist || 'all'}:${song || 'all'}:${page}:${limit}`;
  }
});

// Cache para productos de tienda
const productsCache = createCacheMiddleware({
  ttl: 900, // 15 minutos
  keyGenerator: (req) => {
    const { category, search, page = 1, limit = 12 } = req.query;
    return `products:search:${category || 'all'}:${search || 'all'}:${page}:${limit}`;
  }
});

// Cache para recomendaciones
const recommendationsCache = createCacheMiddleware({
  ttl: 3600, // 1 hora
  keyGenerator: (req) => {
    const userId = req.user ? req.user._id : 'anonymous';
    const { type = 'general' } = req.query;
    return `recommendations:${userId}:${type}`;
  }
});

/**
 * Middlewares de invalidación para cuando se actualizan datos
 */

// Invalidar caché de conciertos cuando se crea/actualiza/elimina un concierto
const concertsInvalidation = createInvalidationMiddleware('concerts:*');

// Invalidar caché de letras cuando se actualizan
const lyricsInvalidation = createInvalidationMiddleware('lyrics:*');

// Invalidar caché de productos cuando se actualizan
const productsInvalidation = createInvalidationMiddleware('products:*');

// Invalidar recomendaciones de usuario específico
const userRecommendationsInvalidation = (req, res, next) => {
  const originalJson = res.json;

  res.json = async function(data) {
    const result = originalJson.call(this, data);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const userId = req.user ? req.user._id : req.params.userId;
        if (userId) {
          await cacheService.invalidatePattern(`recommendations:${userId}:*`);
          logger.info(`User recommendations cache invalidated for user: ${userId}`);
        }
      } catch (error) {
        logger.error('Error invalidating user recommendations cache:', error);
      }
    }

    return result;
  };

  next();
};

module.exports = {
  cacheMiddleware,
  cacheInvalidationMiddleware,
  createCacheMiddleware,
  createInvalidationMiddleware,

  // Middlewares preconfigurados
  concertsCache,
  lyricsCache,
  productsCache,
  recommendationsCache,

  // Middlewares de invalidación
  concertsInvalidation,
  lyricsInvalidation,
  productsInvalidation,
  userRecommendationsInvalidation,

  // Utilidades
  generateDefaultCacheKey
};