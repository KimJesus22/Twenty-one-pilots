const promClient = require('prom-client');
const responseTime = require('response-time');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configurar registro de métricas por defecto
promClient.collectDefaultMetrics();

// Crear registro de métricas
const register = new promClient.Registry();

// Métricas personalizadas
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

const errorRate = new promClient.Counter({
  name: 'error_rate_total',
  help: 'Total number of errors by type',
  labelNames: ['type', 'endpoint']
});

const memoryUsage = new promClient.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

const cpuUsage = new promClient.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage'
});

// Métricas específicas de la aplicación Twenty One Pilots
const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations'
});

const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of active users in the last 24 hours'
});

const videoViews = new promClient.Counter({
  name: 'video_views_total',
  help: 'Total number of video views',
  labelNames: ['video_id', 'video_title']
});

const albumPlays = new promClient.Counter({
  name: 'album_plays_total',
  help: 'Total number of album plays',
  labelNames: ['album_id', 'album_title']
});

const searchQueries = new promClient.Counter({
  name: 'search_queries_total',
  help: 'Total number of search queries',
  labelNames: ['type', 'query_length']
});

const apiCallsByEndpoint = new promClient.Counter({
  name: 'api_calls_by_endpoint_total',
  help: 'Total API calls by endpoint',
  labelNames: ['endpoint', 'method', 'status']
});

const cacheHitRatio = new promClient.Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio (0-1)',
  labelNames: ['cache_type']
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

const queueSize = new promClient.Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name']
});

const e2eTestResults = new promClient.Counter({
  name: 'e2e_test_results_total',
  help: 'E2E test results',
  labelNames: ['test_name', 'status', 'duration']
});

const e2eTestDuration = new promClient.Histogram({
  name: 'e2e_test_duration_seconds',
  help: 'Duration of E2E tests',
  labelNames: ['test_name'],
  buckets: [1, 5, 10, 30, 60, 120, 300]
});

// Registrar métricas
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(errorRate);
register.registerMetric(memoryUsage);
register.registerMetric(cpuUsage);

// Registrar métricas específicas de la aplicación
register.registerMetric(userRegistrations);
register.registerMetric(activeUsers);
register.registerMetric(videoViews);
register.registerMetric(albumPlays);
register.registerMetric(searchQueries);
register.registerMetric(apiCallsByEndpoint);
register.registerMetric(cacheHitRatio);
register.registerMetric(databaseConnections);
register.registerMetric(queueSize);
register.registerMetric(e2eTestResults);
register.registerMetric(e2eTestDuration);

// Configuración de alertas
const alertThresholds = {
  latency: {
    warning: 500, // ms
    critical: 2000 // ms
  },
  errorRate: {
    warning: 0.05, // 5%
    critical: 0.10 // 10%
  },
  memoryUsage: {
    warning: 0.8, // 80%
    critical: 0.9 // 90%
  }
};

// Estado de alertas para evitar spam
const alertStates = {
  latency: { warning: false, critical: false },
  errorRate: { warning: false, critical: false },
  memoryUsage: { warning: false, critical: false }
};

// Configurar transporte de email para alertas
let emailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Función para enviar alertas
async function sendAlert(subject, message, level = 'warning') {
  logger.warn(`🚨 ALERTA ${level.toUpperCase()}: ${subject}`, { message });

  // Enviar email si está configurado
  if (emailTransporter && process.env.ALERT_EMAIL) {
    try {
      await emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL,
        subject: `[${level.toUpperCase()}] ${subject}`,
        html: `
          <h2>Alerta del Sistema</h2>
          <p><strong>Nivel:</strong> ${level}</p>
          <p><strong>Hora:</strong> ${new Date().toISOString()}</p>
          <p><strong>Mensaje:</strong></p>
          <pre>${message}</pre>
          <hr>
          <p>Esta es una alerta automática del sistema Twenty One Pilots API.</p>
        `
      });
      logger.info('📧 Alerta enviada por email');
    } catch (error) {
      logger.error('❌ Error enviando alerta por email:', error);
    }
  }

  // Aquí se podría integrar con Slack u otros servicios
  if (process.env.SLACK_WEBHOOK_URL) {
    // Implementar integración con Slack
    logger.info('📱 Alerta enviada a Slack (no implementado aún)');
  }
}

// Middleware para medir tiempo de respuesta
const responseTimeMiddleware = responseTime((req, res, time) => {
  const route = req.route ? req.route.path : req.path;
  const method = req.method;
  const statusCode = res.statusCode;

  // Registrar métricas
  httpRequestDuration
    .labels(method, route, statusCode.toString())
    .observe(time / 1000); // Convertir a segundos

  httpRequestsTotal
    .labels(method, route, statusCode.toString())
    .inc();

  // Verificar umbrales de latencia
  if (time > alertThresholds.latency.critical && !alertStates.latency.critical) {
    alertStates.latency.critical = true;
    sendAlert(
      'Latencia Crítica Detectada',
      `Endpoint ${method} ${route} excedió ${alertThresholds.latency.critical}ms (${time.toFixed(2)}ms)`,
      'critical'
    );
  } else if (time > alertThresholds.latency.warning && time <= alertThresholds.latency.critical) {
    if (!alertStates.latency.warning) {
      alertStates.latency.warning = true;
      sendAlert(
        'Latencia Alta Detectada',
        `Endpoint ${method} ${route} excedió ${alertThresholds.latency.warning}ms (${time.toFixed(2)}ms)`,
        'warning'
      );
    }
  } else {
    // Reset alert states when back to normal
    alertStates.latency.warning = false;
    alertStates.latency.critical = false;
  }

  // Log detallado para debugging
  logger.http(`${method} ${route}`, {
    statusCode,
    responseTime: `${time.toFixed(2)}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 100)
  });
});

// Middleware para monitorear conexiones activas
const connectionMiddleware = (req, res, next) => {
  activeConnections.inc();
  res.on('finish', () => {
    activeConnections.dec();
  });
  next();
};

// Función para medir uso de memoria
function updateMemoryMetrics() {
  const memUsage = process.memoryUsage();

  memoryUsage.labels('rss').set(memUsage.rss);
  memoryUsage.labels('heap_used').set(memUsage.heapUsed);
  memoryUsage.labels('heap_total').set(memUsage.heapTotal);
  memoryUsage.labels('external').set(memUsage.external);

  // Calcular porcentaje de uso de heap
  const heapUsagePercent = memUsage.heapUsed / memUsage.heapTotal;

  if (heapUsagePercent > alertThresholds.memoryUsage.critical && !alertStates.memoryUsage.critical) {
    alertStates.memoryUsage.critical = true;
    sendAlert(
      'Uso de Memoria Crítico',
      `Uso de heap: ${(heapUsagePercent * 100).toFixed(2)}% (${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB de ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB)`,
      'critical'
    );
  } else if (heapUsagePercent > alertThresholds.memoryUsage.warning && heapUsagePercent <= alertThresholds.memoryUsage.critical) {
    if (!alertStates.memoryUsage.warning) {
      alertStates.memoryUsage.warning = true;
      sendAlert(
        'Uso de Memoria Alto',
        `Uso de heap: ${(heapUsagePercent * 100).toFixed(2)}% (${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB de ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB)`,
        'warning'
      );
    }
  } else {
    alertStates.memoryUsage.warning = false;
    alertStates.memoryUsage.critical = false;
  }
}

// Función para medir uso de CPU
function updateCpuMetrics() {
  // Nota: En Node.js, medir CPU usage preciso requiere cálculos más complejos
  // Esta es una implementación simplificada
  const startUsage = process.cpuUsage();

  setTimeout(() => {
    const endUsage = process.cpuUsage(startUsage);
    const totalUsage = (endUsage.user + endUsage.system) / 1000000; // Convertir a segundos
    const usagePercent = (totalUsage / 1) * 100; // Simplificado

    cpuUsage.set(Math.min(usagePercent, 100));
  }, 100);
}

// Función para medir queries de base de datos
function measureDatabaseQuery(operation, collection, queryFunction) {
  const startTime = process.hrtime.bigint();

  return queryFunction().finally(() => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000000; // Convertir a segundos

    databaseQueryDuration
      .labels(operation, collection)
      .observe(duration);
  });
}

// Función para registrar errores
function recordError(type, endpoint, error) {
  errorRate.labels(type, endpoint).inc();

  // Calcular tasa de error (simplificado - en producción usar ventana deslizante)
  const errorCount = errorRate.get()?.values?.[0]?.value || 0;
  const totalRequests = httpRequestsTotal.get()?.values?.reduce((sum, v) => sum + v.value, 0) || 1;
  const errorRateValue = errorCount / totalRequests;

  if (errorRateValue > alertThresholds.errorRate.critical && !alertStates.errorRate.critical) {
    alertStates.errorRate.critical = true;
    sendAlert(
      'Tasa de Error Crítica',
      `Tasa de error: ${(errorRateValue * 100).toFixed(2)}% en ${endpoint}`,
      'critical'
    );
  } else if (errorRateValue > alertThresholds.errorRate.warning && errorRateValue <= alertThresholds.errorRate.critical) {
    if (!alertStates.errorRate.warning) {
      alertStates.errorRate.warning = true;
      sendAlert(
        'Tasa de Error Alta',
        `Tasa de error: ${(errorRateValue * 100).toFixed(2)}% en ${endpoint}`,
        'warning'
      );
    }
  } else {
    alertStates.errorRate.warning = false;
    alertStates.errorRate.critical = false;
  }
}

// Funciones para actualizar métricas específicas de la aplicación
function recordUserRegistration() {
  userRegistrations.inc();
}

function updateActiveUsers(count) {
  activeUsers.set(count);
}

function recordVideoView(videoId, videoTitle) {
  videoViews.labels(videoId, videoTitle).inc();
}

function recordAlbumPlay(albumId, albumTitle) {
  albumPlays.labels(albumId, albumTitle).inc();
}

function recordSearchQuery(type, queryLength) {
  searchQueries.labels(type, queryLength.toString()).inc();
}

function recordApiCall(endpoint, method, status) {
  apiCallsByEndpoint.labels(endpoint, method, status.toString()).inc();
}

function updateCacheHitRatio(cacheType, ratio) {
  cacheHitRatio.labels(cacheType).set(ratio);
}

function updateDatabaseConnections(count) {
  databaseConnections.set(count);
}

function updateQueueSize(queueName, size) {
  queueSize.labels(queueName).set(size);
}

function recordE2eTestResult(testName, status, duration) {
  e2eTestResults.labels(testName, status, duration.toString()).inc();
  e2eTestDuration.labels(testName).observe(duration);
}

// Función mejorada para enviar alertas con Slack
async function sendSlackAlert(subject, message, level = 'warning') {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  const colors = {
    info: '#36a64f',
    warning: '#ffcc00',
    critical: '#ff0000'
  };

  const payload = {
    attachments: [{
      color: colors[level] || colors.warning,
      title: subject,
      text: message,
      fields: [{
        title: 'Timestamp',
        value: new Date().toISOString(),
        short: true
      }, {
        title: 'Environment',
        value: process.env.NODE_ENV || 'development',
        short: true
      }],
      footer: 'Twenty One Pilots API Monitor',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      logger.info('📱 Alerta enviada a Slack');
    } else {
      logger.error('❌ Error enviando alerta a Slack:', response.status);
    }
  } catch (error) {
    logger.error('❌ Error enviando alerta a Slack:', error);
  }
}

// Actualizar función sendAlert para incluir Slack
async function sendAlert(subject, message, level = 'warning') {
  logger.warn(`🚨 ALERTA ${level.toUpperCase()}: ${subject}`, { message });

  // Enviar a Slack
  await sendSlackAlert(subject, message, level);

  // Enviar email si está configurado
  if (emailTransporter && process.env.ALERT_EMAIL) {
    try {
      await emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL,
        subject: `[${level.toUpperCase()}] ${subject}`,
        html: `
          <h2>Alerta del Sistema</h2>
          <p><strong>Nivel:</strong> ${level}</p>
          <p><strong>Hora:</strong> ${new Date().toISOString()}</p>
          <p><strong>Mensaje:</strong></p>
          <pre>${message}</pre>
          <hr>
          <p>Esta es una alerta automática del sistema Twenty One Pilots API.</p>
        `
      });
      logger.info('📧 Alerta enviada por email');
    } catch (error) {
      logger.error('❌ Error enviando alerta por email:', error);
    }
  }
}

// Función para obtener métricas en formato Prometheus
async function getMetrics() {
  try {
    // Forzar recolección de métricas por defecto
    promClient.collectDefaultMetrics({ register });

    // Obtener métricas del registro (puede ser una promesa en versiones nuevas)
    const metrics = await register.metrics();
    console.log('📊 Métricas generadas:', typeof metrics, metrics ? 'con datos' : 'vacío');

    // Asegurar que sea una cadena
    if (typeof metrics === 'string') {
      return metrics;
    } else {
      return '# Métricas no disponibles\n';
    }
  } catch (error) {
    console.error('❌ Error obteniendo métricas:', error);
    return '# Error obteniendo métricas\n';
  }
}

// Función para obtener métricas en formato JSON
function getMetricsJSON() {
  return register.getMetricsAsJSON();
}

// Función para obtener métricas de salud del sistema
function getHealthMetrics() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    timestamp: new Date().toISOString(),
    uptime: uptime,
    memory: {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)
    },
    cpu: process.cpuUsage(),
    activeConnections: activeConnections.get()?.values?.[0]?.value || 0,
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
}

// Iniciar monitoreo periódico
function startPeriodicMonitoring() {
  // Actualizar métricas cada 60 segundos (menos frecuente para evitar memory leaks)
  setInterval(() => {
    try {
      updateMemoryMetrics();
      updateCpuMetrics();
    } catch (error) {
      logger.error('Error actualizando métricas:', error);
    }
  }, 60000);

  // Log de métricas cada 10 minutos (menos frecuente)
  setInterval(() => {
    try {
      const health = getHealthMetrics();
      logger.info('📊 Métricas del sistema', {
        uptime: `${(health.uptime / 3600).toFixed(2)}h`,
        memoryUsage: `${health.memory.heapUsagePercent}%`,
        activeConnections: health.activeConnections
      });
    } catch (error) {
      logger.error('Error obteniendo métricas de salud:', error);
    }
  }, 600000); // 10 minutos
}

module.exports = {
  responseTimeMiddleware,
  connectionMiddleware,
  measureDatabaseQuery,
  recordError,
  getMetrics,
  getMetricsJSON,
  getHealthMetrics,
  startPeriodicMonitoring,
  register,
  // Nuevas funciones para métricas específicas
  recordUserRegistration,
  updateActiveUsers,
  recordVideoView,
  recordAlbumPlay,
  recordSearchQuery,
  recordApiCall,
  updateCacheHitRatio,
  updateDatabaseConnections,
  updateQueueSize,
  recordE2eTestResult,
  // Alertas mejoradas
  sendAlert,
  sendSlackAlert
};