const expressSanitizer = require('express-sanitizer');
const logger = require('../utils/logger');

// Configuración de versionado de API
const API_VERSIONS = {
  'v1': {
    version: '1.0.0',
    status: 'stable',
    deprecated: false,
    description: 'Versión inicial de la API'
  },
  'v2': {
    version: '2.0.0',
    status: 'current',
    deprecated: false,
    description: 'Versión actual con mejoras de seguridad y escalabilidad'
  }
};

const DEFAULT_VERSION = 'v2';
const SUPPORTED_VERSIONS = Object.keys(API_VERSIONS);

// Middleware para versionado de API
const apiVersioning = (req, res, next) => {
  // Detectar versión desde diferentes fuentes
  let requestedVersion = DEFAULT_VERSION;

  // 1. Header Accept-Version
  if (req.headers['accept-version']) {
    requestedVersion = req.headers['accept-version'];
  }

  // 2. Query parameter ?version=
  if (req.query.version) {
    requestedVersion = req.query.version;
  }

  // 3. Path parameter /api/v1/...
  const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    requestedVersion = pathMatch[1];
  }

  // Normalizar versión (quitar prefijo 'v' si existe)
  if (requestedVersion.startsWith('v')) {
    requestedVersion = requestedVersion;
  } else {
    requestedVersion = 'v' + requestedVersion;
  }

  // Validar versión
  if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
    logger.warn('❌ Versión de API no soportada:', {
      requestedVersion,
      supportedVersions: SUPPORTED_VERSIONS,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(400).json({
      success: false,
      message: `Versión de API no soportada: ${requestedVersion}`,
      supportedVersions: SUPPORTED_VERSIONS,
      defaultVersion: DEFAULT_VERSION
    });
  }

  // Verificar si la versión está deprecada
  const versionInfo = API_VERSIONS[requestedVersion];
  if (versionInfo.deprecated) {
    logger.warn('⚠️ Versión de API deprecada utilizada:', {
      version: requestedVersion,
      status: versionInfo.status,
      ip: req.ip
    });

    // Header de deprecation
    res.set('Deprecation', 'true');
    res.set('Link', `</api/${DEFAULT_VERSION}${req.path}>; rel="successor-version"`);
  }

  // Almacenar información de versión en request
  req.apiVersion = requestedVersion;
  req.apiVersionInfo = versionInfo;

  // Logging de uso de versiones
  logger.debug('📋 API Version utilizada:', {
    version: requestedVersion,
    status: versionInfo.status,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  next();
};

// Función para crear rutas versionadas
const createVersionedRoute = (version, path, handler) => {
  return {
    version,
    path: `/api/${version}${path}`,
    handler,
    fullPath: path
  };
};

// Función para redireccionar automáticamente a la versión por defecto
const redirectToDefaultVersion = (req, res, next) => {
  // Si la ruta no incluye versión, redirigir a la versión por defecto
  if (!req.path.match(/^\/api\/v\d+\//) && req.path.startsWith('/api/')) {
    const newPath = `/api/${DEFAULT_VERSION}${req.path.replace('/api/', '/')}`;

    logger.info('🔄 Redirigiendo a versión por defecto:', {
      from: req.path,
      to: newPath,
      ip: req.ip
    });

    return res.redirect(307, newPath); // 307 Temporary Redirect
  }

  next();
};

// Función para obtener estadísticas de uso por versión
const getVersionUsageStats = () => {
  // Esta función se implementaría con métricas reales
  // Por ahora, devolver estadísticas simuladas
  const stats = {};

  SUPPORTED_VERSIONS.forEach(version => {
    stats[version] = {
      requests: Math.floor(Math.random() * 1000),
      avgLatency: Math.floor(Math.random() * 500) + 100,
      errorRate: Math.random() * 0.05,
      lastUsed: new Date().toISOString()
    };
  });

  return stats;
};

// Función para generar documentación automática de versiones
const generateVersionDocumentation = () => {
  const docs = {
    title: 'API de Twenty One Pilots - Documentación de Versiones',
    description: 'Sistema de versionado de API para mantener compatibilidad hacia atrás',
    versions: {},
    migrationGuide: {},
    changelog: []
  };

  Object.entries(API_VERSIONS).forEach(([version, info]) => {
    docs.versions[version] = {
      ...info,
      endpoints: [
        `/api/${version}/health`,
        `/api/${version}/videos/search`,
        `/api/${version}/metrics`,
        `/api/${version}/scalability/metrics`
      ],
      features: version === 'v2' ? [
        'Seguridad avanzada con CSP estricta',
        'Rate limiting mejorado',
        'Cache distribuido con Redis',
        'Búsqueda avanzada con Elasticsearch',
        'Métricas de rendimiento en tiempo real',
        'Alertas automáticas de seguridad',
        'Validaciones de entrada robustas'
      ] : [
        'Funcionalidades básicas',
        'Seguridad estándar',
        'Compatibilidad legacy'
      ]
    };
  });

  docs.migrationGuide = {
    fromV1toV2: {
      breakingChanges: [
        'Rate limiting más estricto',
        'Validaciones más estrictas',
        'Headers de seguridad adicionales'
      ],
      newFeatures: [
        'Cache distribuido',
        'Búsqueda avanzada',
        'Métricas detalladas'
      ],
      migrationSteps: [
        'Actualizar headers de autenticación',
        'Revisar manejo de errores',
        'Implementar manejo de versiones en cliente'
      ]
    }
  };

  docs.changelog = [
    {
      version: 'v2.0.0',
      date: new Date().toISOString().split('T')[0],
      changes: [
        'Implementación de CSP estricta',
        'Rate limiting avanzado',
        'Cache distribuido con Redis',
        'Búsqueda con Elasticsearch',
        'Métricas de rendimiento',
        'Alertas de seguridad automáticas'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-01-01',
      changes: [
        'Versión inicial de la API',
        'Funcionalidades básicas',
        'Seguridad estándar'
      ]
    }
  ];

  return docs;
};

// Configuración de Elasticsearch para búsquedas avanzadas
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  },
  maxRetries: 5,
  requestTimeout: 60000,
  pingTimeout: 3000
});

// Configuración de Redis para cache distribuido
const redis = require('redis');
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('❌ Redis connection refused');
      return new Error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('❌ Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      logger.error('❌ Redis max retries reached');
      return new Error('Max retries reached');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

redisClient.on('connect', () => logger.info('🔗 Connected to Redis'));
redisClient.on('error', (err) => logger.error('❌ Redis error:', err));
redisClient.on('ready', () => logger.info('✅ Redis ready for operations'));

// Configuración de múltiples bases de datos
const databaseConfigs = {
  primary: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/twentyonepilots',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  analytics: {
    uri: process.env.ANALYTICS_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/twentyonepilots_analytics',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    }
  },
  cache: {
    uri: process.env.CACHE_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/twentyonepilots_cache',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 5000,
    }
  }
};

// Conexiones a múltiples bases de datos
const databaseConnections = new Map();

// Función para obtener conexión a base de datos específica
const getDatabaseConnection = (dbName = 'primary') => {
  if (!databaseConnections.has(dbName)) {
    const config = databaseConfigs[dbName];
    if (!config) {
      throw new Error(`Database configuration not found for: ${dbName}`);
    }

    const connection = mongoose.createConnection(config.uri, config.options);

    connection.on('connected', () => {
      logger.info(`📊 Connected to ${dbName} database`);
    });

    connection.on('error', (err) => {
      logger.error(`❌ Error connecting to ${dbName} database:`, err);
    });

    connection.on('disconnected', () => {
      logger.warn(`📊 Disconnected from ${dbName} database`);
    });

    databaseConnections.set(dbName, connection);
  }

  return databaseConnections.get(dbName);
};

// Servicio de métricas de escalabilidad
const scalabilityMetrics = {
  databaseConnections: {},
  cacheHitRate: 0,
  searchPerformance: {},
  throughputHistory: [],
  latencyHistory: [],

  // Actualizar métricas de base de datos
  updateDatabaseMetrics() {
    databaseConnections.forEach((connection, name) => {
      this.databaseConnections[name] = {
        readyState: connection.readyState,
        name: connection.name,
        host: connection.host,
        collections: Object.keys(connection.collections || {}).length,
        lastActivity: new Date().toISOString()
      };
    });
  },

  // Calcular hit rate de cache
  calculateCacheHitRate() {
    // Esta sería implementada con métricas reales de Redis
    // Por ahora, devolver un valor simulado
    return Math.random() * 0.3 + 0.7; // 70-100%
  },

  // Obtener métricas de escalabilidad
  getScalabilityMetrics() {
    this.updateDatabaseMetrics();

    return {
      timestamp: new Date().toISOString(),
      databases: this.databaseConnections,
      cache: {
        hitRate: this.calculateCacheHitRate(),
        redisConnected: redisClient.connected,
        elasticsearchHealthy: null // Se actualizará con checkConnection
      },
      performance: {
        averageLatency: this.latencyHistory.slice(-10).reduce((sum, lat) => sum + lat, 0) / Math.max(this.latencyHistory.slice(-10).length, 1),
        throughputPerMinute: this.throughputHistory.slice(-10).reduce((sum, tp) => sum + tp, 0) / Math.max(this.throughputHistory.slice(-10).length, 1),
        activeConnections: Object.keys(this.databaseConnections).length
      },
      alerts: this.checkScalabilityAlerts()
    };
  },

  // Verificar alertas de escalabilidad
  checkScalabilityAlerts() {
    const alerts = [];

    // Alerta de conexiones de base de datos
    Object.entries(this.databaseConnections).forEach(([name, db]) => {
      if (db.readyState !== 1) {
        alerts.push({
          type: 'DATABASE_DISCONNECTED',
          severity: 'critical',
          database: name,
          message: `Database ${name} is disconnected`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Alerta de cache hit rate baja
    if (this.cacheHitRate < 0.5) {
      alerts.push({
        type: 'LOW_CACHE_HIT_RATE',
        severity: 'warning',
        message: `Cache hit rate is low: ${(this.cacheHitRate * 100).toFixed(1)}%`,
        value: this.cacheHitRate,
        timestamp: new Date().toISOString()
      });
    }

    // Alerta de latencia alta
    const avgLatency = this.latencyHistory.slice(-5).reduce((sum, lat) => sum + lat, 0) / Math.max(this.latencyHistory.slice(-5).length, 1);
    if (avgLatency > 2000) { // 2 segundos
      alerts.push({
        type: 'HIGH_LATENCY',
        severity: 'warning',
        message: `Average latency is high: ${avgLatency.toFixed(0)}ms`,
        value: avgLatency,
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }
};

// Cache distribuido con Redis
const distributedCache = {
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('⚠️ Redis get error:', error.message);
      return null;
    }
  },

  async set(key, value, ttl = 300) { // 5 minutos por defecto
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn('⚠️ Redis set error:', error.message);
      return false;
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.warn('⚠️ Redis del error:', error.message);
      return false;
    }
  },

  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.warn('⚠️ Redis exists error:', error.message);
      return false;
    }
  }
};

// Servicio de búsqueda avanzada con Elasticsearch
const searchService = {
  // Verificar conexión con Elasticsearch
  async checkConnection() {
    try {
      const health = await esClient.cluster.health();
      logger.info('🔍 Elasticsearch health:', health.body);
      return health.body.status === 'green' || health.body.status === 'yellow';
    } catch (error) {
      logger.error('❌ Elasticsearch connection error:', error.message);
      return false;
    }
  },

  // Indexar documento
  async indexDocument(index, id, document) {
    try {
      const result = await esClient.index({
        index,
        id,
        body: {
          ...document,
          indexed_at: new Date().toISOString(),
          version: 1
        }
      });

      logger.debug('📝 Document indexed:', { index, id, result: result.body.result });
      return result.body;
    } catch (error) {
      logger.error('❌ Error indexing document:', error);
      throw error;
    }
  },

  // Buscar documentos
  async search(index, query, options = {}) {
    const startTime = Date.now();

    try {
      const searchQuery = {
        index,
        body: {
          query: {
            bool: {
              must: [
                query.term ? { term: query.term } : { match_all: {} }
              ],
              filter: []
            }
          },
          size: options.size || 20,
          from: options.from || 0,
          sort: options.sort || [{ _score: 'desc' }],
          highlight: {
            fields: {
              '*': {}
            }
          }
        }
      };

      // Agregar filtros adicionales
      if (query.filters) {
        Object.entries(query.filters).forEach(([field, value]) => {
          searchQuery.body.query.bool.filter.push({
            term: { [field]: value }
          });
        });
      }

      // Agregar búsqueda de texto completo
      if (query.searchText) {
        searchQuery.body.query.bool.must.push({
          multi_match: {
            query: query.searchText,
            fields: ['title^3', 'description^2', 'content', 'tags'],
            fuzziness: 'AUTO'
          }
        });
      }

      const result = await esClient.search(searchQuery);

      const duration = Date.now() - startTime;
      logger.info('🔍 Search completed:', {
        index,
        hits: result.body.hits.total.value,
        duration: `${duration}ms`,
        query: query.searchText || 'match_all'
      });

      return {
        hits: result.body.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          source: hit._source,
          highlight: hit.highlight
        })),
        total: result.body.hits.total.value,
        max_score: result.body.hits.max_score,
        took: result.body.took,
        duration
      };

    } catch (error) {
      logger.error('❌ Search error:', error);
      throw error;
    }
  },

  // Actualizar documento
  async updateDocument(index, id, updates) {
    try {
      const result = await esClient.update({
        index,
        id,
        body: {
          doc: {
            ...updates,
            updated_at: new Date().toISOString()
          }
        }
      });

      logger.debug('📝 Document updated:', { index, id });
      return result.body;
    } catch (error) {
      logger.error('❌ Error updating document:', error);
      throw error;
    }
  },

  // Eliminar documento
  async deleteDocument(index, id) {
    try {
      const result = await esClient.delete({
        index,
        id
      });

      logger.debug('🗑️ Document deleted:', { index, id });
      return result.body;
    } catch (error) {
      logger.error('❌ Error deleting document:', error);
      throw error;
    }
  },

  // Crear índice con mappings
  async createIndex(index, mappings = {}) {
    try {
      const exists = await esClient.indices.exists({ index });

      if (!exists.body) {
        const result = await esClient.indices.create({
          index,
          body: {
            mappings: {
              properties: {
                title: { type: 'text', analyzer: 'standard' },
                description: { type: 'text', analyzer: 'standard' },
                content: { type: 'text', analyzer: 'standard' },
                tags: { type: 'keyword' },
                category: { type: 'keyword' },
                author: { type: 'keyword' },
                published_at: { type: 'date' },
                created_at: { type: 'date' },
                updated_at: { type: 'date' },
                indexed_at: { type: 'date' },
                version: { type: 'integer' },
                ...mappings
              }
            },
            settings: {
              number_of_shards: 3,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  custom_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'porter_stem']
                  }
                }
              }
            }
          }
        });

        logger.info('📊 Index created:', { index, result: result.body.acknowledged });
        return result.body;
      } else {
        logger.debug('📊 Index already exists:', index);
        return { acknowledged: true, existed: true };
      }
    } catch (error) {
      logger.error('❌ Error creating index:', error);
      throw error;
    }
  }
};

// Métricas de rendimiento y seguridad
const performanceMetrics = {
  requests: new Map(),
  errors: new Map(),
  latency: new Map(),
  throughput: {
    total: 0,
    perMinute: 0,
    perHour: 0,
    lastReset: Date.now()
  },
  alerts: [],
  securityEvents: []
};

// Configuración de alertas
const ALERT_THRESHOLDS = {
  LATENCY_HIGH: 5000, // 5 segundos
  ERROR_RATE_HIGH: 0.1, // 10% de errores
  REQUESTS_PER_MINUTE_HIGH: 1000,
  SUSPICIOUS_REQUESTS_HIGH: 10
};

// Función para calcular throughput
function updateThroughput() {
  const now = Date.now();
  const timeDiff = now - performanceMetrics.throughput.lastReset;

  if (timeDiff >= 60000) { // Cada minuto
    performanceMetrics.throughput.perMinute = performanceMetrics.throughput.total;
    performanceMetrics.throughput.total = 0;
    performanceMetrics.throughput.lastReset = now;
  }

  if (timeDiff >= 3600000) { // Cada hora
    performanceMetrics.throughput.perHour = performanceMetrics.throughput.perMinute * 60;
  }
}

// Función para verificar y generar alertas
function checkAndGenerateAlerts(endpoint, metrics) {
  const alerts = [];

  // Alerta de latencia alta
  if (metrics.avgLatency > ALERT_THRESHOLDS.LATENCY_HIGH) {
    alerts.push({
      type: 'LATENCY_HIGH',
      severity: 'warning',
      endpoint,
      message: `Latencia alta detectada: ${metrics.avgLatency}ms`,
      value: metrics.avgLatency,
      threshold: ALERT_THRESHOLDS.LATENCY_HIGH,
      timestamp: new Date().toISOString()
    });
  }

  // Alerta de tasa de error alta
  if (metrics.errorRate > ALERT_THRESHOLDS.ERROR_RATE_HIGH) {
    alerts.push({
      type: 'ERROR_RATE_HIGH',
      severity: 'error',
      endpoint,
      message: `Tasa de error alta: ${(metrics.errorRate * 100).toFixed(2)}%`,
      value: metrics.errorRate,
      threshold: ALERT_THRESHOLDS.ERROR_RATE_HIGH,
      timestamp: new Date().toISOString()
    });
  }

  // Alerta de requests por minuto alta
  if (metrics.requestsPerMinute > ALERT_THRESHOLDS.REQUESTS_PER_MINUTE_HIGH) {
    alerts.push({
      type: 'HIGH_TRAFFIC',
      severity: 'warning',
      endpoint,
      message: `Tráfico alto: ${metrics.requestsPerMinute} req/min`,
      value: metrics.requestsPerMinute,
      threshold: ALERT_THRESHOLDS.REQUESTS_PER_MINUTE_HIGH,
      timestamp: new Date().toISOString()
    });
  }

  // Alerta de requests sospechosos
  if (metrics.suspiciousRequests > ALERT_THRESHOLDS.SUSPICIOUS_REQUESTS_HIGH) {
    alerts.push({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'critical',
      endpoint,
      message: `Actividad sospechosa detectada: ${metrics.suspiciousRequests} requests`,
      value: metrics.suspiciousRequests,
      threshold: ALERT_THRESHOLDS.SUSPICIOUS_REQUESTS_HIGH,
      timestamp: new Date().toISOString()
    });
  }

  if (alerts.length > 0) {
    performanceMetrics.alerts.push(...alerts);
    // Mantener solo las últimas 100 alertas
    if (performanceMetrics.alerts.length > 100) {
      performanceMetrics.alerts = performanceMetrics.alerts.slice(-100);
    }

    // Log de alertas críticas
    alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        logger.error('🚨 ALERTA DE SEGURIDAD CRÍTICA', alert);
      } else {
        logger.warn('⚠️ ALERTA DE SEGURIDAD', alert);
      }
    });
  }

  return alerts;
}

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
  // Verificar que obj sea un objeto válido
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return;
  }

  for (let key in obj) {
    if (obj.hasOwnProperty && obj.hasOwnProperty(key)) {
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
    // Verificar que obj sea un objeto válido
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return false;
    }

    for (let key in obj) {
      if (obj.hasOwnProperty && obj.hasOwnProperty(key)) {
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
 * Middleware avanzado para logging de seguridad y métricas de rendimiento
 */
const securityLogger = (req, res, next) => {
  const start = Date.now();
  const endpoint = `${req.method} ${req.path}`;
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Incrementar contador de throughput
  performanceMetrics.throughput.total++;
  updateThroughput();

  // Inicializar métricas del endpoint si no existen
  if (!performanceMetrics.requests.has(endpoint)) {
    performanceMetrics.requests.set(endpoint, {
      total: 0,
      successful: 0,
      errors: 0,
      avgLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      lastRequests: [],
      suspiciousRequests: 0,
      requestsPerMinute: 0,
      errorRate: 0
    });
  }

  const endpointMetrics = performanceMetrics.requests.get(endpoint);
  endpointMetrics.total++;

  // Detectar requests sospechosos
  let isSuspicious = false;
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /\\+/,  // Backslashes
    /<script/i, // XSS attempts
    /javascript:/i, // JavaScript URLs
    /on\w+\s*=/i, // Event handlers
    /eval\(/i, // Eval usage
    /union.*select/i, // SQL injection
    /--/i, // SQL comments
    /\/etc\/passwd/i, // File inclusion
    /phpinfo/i, // PHP info disclosure
  ];

  const requestString = `${req.path} ${JSON.stringify(req.query)} ${JSON.stringify(req.body || {})}`;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      isSuspicious = true;
      endpointMetrics.suspiciousRequests++;
      performanceMetrics.securityEvents.push({
        type: 'SUSPICIOUS_REQUEST',
        endpoint,
        pattern: pattern.toString(),
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString(),
        requestData: {
          path: req.path,
          query: req.query,
          method: req.method
        }
      });
      break;
    }
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;

    // Actualizar métricas de latencia
    endpointMetrics.lastRequests.push(duration);
    if (endpointMetrics.lastRequests.length > 100) {
      endpointMetrics.lastRequests.shift(); // Mantener solo las últimas 100
    }

    // Calcular estadísticas de latencia
    if (duration < endpointMetrics.minLatency) endpointMetrics.minLatency = duration;
    if (duration > endpointMetrics.maxLatency) endpointMetrics.maxLatency = duration;

    const totalLatency = endpointMetrics.lastRequests.reduce((sum, lat) => sum + lat, 0);
    endpointMetrics.avgLatency = totalLatency / endpointMetrics.lastRequests.length;

    // Actualizar contadores de éxito/error
    if (isError) {
      endpointMetrics.errors++;
    } else {
      endpointMetrics.successful++;
    }

    // Calcular tasa de error
    endpointMetrics.errorRate = endpointMetrics.errors / endpointMetrics.total;

    // Calcular requests por minuto (estimación)
    const timeWindow = 60 * 1000; // 1 minuto
    const recentRequests = endpointMetrics.lastRequests.filter((_, index) => {
      const requestTime = start - (endpointMetrics.lastRequests.length - 1 - index) * 1000;
      return (Date.now() - requestTime) < timeWindow;
    });
    endpointMetrics.requestsPerMinute = recentRequests.length;

    // Verificar alertas
    const alerts = checkAndGenerateAlerts(endpoint, endpointMetrics);

    // Logging condicional basado en severidad
    if (isSuspicious) {
      logger.warn('🚨 REQUEST SOSPECHOSO DETECTADO:', {
        endpoint,
        ip: clientIP,
        userAgent,
        duration: `${duration}ms`,
        statusCode,
        requestData: {
          path: req.path,
          query: req.query,
          method: req.method
        }
      });
    } else if (isError) {
      logger.error('❌ REQUEST CON ERROR:', {
        endpoint,
        ip: clientIP,
        duration: `${duration}ms`,
        statusCode,
        errorRate: `${(endpointMetrics.errorRate * 100).toFixed(2)}%`
      });
    } else if (duration > ALERT_THRESHOLDS.LATENCY_HIGH) {
      logger.warn('🐌 REQUEST LENTO DETECTADO:', {
        endpoint,
        ip: clientIP,
        duration: `${duration}ms`,
        statusCode,
        avgLatency: `${endpointMetrics.avgLatency.toFixed(2)}ms`
      });
    } else if (endpointMetrics.requestsPerMinute > ALERT_THRESHOLDS.REQUESTS_PER_MINUTE_HIGH) {
      logger.info('📈 ALTO TRÁFICO DETECTADO:', {
        endpoint,
        requestsPerMinute: endpointMetrics.requestsPerMinute,
        ip: clientIP
      });
    }

    // Log de métricas cada 100 requests por endpoint
    if (endpointMetrics.total % 100 === 0) {
      logger.info('📊 MÉTRICAS DE RENDIMIENTO:', {
        endpoint,
        totalRequests: endpointMetrics.total,
        successRate: `${((endpointMetrics.successful / endpointMetrics.total) * 100).toFixed(2)}%`,
        avgLatency: `${endpointMetrics.avgLatency.toFixed(2)}ms`,
        minLatency: `${endpointMetrics.minLatency}ms`,
        maxLatency: `${endpointMetrics.maxLatency}ms`,
        requestsPerMinute: endpointMetrics.requestsPerMinute,
        suspiciousRequests: endpointMetrics.suspiciousRequests,
        activeAlerts: alerts.length
      });
    }
  });

  next();
};

/**
 * Función para obtener métricas de rendimiento
 */
const getPerformanceMetrics = () => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    throughput: { ...performanceMetrics.throughput },
    endpoints: {},
    alerts: performanceMetrics.alerts.slice(-10), // Últimas 10 alertas
    securityEvents: performanceMetrics.securityEvents.slice(-20), // Últimos 20 eventos
    system: {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    }
  };

  // Agregar métricas por endpoint
  for (const [endpoint, data] of performanceMetrics.requests.entries()) {
    metrics.endpoints[endpoint] = {
      totalRequests: data.total,
      successfulRequests: data.successful,
      errorRequests: data.errors,
      successRate: data.total > 0 ? (data.successful / data.total * 100).toFixed(2) + '%' : '0%',
      errorRate: data.total > 0 ? (data.errors / data.total * 100).toFixed(2) + '%' : '0%',
      avgLatency: data.avgLatency.toFixed(2) + 'ms',
      minLatency: data.minLatency === Infinity ? 'N/A' : data.minLatency + 'ms',
      maxLatency: data.maxLatency + 'ms',
      requestsPerMinute: data.requestsPerMinute,
      suspiciousRequests: data.suspiciousRequests,
      lastActivity: new Date().toISOString()
    };
  }

  return metrics;
};

/**
 * Función para limpiar métricas antiguas (llamada periódicamente)
 */
const cleanupMetrics = () => {
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 horas

  // Limpiar eventos de seguridad antiguos
  performanceMetrics.securityEvents = performanceMetrics.securityEvents.filter(
    event => new Date(event.timestamp).getTime() > cutoffTime
  );

  // Limpiar alertas antiguas (mantener solo últimas 50)
  if (performanceMetrics.alerts.length > 50) {
    performanceMetrics.alerts = performanceMetrics.alerts.slice(-50);
  }

  logger.debug('🧹 Métricas de seguridad limpiadas', {
    securityEventsKept: performanceMetrics.securityEvents.length,
    alertsKept: performanceMetrics.alerts.length
  });
};

// Limpiar métricas cada hora
setInterval(cleanupMetrics, 60 * 60 * 1000);

/**
 * Middleware para integrar monitoreo con validaciones de express-validator
 */
const validationMonitor = (req, res, next) => {
  const originalJson = res.json;
  const startTime = Date.now();

  res.json = function(data) {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.originalUrl.split('?')[0]}`;

    // Monitorear respuestas de validación
    if (data && typeof data === 'object') {
      if (data.errors && Array.isArray(data.errors)) {
        // Es una respuesta de error de validación
        const validationErrors = data.errors;
        const errorTypes = validationErrors.map(err => err.msg || 'Unknown validation error');

        logger.warn('❌ ERRORES DE VALIDACIÓN DETECTADOS:', {
          endpoint,
          ip: req.ip,
          validationErrors: errorTypes.length,
          errorTypes: [...new Set(errorTypes)], // Tipos únicos de error
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent')
        });

        // Actualizar métricas de validación
        if (!performanceMetrics.requests.has(endpoint)) {
          performanceMetrics.requests.set(endpoint, {
            validationErrors: 0,
            validationErrorTypes: new Map()
          });
        }

        const endpointMetrics = performanceMetrics.requests.get(endpoint);
        endpointMetrics.validationErrors = (endpointMetrics.validationErrors || 0) + validationErrors.length;

        // Contar tipos de error
        errorTypes.forEach(errorType => {
          const count = endpointMetrics.validationErrorTypes.get(errorType) || 0;
          endpointMetrics.validationErrorTypes.set(errorType, count + 1);
        });

        // Generar alerta si hay muchos errores de validación
        if (endpointMetrics.validationErrors > 10) {
          performanceMetrics.alerts.push({
            type: 'VALIDATION_ERRORS_HIGH',
            severity: 'warning',
            endpoint,
            message: `Altos errores de validación: ${endpointMetrics.validationErrors}`,
            value: endpointMetrics.validationErrors,
            timestamp: new Date().toISOString()
          });
        }
      } else if (data.success === false) {
        // Es una respuesta de error general
        logger.debug('⚠️ RESPUESTA DE ERROR:', {
          endpoint,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip
        });
      }
    }

    // Llamar al método original
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware para exponer métricas vía endpoint
 */
const metricsEndpoint = (req, res) => {
  try {
    const metrics = getPerformanceMetrics();

    // Verificar permisos (solo admin en producción)
    if (process.env.NODE_ENV === 'production' && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado a métricas'
      });
    }

    logger.info('📊 Métricas de rendimiento solicitadas', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpointsCount: Object.keys(metrics.endpoints).length,
      alertsCount: metrics.alerts.length
    });

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('❌ Error obteniendo métricas', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  sanitizeInput,
  validateMongoId,
  preventNoSQLInjection,
  advancedRateLimit,
  securityLogger,
  validationMonitor,
  getPerformanceMetrics,
  metricsEndpoint,
  cleanupMetrics,
  // Servicios de escalabilidad
  distributedCache,
  searchService,
  esClient,
  redisClient,
  getDatabaseConnection,
  scalabilityMetrics,
  databaseConfigs,
  // Versionado de API
  apiVersioning,
  createVersionedRoute,
  redirectToDefaultVersion,
  getVersionUsageStats,
  generateVersionDocumentation,
  API_VERSIONS,
  DEFAULT_VERSION,
  SUPPORTED_VERSIONS
};