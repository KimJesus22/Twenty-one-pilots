const winston = require('winston');
const path = require('path');

// Configurar niveles de log personalizados
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(customColors);

// Configurar formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;

    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Configurar transporte para consola
const consoleTransport = new winston.transports.Console({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  )
});

// Configurar transporte para archivos
const errorTransport = new winston.transports.File({
  filename: path.join(__dirname, '../logs/error.log'),
  level: 'error',
  format: logFormat
});

const combinedTransport = new winston.transports.File({
  filename: path.join(__dirname, '../logs/combined.log'),
  format: logFormat
});

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: customLevels,
  format: logFormat,
  transports: [
    consoleTransport,
    errorTransport,
    combinedTransport
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/rejections.log')
    })
  ]
});

// Agregar método para logging HTTP requests
logger.http = (message, meta = {}) => {
  logger.log('http', message, meta);
};

// Método para logging de requests con timing
logger.request = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const ip = req.ip || req.connection.remoteAddress;

    logger.http(`${method} ${url} - ${status} - ${duration}ms`, {
      method,
      url,
      status,
      duration,
      ip,
      userAgent: req.get('User-Agent')
    });
  });

  next();
};

// Método para logging de seguridad
logger.security = (message, meta = {}) => {
  logger.warn(`🔒 ${message}`, {
    ...meta,
    category: 'security'
  });
};

// Método para logging de API calls
logger.api = (message, meta = {}) => {
  logger.info(`🔗 ${message}`, {
    ...meta,
    category: 'api'
  });
};

// Método para logging de base de datos
logger.database = (message, meta = {}) => {
  logger.info(`🗄️ ${message}`, {
    ...meta,
    category: 'database'
  });
};

module.exports = logger;