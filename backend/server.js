
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressSanitizer = require('express-sanitizer');
const dotenv = require('dotenv');
const { validationResult } = require('express-validator');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const crypto = require('crypto');
const {
  sanitizeInput,
  validateMongoId,
  preventNoSQLInjection,
  advancedRateLimit,
  securityLogger
} = require('./middleware/security');
const {
  responseTimeMiddleware,
  connectionMiddleware,
  measureDatabaseQuery,
  recordError,
  getMetrics,
  getMetricsJSON,
  getHealthMetrics,
  startPeriodicMonitoring
} = require('./services/metricsService');
// TODO: Implementar Swagger
// const setupSwagger = require('./swagger');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Seguridad y Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Deshabilitar cabeceras que revelan información del servidor
  poweredBy: false,
  // Configurar CSP estricta
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  // Prevenir clickjacking
  frameguard: { action: 'deny' },
  // Prevenir MIME sniffing
  noSniff: true,
  // Configurar referrer policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // Configurar HSTS (solo en producción)
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 requests por ventana para auth
  message: 'Demasiados intentos de autenticación, por favor intenta más tarde.',
});

app.use('/api/auth/', authLimiter);

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

// Middleware adicional para reducir fingerprinting
app.use((req, res, next) => {
  // Remover cabeceras que revelan información del servidor
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  res.removeHeader('X-AspNet-Version');

  // Agregar cabeceras de seguridad adicionales
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Cabeceras para prevenir MIME sniffing y otros ataques
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
});

// Middleware de métricas y monitoreo
app.use(responseTimeMiddleware); // Medir tiempo de respuesta
app.use(connectionMiddleware); // Contar conexiones activas

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
// app.use(expressSanitizer()); // Temporalmente comentado para debugging
app.use(securityLogger); // Logging de seguridad
app.use(sanitizeInput); // Sanitización personalizada
// app.use(validateMongoId); // Solo en rutas específicas, no global
app.use(preventNoSQLInjection); // Prevención de inyección NoSQL

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
const videosRoutes = require('./routes/videos');
const concertsRoutes = require('./routes/concerts');

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Twenty One Pilots' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development',
    ssl: !!req.secure,
    protocol: req.protocol,
    host: req.get('host')
  };

  // Verificar conexión a MongoDB
  if (mongoose.connection.readyState === 1) {
    health.database = 'connected';
  } else {
    health.database = 'disconnected';
    health.status = 'unhealthy';
    res.status(503);
  }

  res.json(health);
});

// Métricas de Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    const metrics = await getMetrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Error obteniendo métricas:', error);
    res.status(500).send('# Error obteniendo métricas\n');
  }
});

// Métricas en formato JSON
app.get('/metrics/json', (req, res) => {
  res.json(getMetricsJSON());
});

// Endpoint detallado de métricas de salud
app.get('/health/detailed', (req, res) => {
  const healthMetrics = getHealthMetrics();
  const health = {
    ...healthMetrics,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy'
  };

  if (health.status === 'unhealthy') {
    res.status(503);
  }

  res.json(health);
});

// Usar rutas implementadas
app.use('/api/auth', authRoutes);
app.use('/api/discography', discographyRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/concerts', concertsRoutes);

// TODO: Implementar rutas faltantes
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/location', locationRoutes);
// app.use('/api/lyrics', lyricsRoutes);
// app.use('/api/concert-trivia', concertTriviaRoutes);
// app.use('/api/maps', mapsRoutes);
// app.use('/api/cache', cacheRoutes);
// app.use('/api/forum', forumRoutes);
// app.use('/api/playlists', playlistsRoutes);
// app.use('/api/store', storeRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/favorites', favoritesRoutes);

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
  // Registrar error en métricas
  recordError('unhandled_error', req.path, error);

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

// TODO: Configurar Swagger cuando se implemente
// setupSwagger(app);

// Configuración SSL/TLS
let sslOptions = null;
const isProduction = process.env.NODE_ENV === 'production';
const forceHttps = process.env.FORCE_HTTPS === 'true';

// Configurar SSL solo si estamos en producción o si se fuerza HTTPS
if (isProduction || forceHttps) {
  try {
    const sslKeyPath = path.resolve(process.env.SSL_KEY_PATH || './ssl/private.key');
    const sslCertPath = path.resolve(process.env.SSL_CERT_PATH || './ssl/certificate.crt');
    const sslCaBundlePath = path.resolve(process.env.SSL_CA_BUNDLE_PATH || './ssl/ca-bundle.crt');

    // Verificar que los archivos de certificado existen
    if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
      sslOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
        // Agregar CA bundle si existe
        ...(fs.existsSync(sslCaBundlePath) && {
          ca: fs.readFileSync(sslCaBundlePath)
        }),
        // Configuraciones de seguridad adicionales
        secureOptions: require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1,
        ciphers: [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-SHA256',
          'ECDHE-RSA-AES256-SHA384'
        ].join(':'),
        honorCipherOrder: true,
        requestCert: false,
        rejectUnauthorized: false
      };

      logger.info('✅ Configuración SSL/TLS cargada exitosamente');
    } else {
      logger.warn('⚠️  Archivos de certificado SSL no encontrados, ejecutando sin HTTPS');
      if (isProduction) {
        logger.error('❌ ERROR: En producción se requieren certificados SSL válidos');
        process.exit(1);
      }
    }
  } catch (error) {
    logger.error('❌ Error configurando SSL/TLS:', error.message);
    if (isProduction) {
      logger.error('❌ ERROR: No se puede iniciar en producción sin configuración SSL válida');
      process.exit(1);
    }
  }
}

// Puertos
const HTTP_PORT = parseInt(process.env.HTTP_PORT) || 80;
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT) || 443;
const DEV_PORT = parseInt(process.env.PORT) || 5000;

// Función para iniciar servidores
function startServers() {
  // Servidor HTTP (solo para redirección a HTTPS en producción)
  if (isProduction && sslOptions && forceHttps) {
    const httpApp = express();

    // Middleware mínimo para redirección
    httpApp.use((req, res) => {
      const host = req.headers.host?.split(':')[0] || 'localhost';
      const httpsUrl = `https://${host}:${HTTPS_PORT}${req.url}`;
      logger.info(`🔄 Redirigiendo HTTP a HTTPS: ${req.url} → ${httpsUrl}`);
      res.redirect(301, httpsUrl);
    });

    const httpServer = http.createServer(httpApp);
    httpServer.listen(HTTP_PORT, () => {
      logger.info(`🌐 Servidor HTTP corriendo en puerto ${HTTP_PORT} (redirección a HTTPS)`);
    });

    // Manejar errores del servidor HTTP
    httpServer.on('error', (error) => {
      if (error.code === 'EACCES' && HTTP_PORT < 1024) {
        logger.error(`❌ Error: Puerto ${HTTP_PORT} requiere privilegios de administrador`);
        logger.info('💡 Sugerencia: Ejecuta con sudo o usa un puerto > 1024');
      } else {
        logger.error('❌ Error en servidor HTTP:', error.message);
      }
    });
  }

  // Servidor HTTPS o HTTP de desarrollo
  let server;
  let port;
  let protocol;

  if (sslOptions && (isProduction || forceHttps)) {
    // Servidor HTTPS
    server = https.createServer(sslOptions, app);
    port = HTTPS_PORT;
    protocol = 'HTTPS';

    server.listen(port, () => {
      logger.info(`🔒 Servidor ${protocol} corriendo en puerto ${port}`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        sslEnabled: true
      });
    });

    // Manejar errores del servidor HTTPS
    server.on('error', (error) => {
      if (error.code === 'EACCES' && port < 1024) {
        logger.error(`❌ Error: Puerto ${port} requiere privilegios de administrador`);
        logger.info('💡 Sugerencia: Ejecuta con sudo o usa un puerto > 1024');
      } else if (error.code === 'CERT_HAS_EXPIRED') {
        logger.error('❌ Error: El certificado SSL ha expirado');
      } else if (error.code === 'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA') {
        logger.error('❌ Error: Autoridad certificadora no reconocida');
      } else {
        logger.error(`❌ Error en servidor ${protocol}:`, error.message);
      }
    });

  } else {
    // Servidor HTTP de desarrollo
    server = http.createServer(app);
    port = DEV_PORT;
    protocol = 'HTTP';

    server.listen(port, () => {
      logger.info(`🌐 Servidor ${protocol} corriendo en puerto ${port}`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        sslEnabled: false
      });
    });

    // Manejar errores del servidor HTTP de desarrollo
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Error: Puerto ${port} ya está en uso`);
        logger.info(`💡 Sugerencia: Mata el proceso usando el puerto ${port} o cambia el puerto`);
      } else {
        logger.error(`❌ Error en servidor ${protocol}:`, error.message);
      }
    });
  }

  // Graceful shutdown para ambos servidores
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} recibido, cerrando servidor gracefully`);

    if (server) {
      server.close(() => {
        logger.info('✅ Servidor cerrado exitosamente');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('❌ Timeout en graceful shutdown, forzando cierre');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Iniciar servidores
startServers();

// Iniciar monitoreo periódico de métricas
startPeriodicMonitoring();
logger.info('📊 Sistema de métricas y monitoreo iniciado');

// Manejo global de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada', {
    reason: reason?.message || reason,
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});