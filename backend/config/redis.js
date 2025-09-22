// Configuración de Redis para caché distribuido
const redisConfig = {
  // Configuración básica de Redis
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,

  // Configuración avanzada para alta disponibilidad
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  reconnectOnError: (err) => {
    console.warn('Redis reconnection on error:', err.message);
    return err.message.includes('READONLY');
  },
  retryDelayOnClusterDown: 1000,
  clusterRetryDelay: 1000,
  lazyConnect: true,

  // Configuración de conexión
  connectTimeout: 60000,
  commandTimeout: 5000,
  family: 4, // IPv4

  // Configuración de pool de conexiones
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,

  // Configuración de TLS (opcional)
  ...(process.env.REDIS_TLS === 'true' && {
    tls: {
      rejectUnauthorized: false,
      servername: process.env.REDIS_HOST
    }
  })
};

// Configuración de Bull para colas
const bullConfig = {
  redis: redisConfig,

  // Configuración por defecto de jobs
  defaultJobOptions: {
    removeOnComplete: 50,    // Mantener últimos 50 jobs completados
    removeOnFail: 100,       // Mantener últimos 100 jobs fallidos
    attempts: 3,             // Reintentos por defecto
    backoff: {
      type: 'exponential',
      delay: 5000            // Delay inicial de 5 segundos
    }
  },

  // Configuración específica por cola
  queues: {
    email: {
      concurrency: 5,        // 5 workers simultáneos
      limiter: {
        max: 10,             // Máximo 10 jobs por
        duration: 1000       // 1000ms (1 segundo)
      }
    },

    analytics: {
      concurrency: 2,        // 2 workers para analytics
      limiter: {
        max: 20,             // 20 jobs por
        duration: 1000       // segundo
      }
    },

    recommendations: {
      concurrency: 3,        // 3 workers para recomendaciones
      limiter: {
        max: 5,              // 5 jobs por
        duration: 1000       // segundo
      }
    },

    notifications: {
      concurrency: 8,        // 8 workers para notificaciones
      limiter: {
        max: 50,             // 50 jobs por
        duration: 1000       // segundo
      }
    }
  }
};

// Configuración de caché por tipo de dato
const cacheConfig = {
  // TTL por defecto (en segundos)
  defaultTTL: 300, // 5 minutos

  // Configuración específica por tipo
  types: {
    concerts: {
      search: 600,      // 10 minutos para búsquedas
      details: 1800,    // 30 minutos para detalles
      upcoming: 300     // 5 minutos para próximos
    },

    lyrics: {
      search: 1800,     // 30 minutos
      details: 3600     // 1 hora
    },

    products: {
      list: 900,        // 15 minutos
      details: 1800,    // 30 minutos
      categories: 3600  // 1 hora
    },

    recommendations: {
      user: 3600,       // 1 hora por usuario
      general: 1800     // 30 minutos generales
    },

    videos: {
      search: 600,      // 10 minutos
      details: 1800     // 30 minutos
    }
  },

  // Estrategias de invalidación
  invalidation: {
    // Patrones para invalidar caché relacionado
    concerts: ['concerts:*'],
    lyrics: ['lyrics:*'],
    products: ['products:*'],
    recommendations: ['recommendations:*'],
    videos: ['videos:*'],

    // Invalidación automática en cambios
    autoInvalidate: {
      enabled: true,
      onCreate: true,
      onUpdate: true,
      onDelete: true
    }
  },

  // Configuración de compresión
  compression: {
    enabled: true,
    threshold: 1024, // Comprimir valores > 1KB
    algorithm: 'gzip'
  },

  // Configuración de serialización
  serialization: {
    compressLargeValues: true,
    maxValueSize: 1024 * 1024, // 1MB máximo
    encoding: 'utf8'
  }
};

// Configuración de monitoreo
const monitoringConfig = {
  enabled: true,

  // Métricas a recolectar
  metrics: {
    cache: {
      hits: true,
      misses: true,
      hitRate: true,
      keysCount: true,
      memoryUsage: true
    },

    queues: {
      waitingJobs: true,
      activeJobs: true,
      completedJobs: true,
      failedJobs: true,
      throughput: true
    }
  },

  // Alertas
  alerts: {
    cache: {
      highMissRate: 0.8,    // Alertar si miss rate > 80%
      memoryThreshold: 0.9  // Alertar si memoria > 90%
    },

    queues: {
      highFailureRate: 0.1, // Alertar si failure rate > 10%
      longWaitingTime: 300  // Alertar si jobs esperan > 5 min
    }
  },

  // Logging
  logging: {
    level: 'info',
    slowQueries: 1000, // Log queries > 1 segundo
    errors: true,
    performance: true
  }
};

module.exports = {
  redis: redisConfig,
  bull: bullConfig,
  cache: cacheConfig,
  monitoring: monitoringConfig
};