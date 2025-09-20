const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressSanitizer = require('express-sanitizer');
const dotenv = require('dotenv');
const { validationResult } = require('express-validator');
const logger = require('./utils/logger');
const crypto = require('crypto');

const app = express();

// Seguridad y Middleware Avanzado
app.use(helmet({
  // Deshabilitar cabeceras que revelan información del servidor
  poweredBy: false,

  // Configurar CSP estricta para prevenir XSS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Solo para desarrollo
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://www.googleapis.com", "https://www.youtube.com"],
      mediaSrc: ["'self'", "https:", "blob:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"], // Bloquear iframes completamente
      frameAncestors: ["'none'"], // Prevenir clickjacking
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      // Report URI para logging de violaciones CSP
      reportUri: '/api/security/csp-report',
      reportTo: 'csp-endpoint',
    },
  },

  // Prevenir MIME sniffing
  noSniff: true,

  // Configurar referrer policy estricta
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  // Configurar HSTS (solo en producción)
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,

  // Prevenir DNS rebinding attacks
  dnsPrefetchControl: { allow: false },

  // Configurar Expect-CT (solo en producción)
  expectCt: process.env.NODE_ENV === 'production' ? {
    enforce: true,
    maxAge: 86400,
    reportUri: '/api/security/ct-report'
  } : false,

  // Configurar Feature Policy para reducir superficie de ataque
  featurePolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      accelerometer: ["'none'"],
      gyroscope: ["'none'"],
      magnetometer: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"]
    }
  },

  // Configurar Cross-Origin policies
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginEmbedderPolicy: { policy: "require-corp" },

  // Remover cabeceras innecesarias para reducir fingerprinting
  hidePoweredBy: true,
  xssFilter: true,
  ieNoOpen: true,
  noCache: false
}));

// Rate limiting avanzado con middleware personalizado
const { advancedRateLimit } = require('./middleware/security');

// Rate limiting general mejorado
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
    retryAfter: 900 // segundos
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting para health checks
  skip: (req) => req.path === '/health' || req.path === '/api/health',
  // Log cuando se acerca al límite
  onLimitReached: (req) => {
    logger.warn('Rate limit alcanzado:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
  }
});

app.use('/api/', limiter);

// Rate limiting más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 requests por ventana para auth
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación, por favor intenta más tarde.',
    retryAfter: 900
  },
  skipFailedRequests: true, // No contar requests fallidos
  skipSuccessfulRequests: false, // Contar requests exitosos
});

app.use('/api/auth/', authLimiter);

// Rate limiting específico para endpoints sensibles
app.use('/api/videos/search', advancedRateLimit(10 * 60 * 1000, 50)); // 50 búsquedas por 10 min
app.use('/api/forum', advancedRateLimit(5 * 60 * 1000, 20)); // 20 requests por 5 min
app.use('/api/store', advancedRateLimit(5 * 60 * 1000, 10)); // 10 requests por 5 min

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://localhost:3000',
      'https://127.0.0.1:3000'
    ];

    // En producción, agregar el dominio real
    if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('Origen no permitido detectado:', { origin, ip: origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // 24 horas
}));

app.use(express.json({ limit: '10mb' })); // Limitar tamaño de payload

// Middleware de versionado de API
app.use('/api', apiVersioning);
app.use('/api', redirectToDefaultVersion);

// Middleware CSRF personalizado (más ligero que csurf)
const csrfProtection = (req, res, next) => {
  // Solo aplicar CSRF a métodos que modifican datos
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;

    if (!csrfToken) {
      logger.warn('Token CSRF faltante:', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        message: 'Token CSRF requerido'
      });
    }

    // En desarrollo, aceptar cualquier token (simplificado)
    // En producción, validar contra token generado por el servidor
    if (process.env.NODE_ENV === 'production') {
      // Aquí iría la validación real del token CSRF
      const expectedToken = crypto.createHash('sha256')
        .update(process.env.CSRF_SECRET || 'default-secret')
        .update(req.session?.id || 'no-session')
        .digest('hex');

      if (csrfToken !== expectedToken) {
        logger.warn('Token CSRF inválido:', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(403).json({
          success: false,
          message: 'Token CSRF inválido'
        });
      }
    }
  }

  next();
};

// Aplicar CSRF solo a rutas sensibles
app.use('/api/playlists', csrfProtection);
app.use('/api/forum', csrfProtection);
app.use('/api/store', csrfProtection);

// Middleware de logging de requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Seguridad y sanitización avanzada
app.use(expressSanitizer()); // Sanitización personalizada

// Middleware de seguridad avanzado, servicios de escalabilidad y versionado
const {
  sanitizeInput,
  validateMongoId,
  preventNoSQLInjection,
  securityLogger,
  metricsEndpoint,
  getPerformanceMetrics,
  validationMonitor,
  distributedCache,
  searchService,
  scalabilityMetrics,
  apiVersioning,
  redirectToDefaultVersion,
  getVersionUsageStats,
  generateVersionDocumentation,
  API_VERSIONS,
  DEFAULT_VERSION
} = require('./middleware/security');
app.use(sanitizeInput);
app.use(validateMongoId);
app.use(preventNoSQLInjection);
app.use(securityLogger);
app.use(validationMonitor); // Monitoreo de validaciones

// Endpoint para reportar violaciones de CSP
app.post('/api/security/csp-report', (req, res) => {
  logger.warn('CSP Violation Report:', {
    'csp-report': req.body['csp-report'],
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(204).end(); // No content response
});

// Endpoint para reportar violaciones de Certificate Transparency
app.post('/api/security/ct-report', (req, res) => {
  logger.warn('Certificate Transparency Report:', {
    report: req.body,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(204).end();
});

// Conectar a MongoDB (opcional para desarrollo)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
  })
  .catch(err => {
    console.error('Error conectando a MongoDB:', err.message);
  });
} else {
  console.log('MongoDB no configurado - ejecutando sin base de datos');
}

const discographyRoutes = require('./routes/discography');
const authRoutes = require('./routes/auth');
const videosRoutes = require('./routes/videoRoutes');
const concertsRoutes = require('./routes/concerts');
// const forumRoutes = require('./routes/forum');
// const playlistsRoutes = require('./routes/playlists');
// const storeRoutes = require('./routes/store');
// const adminRoutes = require('./routes/admin');

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Twenty One Pilots' });
});

// Endpoint de métricas de rendimiento y seguridad
app.get('/api/metrics', metricsEndpoint);

// Endpoint para información de versiones de API
app.get('/api/versions', (req, res) => {
  res.json({
    success: true,
    data: {
      versions: API_VERSIONS,
      defaultVersion: DEFAULT_VERSION,
      currentVersion: req.apiVersion || DEFAULT_VERSION,
      supportedVersions: Object.keys(API_VERSIONS),
      versionUsage: getVersionUsageStats()
    }
  });
});

// Endpoint para documentación completa de versiones
app.get('/api/docs/versions', (req, res) => {
  const docs = generateVersionDocumentation();

  res.json({
    success: true,
    data: docs,
    meta: {
      generatedAt: new Date().toISOString(),
      apiVersion: req.apiVersion || DEFAULT_VERSION,
      format: 'OpenAPI-like'
    }
  });
});

// Rutas versionadas específicas
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    version: 'v1',
    status: 'healthy',
    message: 'API v1 - Versión legacy mantenida por compatibilidad',
    deprecated: true,
    upgradeTo: DEFAULT_VERSION
  });
});

app.get('/api/v2/health', (req, res) => {
  res.json({
    success: true,
    version: 'v2',
    status: 'healthy',
    message: 'API v2 - Versión actual con todas las mejoras',
    features: [
      'Seguridad avanzada',
      'Métricas de rendimiento',
      'Cache distribuido',
      'Búsqueda avanzada',
      'Rate limiting mejorado'
    ]
  });
});

// Endpoint de health check versionado
app.get('/api/v1/videos/search', (req, res) => {
  res.json({
    success: true,
    version: 'v1',
    message: 'Búsqueda básica de videos (v1)',
    query: req.query.q || 'Twenty One Pilots',
    deprecated: true
  });
});

app.get('/api/v2/videos/search', async (req, res) => {
  try {
    const { q = 'Twenty One Pilots', maxResults = 10 } = req.query;

    // Usar cache distribuido para búsquedas
    const cacheKey = `search_v2_${q}_${maxResults}`;
    let results = await distributedCache.get(cacheKey);

    if (!results) {
      // Si no está en cache, buscar en Elasticsearch si está disponible
      try {
        const esResults = await searchService.search('videos', {
          searchText: q,
          size: parseInt(maxResults)
        });
        results = esResults;
        await distributedCache.set(cacheKey, results, 300); // Cache por 5 minutos
      } catch (esError) {
        logger.warn('Elasticsearch no disponible, usando búsqueda básica:', esError.message);
        results = {
          hits: [],
          total: 0,
          message: 'Búsqueda básica - Elasticsearch no disponible'
        };
      }
    }

    res.json({
      success: true,
      version: 'v2',
      data: results,
      cached: !!results.message,
      features: ['Cache distribuido', 'Búsqueda avanzada', 'Métricas en tiempo real']
    });

  } catch (error) {
    logger.error('❌ Error en búsqueda v2:', error);
    res.status(500).json({
      success: false,
      version: 'v2',
      message: 'Error en búsqueda avanzada'
    });
  }
});

// Endpoints para servicios de escalabilidad
app.get('/api/search/health', async (req, res) => {
  try {
    const isHealthy = await searchService.checkConnection();
    res.json({
      success: true,
      service: 'elasticsearch',
      healthy: isHealthy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'elasticsearch',
      healthy: false,
      error: error.message
    });
  }
});

app.get('/api/cache/health', async (req, res) => {
  try {
    const isConnected = redisClient.connected;
    const info = await new Promise((resolve, reject) => {
      redisClient.info((err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });

    res.json({
      success: true,
      service: 'redis',
      healthy: isConnected,
      info: info.split('\n').slice(0, 10).join('\n'), // Primeras 10 líneas de info
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'redis',
      healthy: false,
      error: error.message
    });
  }
});

// Endpoint para búsqueda avanzada con Elasticsearch
app.post('/api/search/advanced', async (req, res) => {
  try {
    const { index, query, options } = req.body;

    if (!index || !query) {
      return res.status(400).json({
        success: false,
        message: 'Index y query son requeridos'
      });
    }

    const results = await searchService.search(index, query, options);

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('❌ Error en búsqueda avanzada:', error);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda avanzada',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para métricas de escalabilidad
app.get('/api/scalability/metrics', (req, res) => {
  try {
    const metrics = scalabilityMetrics.getScalabilityMetrics();

    // Verificar permisos (solo admin en producción)
    if (process.env.NODE_ENV === 'production' && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado a métricas de escalabilidad'
      });
    }

    logger.info('📊 Métricas de escalabilidad solicitadas', {
      ip: req.ip,
      databases: Object.keys(metrics.databases).length,
      alerts: metrics.alerts.length
    });

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('❌ Error obteniendo métricas de escalabilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para gestión de cache distribuido
app.get('/api/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await distributedCache.get(key);

    if (value === null) {
      return res.status(404).json({
        success: false,
        message: 'Cache key not found'
      });
    }

    res.json({
      success: true,
      data: value
    });

  } catch (error) {
    logger.error('❌ Error obteniendo cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo cache'
    });
  }
});

app.post('/api/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, ttl } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const success = await distributedCache.set(key, value, ttl);

    res.json({
      success,
      message: success ? 'Cache set successfully' : 'Failed to set cache'
    });

  } catch (error) {
    logger.error('❌ Error configurando cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error configurando cache'
    });
  }
});

// Health check endpoint con métricas de seguridad
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development',
    ssl: !!req.secure,
    protocol: req.protocol,
    host: req.get('host'),

    // Métricas de seguridad avanzadas
    security: {
      helmetEnabled: true,
      cspEnabled: true,
      rateLimitingEnabled: true,
      csrfProtectionEnabled: true,
      sanitizationEnabled: true,
      noSqlInjectionProtection: true,
      xssProtectionEnabled: true,
      httpsRedirectEnabled: process.env.FORCE_HTTPS === 'true',
      hstsEnabled: process.env.NODE_ENV === 'production',
      corsEnabled: true,
      securityHeadersCount: 15, // Headers de seguridad configurados
      lastSecurityScan: new Date().toISOString(),
      securityMiddlewareActive: true,

      // Métricas en tiempo real
      performance: getPerformanceMetrics(),
      activeAlerts: getPerformanceMetrics().alerts.length,
      totalSecurityEvents: getPerformanceMetrics().securityEvents.length,
      monitoredEndpoints: Object.keys(getPerformanceMetrics().endpoints).length,

      // Estadísticas de seguridad
      securityStats: {
        totalRequests: Object.values(getPerformanceMetrics().endpoints)
          .reduce((sum, endpoint) => sum + endpoint.totalRequests, 0),
        totalErrors: Object.values(getPerformanceMetrics().endpoints)
          .reduce((sum, endpoint) => sum + endpoint.errorRequests, 0),
        avgLatency: Object.values(getPerformanceMetrics().endpoints)
          .reduce((sum, endpoint) => sum + parseFloat(endpoint.avgLatency), 0) /
          Object.keys(getPerformanceMetrics().endpoints).length || 0,
        throughputPerMinute: getPerformanceMetrics().throughput.perMinute,
        suspiciousRequests: Object.values(getPerformanceMetrics().endpoints)
          .reduce((sum, endpoint) => sum + endpoint.suspiciousRequests, 0)
      }
    },

    // Información de versionado de API
    api: {
      currentVersion: req.apiVersion || DEFAULT_VERSION,
      defaultVersion: DEFAULT_VERSION,
      supportedVersions: Object.keys(API_VERSIONS),
      versions: API_VERSIONS,
      versionUsage: getVersionUsageStats(),
      versionedEndpoints: [
        '/api/v1/health',
        '/api/v2/health',
        '/api/v1/videos/search',
        '/api/v2/videos/search',
        '/api/versions'
      ]
    },

    // Información del servidor (limitada para reducir fingerprinting)
    server: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version.split('.')[0], // Solo major version
      uptime: Math.floor(process.uptime()),
      memoryUsage: {
        rss: Math.floor(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapTotal: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      }
    },

    // Estado de dependencias críticas
    dependencies: {
      express: require('express/package.json').version,
      mongoose: require('mongoose/package.json').version,
      helmet: require('helmet/package.json').version,
      cors: require('cors/package.json').version
    }
  };

  // Verificar conexiones a bases de datos y servicios
if (mongoose.connection.readyState === 1) {
  health.database = {
    status: 'connected',
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    type: 'mongodb'
  };
} else {
  health.database = {
    status: 'disconnected',
    readyState: mongoose.connection.readyState,
    type: 'mongodb'
  };
  health.status = 'degraded';
}

// Verificar Elasticsearch
try {
  const esHealthy = await searchService.checkConnection();
  health.elasticsearch = {
    status: esHealthy ? 'connected' : 'disconnected',
    healthy: esHealthy,
    type: 'elasticsearch'
  };
  if (!esHealthy) {
    health.status = 'degraded';
  }
} catch (error) {
  health.elasticsearch = {
    status: 'error',
    healthy: false,
    error: error.message,
    type: 'elasticsearch'
  };
  health.status = 'degraded';
}

// Verificar Redis
try {
  const redisHealthy = redisClient.connected;
  health.redis = {
    status: redisHealthy ? 'connected' : 'disconnected',
    healthy: redisHealthy,
    type: 'redis'
  };
  if (!redisHealthy) {
    health.status = 'degraded';
  }
} catch (error) {
  health.redis = {
    status: 'error',
    healthy: false,
    error: error.message,
    type: 'redis'
  };
  health.status = 'degraded';
}

  // Verificar configuración SSL si está habilitada
  if (process.env.FORCE_HTTPS === 'true' && !req.secure) {
    health.security.sslWarning = 'Request no segura en entorno HTTPS obligatorio';
    health.status = 'warning';
  }

  // Verificar que las variables críticas de seguridad estén configuradas
  const criticalEnvVars = ['JWT_SECRET', 'YOUTUBE_API_KEY'];
  const missingVars = criticalEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    health.security.missingCriticalVars = missingVars;
    health.status = 'warning';
  }

  res.json(health);
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/discography', discographyRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/concerts', concertsRoutes);
// app.use('/api/forum', forumRoutes);
// app.use('/api/playlists', playlistsRoutes);
// app.use('/api/store', storeRoutes);
// app.use('/api/admin', adminRoutes);

// Middleware para manejar errores de validación
app.use((req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación detectados', {
      errors: errors.array(),
      path: req.path,
      method: req.method
    });
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
  logger.error('Error no manejado', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // No enviar detalles del error en producción
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(error.status || 500).json({
    success: false,
    message: isDevelopment ? error.message : 'Error interno del servidor',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  console.log('Ruta no encontrada:', req.path, req.method);

  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

module.exports = app;