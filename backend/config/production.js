// Configuración de producción
module.exports = {
  // Configuración de base de datos
  database: {
    uri: process.env.MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Configuración del servidor
  server: {
    port: process.env.PORT || 5000,
    env: 'production',
    cors: {
      origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },

  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '7d',
    bcryptRounds: 12,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // límite de requests
    },
    authRateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5, // límite para auth
    }
  },

  // Configuración de APIs externas
  apis: {
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY,
      baseUrl: 'https://www.googleapis.com/youtube/v3'
    },
    eventbrite: {
      apiKey: process.env.EVENTBRITE_API_KEY,
      baseUrl: 'https://www.eventbriteapi.com/v3'
    }
  },

  // Configuración de logging
  logging: {
    level: 'info',
    format: 'json'
  }
};