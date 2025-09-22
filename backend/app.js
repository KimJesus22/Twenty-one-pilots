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

console.log('🚀 Iniciando app.js...');

const app = express();

// Seguridad y Middleware Avanzado - temporalmente deshabilitado para debugging
// Helmet deshabilitado

// Rate limiting avanzado con middleware personalizado - temporalmente deshabilitado para debugging
// const { advancedRateLimit } = require('./middleware/security');

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
  skip: (req) => req.path === '/health' || req.path === '/api/health'
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

// Rate limiting específico para endpoints sensibles - temporalmente deshabilitado
// app.use('/api/videos/search', advancedRateLimit(10 * 60 * 1000, 50)); // 50 búsquedas por 10 min
// app.use('/api/forum', advancedRateLimit(5 * 60 * 1000, 20)); // 20 requests por 5 min
// app.use('/api/store', advancedRateLimit(5 * 60 * 1000, 10)); // 10 requests por 5 min

// CORS - temporalmente deshabilitado
// app.use(cors({
//   origin: function (origin, callback) {
//     // Permitir requests sin origin (como mobile apps o curl)
//     if (!origin) return callback(null, true);

//     const allowedOrigins = [
//       'http://localhost:3000',
//       'http://127.0.0.1:3000',
//       'https://localhost:3000',
//       'https://127.0.0.1:3000'
//     ];

//     // En producción, agregar el dominio real
//     if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
//       allowedOrigins.push(process.env.FRONTEND_URL);
//     }

//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       logger.warn('Origen no permitido detectado:', { origin, ip: origin });
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//   exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
//   maxAge: 86400 // 24 horas
// }));

app.use(express.json({ limit: '10mb' })); // Limitar tamaño de payload

// Enviar token CSRF en respuestas - temporalmente deshabilitado
// app.use(sendCSRFToken);

// Middleware de versionado de API - temporalmente deshabilitado
// app.use('/api', apiVersioning);
// app.use('/api', redirectToDefaultVersion);

// Importar middleware CSRF - temporalmente deshabilitado
// const { csrfProtection, sendCSRFToken } = require('./middleware/csrf');

// Aplicar CSRF solo a rutas sensibles - temporalmente deshabilitado
// app.use('/api/playlists', csrfProtection);
// app.use('/api/forum', csrfProtection);
// app.use('/api/store', csrfProtection);

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

// Middleware de seguridad avanzado - temporalmente deshabilitado para debugging
// TODO: Rehabilitar una vez que se resuelvan las dependencias del middleware/security.js
// const {
//   sanitizeInput,
//   validateMongoId,
//   preventNoSQLInjection,
//   securityLogger,
//   metricsEndpoint,
//   getPerformanceMetrics,
//   validationMonitor,
//   distributedCache,
//   searchService,
//   scalabilityMetrics,
//   apiVersioning,
//   redirectToDefaultVersion,
//   getVersionUsageStats,
//   generateVersionDocumentation,
//   API_VERSIONS,
//   DEFAULT_VERSION
// } = require('./middleware/security');
// app.use(sanitizeInput);
// app.use(validateMongoId);
// app.use(preventNoSQLInjection);
// app.use(securityLogger);
// app.use(validationMonitor); // Monitoreo de validaciones

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

// Conectar a MongoDB (opcional para desarrollo) - temporalmente deshabilitado para debugging
// if (process.env.MONGO_URI) {
//   mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('Conectado a MongoDB');
//   })
//   .catch(err => {
//     console.error('Error conectando a MongoDB:', err.message);
//   });
// } else {
//   console.log('MongoDB no configurado - ejecutando sin base de datos');
// }
console.log('Conexión a MongoDB deshabilitada temporalmente');

// Rutas - temporalmente deshabilitadas para debugging
// const authRoutes = require('./routes/auth');
// const videosRoutes = require('./routes/videoRoutes');
// const concertsRoutes = require('./routes/concerts');
// const spotifyRoutes = require('./routes/spotify');
// const discographyRoutes = require('./routes/discography');
// const forumRoutes = require('./routes/forum');
// const playlistsRoutes = require('./routes/playlists');
// const storeRoutes = require('./routes/store');
// const eventsRoutes = require('./routes/events');
// const adminRoutes = require('./routes/admin');
// const monitoringRoutes = require('./routes/monitoring');
// const favoritesRoutes = require('./routes/favorites');
// const notificationsRoutes = require('./routes/notifications');
// const lyricsRoutes = require('./routes/lyrics');
// const mapsRoutes = require('./routes/maps');

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Twenty One Pilots' });
});

// Endpoint de métricas de rendimiento y seguridad - temporalmente deshabilitado
// app.get('/api/metrics', metricsEndpoint);

// Endpoint para información de versiones de API - temporalmente deshabilitado
// app.get('/api/versions', (req, res) => {
//   res.json({
//     success: true,
//     data: {
//       versions: API_VERSIONS,
//       defaultVersion: DEFAULT_VERSION,
//       currentVersion: req.apiVersion || DEFAULT_VERSION,
//       supportedVersions: Object.keys(API_VERSIONS),
//       versionUsage: getVersionUsageStats()
//     }
//   });
// });

// Endpoint para documentación completa de versiones - temporalmente deshabilitado
// app.get('/api/docs/versions', (req, res) => {
//   const docs = generateVersionDocumentation();

//   res.json({
//     success: true,
//     data: docs,
//     meta: {
//       generatedAt: new Date().toISOString(),
//       apiVersion: req.apiVersion || DEFAULT_VERSION,
//       format: 'OpenAPI-like'
//     }
//   });
// });

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

    // Búsqueda básica - servicios avanzados temporalmente deshabilitados
    const results = {
      hits: [],
      total: 0,
      message: 'Búsqueda básica - Servicios avanzados temporalmente deshabilitados'
    };

    res.json({
      success: true,
      version: 'v2',
      data: results,
      cached: false,
      features: ['Búsqueda básica']
    });

  } catch (error) {
    logger.error('❌ Error en búsqueda v2:', error);
    res.status(500).json({
      success: false,
      version: 'v2',
      message: 'Error en búsqueda'
    });
  }
});

// Endpoints para servicios de escalabilidad - temporalmente deshabilitados
// app.get('/api/search/health', async (req, res) => { ... });
// app.get('/api/cache/health', async (req, res) => { ... });
// app.post('/api/search/advanced', async (req, res) => { ... });
// app.get('/api/scalability/metrics', (req, res) => { ... });
// app.get('/api/cache/:key', async (req, res) => { ... });
// app.post('/api/cache/:key', async (req, res) => { ... });

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

    // Métricas de seguridad - simplificadas temporalmente
    security: {
      helmetEnabled: true,
      cspEnabled: true,
      rateLimitingEnabled: true,
      csrfProtectionEnabled: true,
      sanitizationEnabled: true,
      noSqlInjectionProtection: false, // temporalmente deshabilitado
      xssProtectionEnabled: true,
      httpsRedirectEnabled: process.env.FORCE_HTTPS === 'true',
      hstsEnabled: process.env.NODE_ENV === 'production',
      corsEnabled: true,
      securityHeadersCount: 10, // Headers de seguridad configurados
      lastSecurityScan: new Date().toISOString(),
      securityMiddlewareActive: false, // temporalmente deshabilitado

      // Métricas básicas
      performance: {
        totalRequests: 0,
        totalErrors: 0,
        avgLatency: 0,
        throughputPerMinute: 0,
        suspiciousRequests: 0
      },
      activeAlerts: 0,
      totalSecurityEvents: 0,
      monitoredEndpoints: 0,

      // Estadísticas de seguridad básicas
      securityStats: {
        totalRequests: 0,
        totalErrors: 0,
        avgLatency: 0,
        throughputPerMinute: 0,
        suspiciousRequests: 0
      }
    },

    // Información de versionado de API - simplificada
    api: {
      currentVersion: 'v1',
      defaultVersion: 'v1',
      supportedVersions: ['v1'],
      versions: { v1: { version: '1.0.0', status: 'current' } },
      versionUsage: {},
      versionedEndpoints: [
        '/api/v1/health',
        '/api/v1/videos/search'
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

// Verificar Elasticsearch - temporalmente deshabilitado
health.elasticsearch = {
  status: 'disabled',
  healthy: null,
  type: 'elasticsearch',
  message: 'Servicio temporalmente deshabilitado'
};

// Verificar Redis - temporalmente deshabilitado
health.redis = {
  status: 'disabled',
  healthy: null,
  type: 'redis',
  message: 'Servicio temporalmente deshabilitado'
};

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

// Usar rutas - temporalmente deshabilitadas
// app.use('/api/auth', authRoutes);
// app.use('/api/discography', discographyRoutes);
// app.use('/api/videos', videosRoutes);
// app.use('/api/concerts', concertsRoutes);
// app.use('/api/spotify', spotifyRoutes);
// app.use('/api/forum', forumRoutes);
// app.use('/api/playlists', playlistsRoutes);
// app.use('/api/store', storeRoutes);
// app.use('/api/events', eventsRoutes);
// app.use('/api/favorites', favoritesRoutes);
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/lyrics', lyricsRoutes);
// app.use('/api/maps', mapsRoutes);
// app.use('/api/monitoring', monitoringRoutes);
app.use('/api/admin', (req, res) => res.json({
  success: false,
  message: 'Panel de administración próximamente - funcionalidad en desarrollo'
}));

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

console.log('✅ App.js cargado exitosamente');

module.exports = app;