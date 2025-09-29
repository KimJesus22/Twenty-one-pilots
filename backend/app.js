const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressSanitizer = require('express-sanitizer');
const dotenv = require('dotenv');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Intentar cargar logger
let logger;
try {
  logger = require('./utils/logger');
  console.log('Logger loaded successfully');
} catch (error) {
  console.error('Error loading logger:', error.message);
  logger = console; // Fallback a console
}

// Importar Apollo Server para GraphQL
console.log('Loading GraphQL...');
const { ApolloServer } = require('@apollo/server');
console.log('ApolloServer loaded');

console.log('Loading expressMiddleware...');
let expressMiddleware;
try {
  expressMiddleware = require('@apollo/server/express4').expressMiddleware;
  console.log('expressMiddleware loaded');
} catch (error) {
  console.error('Error loading expressMiddleware:', error.message);
  console.error('Stack:', error.stack);
  expressMiddleware = null;
}

// Intentar cargar GraphQL types
let typeDefs;
try {
  console.log('🔍 Attempting to load GraphQL types...');
  typeDefs = require('./graphql/types');
  console.log('✅ typeDefs loaded successfully, type:', typeof typeDefs);
} catch (error) {
  console.error('❌ Error loading GraphQL types:', error.message);
  console.error('Stack trace:', error.stack);
  typeDefs = null;
}

// Intentar cargar GraphQL resolvers
let resolvers;
try {
  console.log('🔍 Attempting to load GraphQL resolvers...');
  resolvers = require('./graphql/resolvers');
  console.log('✅ resolvers loaded successfully, type:', typeof resolvers);
} catch (error) {
  console.error('❌ Error loading GraphQL resolvers:', error.message);
  console.error('Stack trace:', error.stack);
  resolvers = null;
}

// Importar configuración de Swagger
console.log('Loading Swagger...');
const setupSwagger = require('./swagger');
console.log('setupSwagger loaded');

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
  skip: (req) => req.path === '/health' || req.path === '/api/health',
  // Configuración para headers proxy
  trustProxy: true
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

// CORS habilitado para desarrollo
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
      console.warn('Origen no permitido detectado:', { origin, ip: origin });
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

// Rutas
console.log('Loading routes...');
const authRoutes = require('./routes/auth');
console.log('authRoutes loaded');
const videosRoutes = require('./routes/videoRoutes');
console.log('videosRoutes loaded');
const concertsRoutes = require('./routes/concerts');
console.log('concertsRoutes loaded');
const spotifyRoutes = require('./routes/spotify');
console.log('spotifyRoutes loaded');
const discographyRoutes = require('./routes/discography');
console.log('discographyRoutes loaded');
const forumRoutes = require('./routes/forum');
console.log('forumRoutes loaded');
const playlistsRoutes = require('./routes/playlists');
console.log('playlistsRoutes loaded');
const storeRoutes = require('./routes/store');
console.log('storeRoutes loaded');
const eventsRoutes = require('./routes/events');
console.log('eventsRoutes loaded');
const adminRoutes = require('./routes/admin');
console.log('adminRoutes loaded');
const monitoringRoutes = require('./routes/monitoring');
console.log('monitoringRoutes loaded');
const favoritesRoutes = require('./routes/favorites');
console.log('favoritesRoutes loaded');
const notificationsRoutes = require('./routes/notifications');
console.log('notificationsRoutes loaded');
const lyricsRoutes = require('./routes/lyrics');
console.log('lyricsRoutes loaded');
const mapsRoutes = require('./routes/maps');
console.log('mapsRoutes loaded');
const musicRatingsRoutes = require('./routes/musicRatings');
console.log('musicRatingsRoutes loaded');
const musicCommentsRoutes = require('./routes/musicComments');
console.log('musicCommentsRoutes loaded');
const albumMetricsRoutes = require('./routes/albumMetrics');
console.log('albumMetricsRoutes loaded');
const wishlistRoutes = require('./routes/wishlist');
console.log('wishlistRoutes loaded');
const ticketsRoutes = require('./routes/tickets');
console.log('ticketsRoutes loaded');
console.log('All routes loaded');

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

// Health check endpoint simplificado
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development',
    message: 'API funcionando correctamente'
  });
});

// Health check endpoint para API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development',
    message: 'API funcionando correctamente'
  });
});

// Configurar GraphQL ANTES de las rutas REST
console.log('🔧 Configurando GraphQL...');

// Crear Apollo Server de manera síncrona
(async () => {
  try {
    console.log('🚀 Iniciando Apollo Server...');

    if (!typeDefs || !resolvers || !expressMiddleware) {
      console.log('⚠️ GraphQL no disponible: faltan dependencias');
      console.log('  - typeDefs is null:', typeDefs === null);
      console.log('  - resolvers is null:', resolvers === null);
      console.log('  - expressMiddleware is null:', expressMiddleware === null);
      return;
    }

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
      formatError: (error) => {
        logger.error('GraphQL Error:', error);
        return {
          message: error.message,
          locations: error.locations,
          path: error.path,
          extensions: {
            code: error.extensions?.code || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stacktrace: error.stack })
          }
        };
      }
    });

    await server.start();
    console.log('✅ Apollo Server iniciado exitosamente');

    // Registrar rutas GraphQL directamente
    app.post('/graphql', cors(), express.json(), async (req, res) => {
      console.log('📨 GraphQL POST request received');
      try {
        const { query, variables, operationName } = req.body;

        const token = req.headers.authorization?.replace('Bearer ', '');
        let user = null;
        if (token) {
          try {
            user = null; // Para desarrollo
          } catch (error) {
            logger.warn('Error verificando token JWT:', error.message);
          }
        }

        const result = await server.executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: 'POST',
            body: { query, variables, operationName },
            headers: req.headers,
            search: req.url.split('?')[1] || ''
          },
          contextValue: { user, req }
        });

        res.status(result.status || 200);
        res.setHeader('Content-Type', 'application/json');

        if (result.body.kind === 'complete') {
          res.send(JSON.stringify(result.body.singleResult));
        } else {
          res.send(JSON.stringify(result.body.initialResult));
        }
      } catch (error) {
        console.error('❌ Error procesando GraphQL request:', error);
        res.status(500).json({
          errors: [{ message: 'Internal server error' }]
        });
      }
    });

    app.get('/graphql', cors(), async (req, res) => {
      console.log('📨 GraphQL GET request received');
      try {
        const result = await server.executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: 'GET',
            search: req.url.split('?')[1] || '',
            headers: req.headers
          },
          contextValue: { user: null, req }
        });

        res.status(result.status || 200);
        res.setHeader('Content-Type', 'application/json');

        if (result.body.kind === 'complete') {
          res.send(JSON.stringify(result.body.singleResult));
        } else {
          res.send(JSON.stringify(result.body.initialResult));
        }
      } catch (error) {
        console.error('❌ Error procesando GraphQL GET request:', error);
        res.status(500).json({
          errors: [{ message: 'Internal server error' }]
        });
      }
    });

    console.log('✅ GraphQL configurado exitosamente en /graphql');

  } catch (error) {
    logger.error('Error configurando GraphQL:', error);
    console.error('❌ Error configurando GraphQL:', error.message);
    console.error('Stack:', error.stack);
  }
})();

// Ruta de prueba para verificar que las rutas se registran
app.post('/test', (req, res) => {
  console.log('📨 Test route hit');
  res.json({ success: true, message: 'Test route works' });
});
console.log('✅ Ruta de test registrada');

// Usar rutas
app.use('/api/auth', authRoutes);

// Endpoint público para login (sin prefijo /api/auth) - debe ir después de las rutas montadas
app.post('/login', async (req, res) => {
  try {
    // Reenviar la solicitud al controlador de auth
    const authController = require('./controllers/authController');
    // Crear un nuevo request object con la URL correcta
    const originalUrl = req.url;
    req.url = '/login';
    const result = await authController.login(req, res);
    req.url = originalUrl; // Restaurar la URL original
    return result;
  } catch (error) {
    console.error('Error en /login:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});
app.use('/api/discography', discographyRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/concerts', concertsRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/music-ratings', musicRatingsRoutes);
app.use('/api/music-comments', musicCommentsRoutes);
app.use('/api/albums', albumMetricsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/admin', adminRoutes);

// Configurar Apollo Server para GraphQL
async function startApolloServer() {
  console.log('🚀 Iniciando startApolloServer...');
  console.log('🔍 Verificando dependencias GraphQL...');
  console.log('typeDefs:', typeDefs ? 'cargado' : 'null');
  console.log('resolvers:', resolvers ? 'cargado' : 'null');
  console.log('expressMiddleware:', expressMiddleware ? 'cargado' : 'null');

  if (!typeDefs || !resolvers || !expressMiddleware) {
    console.log('⚠️ GraphQL no disponible: faltan dependencias');
    console.log('  - typeDefs is null:', typeDefs === null);
    console.log('  - resolvers is null:', resolvers === null);
    console.log('  - expressMiddleware is null:', expressMiddleware === null);
    return;
  }

  console.log('Creando ApolloServer...');

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Habilitar introspection para desarrollo
    formatError: (error) => {
      logger.error('GraphQL Error:', error);
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_ERROR',
          ...(process.env.NODE_ENV === 'development' && { stacktrace: error.stack })
        }
      };
    }
  });

  await server.start();

  console.log('🔧 Configurando ruta /graphql...');

  try {
    // Configuración alternativa: usar ruta POST directa
    app.post('/graphql', cors(), express.json(), async (req, res) => {
      console.log('📨 GraphQL POST request received');

      try {
        const { query, variables, operationName } = req.body;

        // Extraer token de autenticación del header
        const token = req.headers.authorization?.replace('Bearer ', '');
        let user = null;

        if (token) {
          try {
            // Aquí iría la lógica de verificación del token JWT
            // Por ahora, devolver null para desarrollo
            user = null;
          } catch (error) {
            logger.warn('Error verificando token JWT:', error.message);
          }
        }

        // Ejecutar la consulta GraphQL
        const result = await server.executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: 'POST',
            body: { query, variables, operationName },
            headers: req.headers,
            search: req.url.split('?')[1] || ''
          },
          contextValue: { user, req }
        });

        // Enviar respuesta
        res.status(result.status || 200);
        res.setHeader('Content-Type', 'application/json');

        if (result.body.kind === 'complete') {
          res.send(JSON.stringify(result.body.singleResult));
        } else {
          // Para streaming, por ahora solo enviamos el primer resultado
          res.send(JSON.stringify(result.body.initialResult));
        }

      } catch (error) {
        console.error('❌ Error procesando GraphQL request:', error);
        res.status(500).json({
          errors: [{ message: 'Internal server error' }]
        });
      }
    });

    // También soporta GET para queries simples
    app.get('/graphql', cors(), async (req, res) => {
      console.log('📨 GraphQL GET request received');

      try {
        const { query, variables, operationName } = req.query;

        // Extraer token de autenticación del header
        const token = req.headers.authorization?.replace('Bearer ', '');
        let user = null;

        if (token) {
          try {
            user = null; // Para desarrollo
          } catch (error) {
            logger.warn('Error verificando token JWT:', error.message);
          }
        }

        const result = await server.executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: 'GET',
            search: req.url.split('?')[1] || '',
            headers: req.headers
          },
          contextValue: { user, req }
        });

        res.status(result.status || 200);
        res.setHeader('Content-Type', 'application/json');

        if (result.body.kind === 'complete') {
          res.send(JSON.stringify(result.body.singleResult));
        } else {
          res.send(JSON.stringify(result.body.initialResult));
        }

      } catch (error) {
        console.error('❌ Error procesando GraphQL GET request:', error);
        res.status(500).json({
          errors: [{ message: 'Internal server error' }]
        });
      }
    });

    console.log('✅ Ruta /graphql configurada exitosamente (método alternativo)');
  } catch (error) {
    console.error('❌ Error configurando ruta /graphql:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('🚀 GraphQL server listo en /graphql');
}

// Apollo Server ya se inició antes de las rutas REST

// Configurar Swagger
setupSwagger(app);

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