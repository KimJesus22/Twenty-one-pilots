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