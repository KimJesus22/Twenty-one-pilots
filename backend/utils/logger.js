const winston = require('winston');
const path = require('path');

// Definir niveles de log personalizados
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`;
    }

    // Agregar stack trace para errores
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    return log;
  })
);

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', 'logs');

// Configurar transportes
const transports = [
  // Log de errores en archivo separado
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Log general
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Log de HTTP requests
  new winston.transports.File({
    filename: path.join(logsDir, 'http.log'),
    level: 'http',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }),
];

// Agregar consola solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: customLevels.levels,
  format: customFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: customFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: customFormat,
    }),
  ],
});

// Agregar colores a winston
winston.addColors(customLevels.colors);

// Función helper para logs HTTP
logger.http = (message, meta = {}) => {
  logger.log('http', message, meta);
};

// Función helper para logs de requests
logger.request = (req, res, responseTime) => {
  const { method, url, ip } = req;
  const { statusCode } = res;

  logger.http(`${method} ${url}`, {
    ip,
    statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
  });
};

// Función helper para logs de errores con contexto
logger.errorWithContext = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};

// Función helper para logs de base de datos
logger.database = (operation, collection, data = {}) => {
  logger.info(`DB ${operation} on ${collection}`, data);
};

// Función helper para logs de APIs externas
logger.externalApi = (service, operation, success, data = {}) => {
  const level = success ? 'info' : 'error';
  const status = success ? 'SUCCESS' : 'FAILED';

  logger.log(level, `External API ${service} ${operation} ${status}`, data);
};

// Función para crear child loggers con contexto
logger.createChild = (context) => {
  return logger.child(context);
};

module.exports = logger;