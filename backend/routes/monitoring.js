const express = require('express');
const cacheService = require('../services/cacheService');
const queueService = require('../services/queueService');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de autenticación básica para monitoreo
const requireMonitoringAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de monitoreo requerido'
    });
  }

  const token = authHeader.substring(7);

  // Token simple para monitoreo (en producción usar JWT o API key)
  if (token !== process.env.MONITORING_TOKEN) {
    return res.status(403).json({
      success: false,
      message: 'Token de monitoreo inválido'
    });
  }

  next();
};

// Estado general del sistema
router.get('/health', async (req, res) => {
  try {
    const cacheHealth = await cacheService.ping();
    const queueStats = await queueService.getQueueStats();

    const overallHealth = cacheHealth ? 'healthy' : 'degraded';

    res.json({
      success: true,
      status: overallHealth,
      timestamp: new Date().toISOString(),
      services: {
        cache: {
          status: cacheHealth ? 'healthy' : 'unhealthy',
          connected: cacheHealth
        },
        queues: {
          status: 'healthy', // Las colas siempre están disponibles con Bull
          stats: queueStats
        }
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Error en health check:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Estadísticas detalladas del caché
router.get('/cache/stats', requireMonitoringAuth, async (req, res) => {
  try {
    const stats = await cacheService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas de caché:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de caché',
      error: error.message
    });
  }
});

// Estadísticas de las colas
router.get('/queues/stats', requireMonitoringAuth, async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas de colas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de colas',
      error: error.message
    });
  }
});

// Limpiar caché (solo para desarrollo/admin)
router.post('/cache/clear', requireMonitoringAuth, async (req, res) => {
  try {
    const result = await cacheService.clearAll();

    if (result) {
      logger.info('Caché limpiado manualmente vía API de monitoreo');
      res.json({
        success: true,
        message: 'Caché limpiado exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error limpiando caché'
      });
    }
  } catch (error) {
    logger.error('Error limpiando caché:', error);
    res.status(500).json({
      success: false,
      message: 'Error limpiando caché',
      error: error.message
    });
  }
});

// Limpiar colas específicas
router.post('/queues/:queueName/clean', requireMonitoringAuth, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { state = 'completed' } = req.query; // completed, failed, active, waiting

    if (!queueService.queues[queueName]) {
      return res.status(404).json({
        success: false,
        message: `Cola ${queueName} no encontrada`
      });
    }

    const queue = queueService.queues[queueName];
    let cleanedCount = 0;

    switch (state) {
      case 'completed':
        cleanedCount = await queue.clean(0, 'completed');
        break;
      case 'failed':
        cleanedCount = await queue.clean(0, 'failed');
        break;
      case 'active':
        cleanedCount = await queue.clean(0, 'active');
        break;
      case 'waiting':
        await queue.empty();
        cleanedCount = 'all waiting jobs';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Use: completed, failed, active, waiting'
        });
    }

    logger.info(`Cola ${queueName} limpiada: ${cleanedCount} jobs ${state} eliminados`);

    res.json({
      success: true,
      message: `Cola ${queueName} limpiada`,
      cleaned: cleanedCount
    });
  } catch (error) {
    logger.error(`Error limpiando cola ${req.params.queueName}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error limpiando cola',
      error: error.message
    });
  }
});

// Pausar/reanudar colas
router.post('/queues/:queueName/:action', requireMonitoringAuth, async (req, res) => {
  try {
    const { queueName, action } = req.params;

    if (!queueService.queues[queueName]) {
      return res.status(404).json({
        success: false,
        message: `Cola ${queueName} no encontrada`
      });
    }

    const queue = queueService.queues[queueName];

    switch (action) {
      case 'pause':
        await queue.pause();
        logger.info(`Cola ${queueName} pausada`);
        res.json({ success: true, message: `Cola ${queueName} pausada` });
        break;

      case 'resume':
        await queue.resume();
        logger.info(`Cola ${queueName} reanudada`);
        res.json({ success: true, message: `Cola ${queueName} reanudada` });
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Acción inválida. Use: pause o resume'
        });
    }
  } catch (error) {
    logger.error(`Error en acción ${req.params.action} para cola ${req.params.queueName}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando acción en cola',
      error: error.message
    });
  }
});

// Métricas de rendimiento
router.get('/performance', requireMonitoringAuth, async (req, res) => {
  try {
    const performance = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      cache: await cacheService.getStats(),
      queues: await queueService.getQueueStats(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error obteniendo métricas de rendimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas de rendimiento',
      error: error.message
    });
  }
});

// Endpoint para métricas de Prometheus (opcional)
router.get('/metrics', requireMonitoringAuth, async (req, res) => {
  try {
    const cacheStats = await cacheService.getStats();
    const queueStats = await queueService.getQueueStats();

    // Formato Prometheus
    let metrics = '# HELP cache_connected Redis connection status\n';
    metrics += '# TYPE cache_connected gauge\n';
    metrics += `cache_connected ${cacheStats.connected ? 1 : 0}\n\n`;

    if (cacheStats.connected && cacheStats.dbSize !== undefined) {
      metrics += '# HELP cache_db_size Number of keys in Redis\n';
      metrics += '# TYPE cache_db_size gauge\n';
      metrics += `cache_db_size ${cacheStats.dbSize}\n\n`;
    }

    // Métricas de colas
    Object.entries(queueStats).forEach(([queueName, stats]) => {
      if (stats.error) return;

      metrics += `# HELP queue_${queueName}_waiting_jobs Number of waiting jobs in ${queueName} queue\n`;
      metrics += `# TYPE queue_${queueName}_waiting_jobs gauge\n`;
      metrics += `queue_${queueName}_waiting_jobs ${stats.waiting}\n\n`;

      metrics += `# HELP queue_${queueName}_active_jobs Number of active jobs in ${queueName} queue\n`;
      metrics += `# TYPE queue_${queueName}_active_jobs gauge\n`;
      metrics += `queue_${queueName}_active_jobs ${stats.active}\n\n`;

      metrics += `# HELP queue_${queueName}_completed_jobs Number of completed jobs in ${queueName} queue\n`;
      metrics += `# TYPE queue_${queueName}_completed_jobs counter\n`;
      metrics += `queue_${queueName}_completed_jobs ${stats.completed}\n\n`;

      metrics += `# HELP queue_${queueName}_failed_jobs Number of failed jobs in ${queueName} queue\n`;
      metrics += `# TYPE queue_${queueName}_failed_jobs counter\n`;
      metrics += `queue_${queueName}_failed_jobs ${stats.failed}\n\n`;
    });

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error('Error generando métricas Prometheus:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

module.exports = router;