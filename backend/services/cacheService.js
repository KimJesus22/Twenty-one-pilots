const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hora por defecto
    this.init();
  }

  // Inicializar conexión Redis
  async init() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.client.on('connect', () => {
        console.log('✅ Conectado a Redis');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Error de Redis:', err.message);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        console.log('🚀 Redis listo para usar');
      });

      // Conectar
      await this.client.connect();

    } catch (error) {
      console.warn('⚠️  Redis no disponible, funcionando sin caché:', error.message);
      this.isConnected = false;
    }
  }

  // Verificar si Redis está disponible
  isAvailable() {
    return this.isConnected && this.client && this.client.status === 'ready';
  }

  // Generar clave de caché
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');

    return `${prefix}:${sortedParams || 'default'}`;
  }

  // Obtener valor del caché
  async get(key) {
    try {
      if (!this.isAvailable()) return null;

      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo de caché:', error);
      return null;
    }
  }

  // Establecer valor en caché
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isAvailable()) return false;

      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error guardando en caché:', error);
      return false;
    }
  }

  // Eliminar clave del caché
  async del(key) {
    try {
      if (!this.isAvailable()) return false;

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Error eliminando de caché:', error);
      return false;
    }
  }

  // Limpiar todas las claves con un patrón
  async clearPattern(pattern) {
    try {
      if (!this.isAvailable()) return false;

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Error limpiando patrón de caché:', error);
      return false;
    }
  }

  // Obtener o establecer (cache miss)
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    try {
      // Intentar obtener del caché
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Si no está en caché, ejecutar función y guardar
      const result = await fetchFunction();
      if (result !== null && result !== undefined) {
        await this.set(key, result, ttl);
      }

      return result;
    } catch (error) {
      console.error('Error en getOrSet:', error);
      // En caso de error, intentar ejecutar la función sin caché
      try {
        return await fetchFunction();
      } catch (fetchError) {
        console.error('Error ejecutando función de fallback:', fetchError);
        return null;
      }
    }
  }

  // Métodos específicos para diferentes tipos de datos

  // Caché para álbumes
  async getAlbums(params = {}) {
    const key = this.generateKey('albums', params);
    return this.getOrSet(key, async () => {
      // Aquí iría la lógica para obtener álbumes de la DB
      return { message: 'Albums from cache' };
    }, 1800); // 30 minutos
  }

  // Caché para conciertos
  async getConcerts(params = {}) {
    const key = this.generateKey('concerts', params);
    return this.getOrSet(key, async () => {
      // Aquí iría la lógica para obtener conciertos
      return { message: 'Concerts from cache' };
    }, 900); // 15 minutos
  }

  // Caché para letras
  async getLyrics(songId) {
    const key = `lyrics:song:${songId}`;
    return this.getOrSet(key, async () => {
      // Aquí iría la lógica para obtener letras
      return { message: `Lyrics for song ${songId} from cache` };
    }, 3600); // 1 hora
  }

  // Caché para datos de usuario
  async getUserData(userId) {
    const key = `user:${userId}:data`;
    return this.getOrSet(key, async () => {
      // Aquí iría la lógica para obtener datos de usuario
      return { message: `User ${userId} data from cache` };
    }, 1800); // 30 minutos
  }

  // Caché para búsquedas
  async getSearchResults(query, type) {
    const key = `search:${type}:${query.toLowerCase()}`;
    return this.getOrSet(key, async () => {
      // Aquí iría la lógica de búsqueda
      return { message: `Search results for "${query}" from cache` };
    }, 600); // 10 minutos
  }

  // Invalidar caché relacionado con un concierto
  async invalidateConcertCache(concertId) {
    try {
      const patterns = [
        `concert:${concertId}:*`,
        `concerts:*`,
        `maps:concert:${concertId}`,
        `search:*:*concert*`
      ];

      for (const pattern of patterns) {
        await this.clearPattern(pattern);
      }

      console.log(`Caché invalidado para concierto ${concertId}`);
      return true;
    } catch (error) {
      console.error('Error invalidando caché de concierto:', error);
      return false;
    }
  }

  // Invalidar caché relacionado con un usuario
  async invalidateUserCache(userId) {
    try {
      const patterns = [
        `user:${userId}:*`,
        `playlists:user:${userId}:*`,
        `notifications:user:${userId}:*`
      ];

      for (const pattern of patterns) {
        await this.clearPattern(pattern);
      }

      console.log(`Caché invalidado para usuario ${userId}`);
      return true;
    } catch (error) {
      console.error('Error invalidando caché de usuario:', error);
      return false;
    }
  }

  // Estadísticas de caché
  async getStats() {
    try {
      if (!this.isAvailable()) {
        return { status: 'disconnected' };
      }

      const info = await this.client.info();
      const dbSize = await this.client.dbsize();

      return {
        status: 'connected',
        dbSize,
        info: info.split('\r\n').reduce((acc, line) => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            acc[key] = value;
          }
          return acc;
        }, {}),
        uptime: process.uptime()
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de caché:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Limpiar todo el caché
  async clearAll() {
    try {
      if (!this.isAvailable()) return false;

      await this.client.flushdb();
      console.log('Todo el caché limpiado');
      return true;
    } catch (error) {
      console.error('Error limpiando caché:', error);
      return false;
    }
  }

  // Cerrar conexión
  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        console.log('Conexión Redis cerrada');
      }
    } catch (error) {
      console.error('Error cerrando conexión Redis:', error);
    }
  }
}

module.exports = new CacheService();