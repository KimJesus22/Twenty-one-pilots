const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Configuración de Redis con opciones de conexión robustas
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        reconnectOnError: (err) => {
          logger.warn('Redis reconnection on error:', err.message);
          return err.message.includes('READONLY');
        },
        retryDelayOnClusterDown: 1000,
        clusterRetryDelay: 1000
      });

      // Eventos de conexión
      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis connection error:', err);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      await this.client.connect();

    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      // Fallback: continuar sin caché pero loggear
      this.isConnected = false;
    }
  }

  // Verificar conexión
  async ping() {
    if (!this.isConnected || !this.client) return false;

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed:', error);
      return false;
    }
  }

  // Operaciones básicas de caché

  /**
   * Obtener valor del caché
   * @param {string} key - Clave del caché
   * @returns {Promise<any>} Valor almacenado o null
   */
  async get(key) {
    if (!this.isConnected || !this.client) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Establecer valor en caché con expiración
   * @param {string} key - Clave del caché
   * @param {any} value - Valor a almacenar
   * @param {number} ttl - Tiempo de vida en segundos (opcional)
   */
  async set(key, value, ttl = null) {
    if (!this.isConnected || !this.client) return false;

    try {
      const serializedValue = JSON.stringify(value);

      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
        logger.debug(`Cache set with TTL ${ttl}s for key: ${key}`);
      } else {
        await this.client.set(key, serializedValue);
        logger.debug(`Cache set for key: ${key}`);
      }

      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Eliminar clave del caché
   * @param {string} key - Clave a eliminar
   */
  async del(key) {
    if (!this.isConnected || !this.client) return false;

    try {
      const result = await this.client.del(key);
      logger.debug(`Cache deleted for key: ${key}`);
      return result > 0;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Verificar si existe una clave
   * @param {string} key - Clave a verificar
   */
  async exists(key) {
    if (!this.isConnected || !this.client) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Incrementar contador
   * @param {string} key - Clave del contador
   * @param {number} ttl - TTL opcional
   */
  async incr(key, ttl = null) {
    if (!this.isConnected || !this.client) return null;

    try {
      const result = await this.client.incr(key);
      if (ttl) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`Error incrementing cache key ${key}:`, error);
      return null;
    }
  }

  // Operaciones avanzadas de caché

  /**
   * Obtener o establecer (cache miss)
   * @param {string} key - Clave del caché
   * @param {Function} fetcher - Función para obtener datos si no están en caché
   * @param {number} ttl - Tiempo de vida en segundos
   */
  async getOrSet(key, fetcher, ttl = 300) {
    // Intentar obtener del caché primero
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, ejecutar fetcher
    try {
      const data = await fetcher();
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }
      return data;
    } catch (error) {
      logger.error(`Error in cache fetcher for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidar patrones de claves
   * @param {string} pattern - Patrón de claves (ej: "concerts:*")
   */
  async invalidatePattern(pattern) {
    if (!this.isConnected || !this.client) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(...keys);
        logger.info(`Invalidated ${result} cache keys matching pattern: ${pattern}`);
        return result;
      }
      return 0;
    } catch (error) {
      logger.error(`Error invalidating cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  async getStats() {
    if (!this.isConnected || !this.client) {
      return { connected: false };
    }

    try {
      const info = await this.client.info();
      const dbSize = await this.client.dbsize();

      return {
        connected: true,
        dbSize,
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return { connected: false, error: error.message };
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const parsed = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key] = value;
      }
    });

    return parsed;
  }

  // Estrategias específicas de caché para la aplicación

  /**
   * Generar clave de caché para búsquedas de conciertos
   */
  getConcertsSearchKey(params) {
    const { city, date, artist, page = 1, limit = 10 } = params;
    return `concerts:search:${city || 'all'}:${date || 'all'}:${artist || 'all'}:${page}:${limit}`;
  }

  /**
   * Generar clave de caché para letras de canciones
   */
  getLyricsSearchKey(params) {
    const { query, artist, song, page = 1, limit = 10 } = params;
    return `lyrics:search:${query || 'all'}:${artist || 'all'}:${song || 'all'}:${page}:${limit}`;
  }

  /**
   * Generar clave de caché para recomendaciones
   */
  getRecommendationsKey(userId, type = 'general') {
    return `recommendations:${userId}:${type}`;
  }

  /**
   * Invalidar caché de conciertos cuando se actualizan
   */
  async invalidateConcertsCache() {
    await this.invalidatePattern('concerts:*');
  }

  /**
   * Invalidar caché de letras cuando se actualizan
   */
  async invalidateLyricsCache() {
    await this.invalidatePattern('lyrics:*');
  }

  /**
   * Invalidar recomendaciones de usuario
   */
  async invalidateUserRecommendations(userId) {
    await this.invalidatePattern(`recommendations:${userId}:*`);
  }

  /**
   * Limpiar todo el caché
   */
  async clearAll() {
    if (!this.isConnected || !this.client) return false;

    try {
      await this.client.flushdb();
      logger.info('All cache cleared');
      return true;
    } catch (error) {
      logger.error('Error clearing all cache:', error);
      return false;
    }
  }

  // Cleanup
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// Exportar instancia singleton
module.exports = new CacheService();