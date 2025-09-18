const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Niveles de logging personalizados
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    silly: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    silly: 'gray'
  }
};

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      // Excluir campos internos de winston
      const cleanMeta = { ...meta };
      delete cleanMeta.timestamp;
      delete cleanMeta.level;
      delete cleanMeta.message;

      if (Object.keys(cleanMeta).length > 0) {
        log += ` | ${JSON.stringify(cleanMeta)}`;
      }
    }

    return log;
  })
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;

    if (Object.keys(meta).length > 0) {
      const cleanMeta = { ...meta };
      delete cleanMeta.timestamp;
      delete cleanMeta.level;
      delete cleanMeta.message;

      if (Object.keys(cleanMeta).length > 0) {
        log += ` | ${JSON.stringify(cleanMeta, null, 2)}`;
      }
    }

    return log;
  })
);

// Transportes para diferentes entornos
const createTransports = () => {
  const transports = [];

  // Siempre incluir consola
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // Archivo de errores (siempre)
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: customFormat,
      maxSize: '20m',
      maxFiles: '14d',
      handleExceptions: true,
      handleRejections: true
    })
  );

  // Archivo combinado (todos los logs)
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: customFormat,
      maxSize: '20m',
      maxFiles: '30d'
    })
  );

  // Archivo específico para HTTP requests
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: customFormat,
      maxSize: '20m',
      maxFiles: '7d'
    })
  );

  return transports;
};

// Crear logger principal
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: createTransports(),
  exitOnError: false
});

// Agregar colores a winston
winston.addColors(customLevels.colors);

// Logger específico para requests HTTP
const httpLogger = winston.createLogger({
  levels: customLevels.levels,
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'requests-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: customFormat,
      maxSize: '20m',
      maxFiles: '7d'
    })
  ]
});

// Logger para métricas de rendimiento
const performanceLogger = winston.createLogger({
  levels: customLevels.levels,
  level: 'info',
  format: customFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: customFormat,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Logger para auditoría (acciones de usuarios/admin)
const auditLogger = winston.createLogger({
  levels: customLevels.levels,
  level: 'info',
  format: customFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: customFormat,
      maxSize: '20m',
      maxFiles: '90d' // Mantener logs de auditoría por más tiempo
    })
  ]
});

// Función para loggear requests HTTP
const logRequest = (req, res, next) => {
  const start = Date.now();

  // Loggear request inicial
  httpLogger.http('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous'
  });

  // Loggear response cuando termine
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'http';

    httpLogger.log(level, 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.userId || 'anonymous'
    });
  });

  next();
};

// Función para loggear errores
const logError = (error, req = null, userId = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code
  };

  if (req) {
    errorData.url = req.url;
    errorData.method = req.method;
    errorData.ip = req.ip;
  }

  if (userId) {
    errorData.userId = userId;
  }

  logger.error('Application error', errorData);
};

// Función para loggear métricas de rendimiento
const logPerformance = (operation, duration, metadata = {}) => {
  performanceLogger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Función para loggear acciones de auditoría
const logAudit = (action, userId, details = {}) => {
  auditLogger.info(`Audit: ${action}`, {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Función para crear child loggers con contexto
const createChildLogger = (context) => {
  return logger.child(context);
};

module.exports = {
  logger,
  httpLogger,
  performanceLogger,
  auditLogger,
  logRequest,
  logError,
  logPerformance,
  logAudit,
  createChildLogger
};