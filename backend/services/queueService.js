const Queue = require('bull');
const logger = require('../utils/logger');

// Configuración de colas
const QUEUE_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0
  },
  defaultJobOptions: {
    removeOnComplete: 50, // Mantener últimos 50 jobs completados
    removeOnFail: 100,    // Mantener últimos 100 jobs fallidos
    attempts: 3,          // Reintentos por defecto
    backoff: {
      type: 'exponential',
      delay: 5000         // Delay inicial de 5 segundos
    }
  }
};

// Definición de colas
const queues = {
  email: new Queue('email-queue', QUEUE_CONFIG),
  analytics: new Queue('analytics-queue', QUEUE_CONFIG),
  recommendations: new Queue('recommendations-queue', QUEUE_CONFIG),
  notifications: new Queue('notifications-queue', QUEUE_CONFIG)
};

// Log configuración de Redis para colas
logger.info('Initializing Bull queues with Redis config:', {
  host: QUEUE_CONFIG.redis.host,
  port: QUEUE_CONFIG.redis.port,
  db: QUEUE_CONFIG.redis.db,
  hasPassword: !!(QUEUE_CONFIG.redis.password)
});

class QueueService {
  constructor() {
    this.redisDisabled = process.env.REDIS_DISABLED === 'true';

    if (this.redisDisabled) {
      logger.warn('Redis disabled for development - queues will be mocked');
      this.queues = this.createMockQueues();
    } else {
      this.queues = queues;
      this.setupQueueEvents();
      this.setupProcessors();
    }

    this.processors = {};
  }

  // Configurar eventos globales para todas las colas
  setupQueueEvents() {
    Object.entries(this.queues).forEach(([name, queue]) => {
      // Eventos de cola
      queue.on('ready', () => {
        logger.info(`Queue ${name} is ready`);
      });

      queue.on('error', (error) => {
        logger.error(`Queue ${name} error:`, {
          message: error.message,
          code: error.code,
          errno: error.errno,
          syscall: error.syscall,
          hostname: error.hostname,
          port: error.port,
          stack: error.stack
        });
      });

      queue.on('waiting', (jobId) => {
        logger.debug(`Job ${jobId} is waiting in queue ${name}`);
      });

      queue.on('active', (job, jobPromise) => {
        logger.debug(`Job ${job.id} started in queue ${name}`);
      });

      queue.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed in queue ${name}`, {
          duration: job.finishedOn - job.processedOn,
          result: typeof result === 'object' ? JSON.stringify(result) : result
        });
      });

      queue.on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed in queue ${name}:`, {
          error: err.message,
          attemptsMade: job.attemptsMade,
          attemptsRemaining: job.opts.attempts - job.attemptsMade
        });
      });

      queue.on('stalled', (job) => {
        logger.warn(`Job ${job.id} stalled in queue ${name}`);
      });
    });
  }

  // Configurar procesadores para cada cola
  setupProcessors() {
    // Procesador de emails
    this.queues.email.process(async (job) => {
      const { type, data } = job.data;
      logger.info(`Processing email job ${job.id}: ${type}`);

      try {
        switch (type) {
          case 'purchase-confirmation':
            return await this.processPurchaseConfirmationEmail(data);
          case 'event-update':
            return await this.processEventUpdateEmail(data);
          case 'newsletter':
            return await this.processNewsletterEmail(data);
          case 'password-reset':
            return await this.processPasswordResetEmail(data);
          case 'notification':
            return await this.processNotificationEmail(data);
          default:
            throw new Error(`Unknown email type: ${type}`);
        }
      } catch (error) {
        logger.error(`Email processing failed for job ${job.id}:`, error);
        throw error;
      }
    });

    // Procesador de analytics
    this.queues.analytics.process(async (job) => {
      const { type, data, timestamp } = job.data;
      logger.info(`Processing analytics job ${job.id}: ${type}`);

      try {
        switch (type) {
          case 'search-analytics':
            return await this.processSearchAnalytics(data);
          case 'accessibility-metrics':
            return await this.processAccessibilityMetrics(data);
          case 'performance-metrics':
            return await this.processPerformanceMetrics(data);
          case 'user-behavior':
            return await this.processUserBehaviorAnalytics(data);
          default:
            throw new Error(`Unknown analytics type: ${type}`);
        }
      } catch (error) {
        logger.error(`Analytics processing failed for job ${job.id}:`, error);
        throw error;
      }
    });

    // Procesador de recomendaciones
    this.queues.recommendations.process(async (job) => {
      const { userId, type, context } = job.data;
      logger.info(`Processing recommendations job ${job.id} for user ${userId}`);

      try {
        switch (type) {
          case 'music-recommendations':
            return await this.processMusicRecommendations(userId, context);
          case 'event-recommendations':
            return await this.processEventRecommendations(userId, context);
          case 'content-recommendations':
            return await this.processContentRecommendations(userId, context);
          default:
            throw new Error(`Unknown recommendation type: ${type}`);
        }
      } catch (error) {
        logger.error(`Recommendations processing failed for job ${job.id}:`, error);
        throw error;
      }
    });

    // Procesador de notificaciones
    this.queues.notifications.process(async (job) => {
      const { type, userId, data } = job.data;
      logger.info(`Processing notification job ${job.id} for user ${userId}`);

      try {
        switch (type) {
          case 'push-notification':
            return await this.processPushNotification(userId, data);
          case 'in-app-notification':
            return await this.processInAppNotification(userId, data);
          case 'sms-notification':
            return await this.processSMSNotification(userId, data);
          default:
            throw new Error(`Unknown notification type: ${type}`);
        }
      } catch (error) {
        logger.error(`Notification processing failed for job ${job.id}:`, error);
        throw error;
      }
    });
  }

  // ===== MÉTODOS DE EMAIL =====

  async processPurchaseConfirmationEmail(data) {
    const { userEmail, orderId, items, total } = data;

    // Aquí iría la lógica real de envío de email
    logger.info(`Sending purchase confirmation email to ${userEmail} for order ${orderId}`);

    // Simular envío de email
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      email: userEmail,
      orderId,
      sentAt: new Date().toISOString()
    };
  }

  async processEventUpdateEmail(data) {
    const { userEmail, eventId, eventName, changes } = data;

    logger.info(`Sending event update email to ${userEmail} for event ${eventName}`);

    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      email: userEmail,
      eventId,
      sentAt: new Date().toISOString()
    };
  }

  async processNewsletterEmail(data) {
    const { emails, subject, content } = data;

    logger.info(`Sending newsletter to ${emails.length} subscribers`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      recipients: emails.length,
      subject,
      sentAt: new Date().toISOString()
    };
  }

  async processPasswordResetEmail(data) {
    const { userEmail, resetToken } = data;

    logger.info(`Sending password reset email to ${userEmail}`);

    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      email: userEmail,
      sentAt: new Date().toISOString()
    };
  }

  async processNotificationEmail(data) {
    const { userId, notificationId, title, message, type, data: notificationData } = data;

    logger.info(`Sending notification email to user ${userId}: ${title}`);

    // Aquí iría la lógica real de envío de email de notificación
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      success: true,
      userId,
      notificationId,
      type,
      sentAt: new Date().toISOString()
    };
  }

  // ===== MÉTODOS DE ANALYTICS =====

  async processSearchAnalytics(data) {
    const { query, results, userId, timestamp, filters } = data;

    logger.info(`Processing search analytics for query: "${query}"`);

    // Aquí iría la lógica para almacenar métricas de búsqueda
    // Por ejemplo, actualizar contadores, guardar en base de datos, etc.

    return {
      query,
      resultsCount: results,
      userId,
      processedAt: new Date().toISOString(),
      insights: {
        popularSearch: results > 10,
        needsImprovement: results === 0
      }
    };
  }

  async processAccessibilityMetrics(data) {
    const { userId, sessionId, actions, timestamp } = data;

    logger.info(`Processing accessibility metrics for user ${userId}`);

    // Procesar métricas de accesibilidad
    const metrics = {
      highContrastUsed: actions.includes('high-contrast-enabled'),
      largeTextUsed: actions.includes('large-text-enabled'),
      reducedMotionUsed: actions.includes('reduced-motion-enabled'),
      screenReaderUsed: actions.includes('screen-reader-detected'),
      keyboardNavigationUsed: actions.includes('keyboard-navigation'),
      accessibilityAuditorUsed: actions.includes('auditor-opened')
    };

    return {
      userId,
      sessionId,
      metrics,
      processedAt: new Date().toISOString()
    };
  }

  async processPerformanceMetrics(data) {
    const { page, loadTime, apiCalls, errors, timestamp } = data;

    logger.info(`Processing performance metrics for page: ${page}`);

    const performance = {
      loadTime,
      apiCallCount: apiCalls.length,
      errorCount: errors.length,
      averageApiTime: apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length,
      slowestApiCall: Math.max(...apiCalls.map(call => call.duration))
    };

    return {
      page,
      performance,
      processedAt: new Date().toISOString()
    };
  }

  async processUserBehaviorAnalytics(data) {
    const { userId, sessionId, events, timestamp } = data;

    logger.info(`Processing user behavior analytics for user ${userId}`);

    const behavior = {
      pagesVisited: [...new Set(events.map(e => e.page))],
      featuresUsed: [...new Set(events.map(e => e.feature))],
      sessionDuration: events.length > 0 ?
        events[events.length - 1].timestamp - events[0].timestamp : 0,
      mostUsedFeature: this.getMostFrequent(events.map(e => e.feature))
    };

    return {
      userId,
      sessionId,
      behavior,
      processedAt: new Date().toISOString()
    };
  }

  // ===== MÉTODOS DE RECOMENDACIONES =====

  async processMusicRecommendations(userId, context) {
    const { listeningHistory, likedSongs, searchHistory } = context;

    logger.info(`Generating music recommendations for user ${userId}`);

    // Lógica de recomendaciones basada en historial
    const recommendations = {
      basedOnHistory: this.generateRecommendationsFromHistory(listeningHistory),
      basedOnLikes: this.generateRecommendationsFromLikes(likedSongs),
      basedOnSearches: this.generateRecommendationsFromSearches(searchHistory),
      trending: this.getTrendingSongs(),
      similarArtists: this.getSimilarArtists(listeningHistory)
    };

    return {
      userId,
      recommendations,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };
  }

  async processEventRecommendations(userId, context) {
    const { attendedEvents, location, preferences } = context;

    logger.info(`Generating event recommendations for user ${userId}`);

    const recommendations = {
      nearbyEvents: this.getNearbyEvents(location),
      basedOnHistory: this.generateEventRecommendationsFromHistory(attendedEvents),
      basedOnPreferences: this.generateEventRecommendationsFromPreferences(preferences),
      upcoming: this.getUpcomingEvents()
    };

    return {
      userId,
      recommendations,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 horas
    };
  }

  async processContentRecommendations(userId, context) {
    const { viewedContent, likedContent, searchHistory } = context;

    logger.info(`Generating content recommendations for user ${userId}`);

    const recommendations = {
      similarContent: this.getSimilarContent(viewedContent),
      trendingContent: this.getTrendingContent(),
      personalizedContent: this.generatePersonalizedContent(viewedContent, likedContent),
      basedOnSearches: this.generateContentFromSearches(searchHistory)
    };

    return {
      userId,
      recommendations,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 horas
    };
  }

  // ===== MÉTODOS DE NOTIFICACIONES =====

  async processPushNotification(userId, data) {
    const { title, message, icon, badge } = data;

    logger.info(`Sending push notification to user ${userId}: ${title}`);

    // Aquí iría la lógica real de envío de push notifications
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      userId,
      type: 'push',
      title,
      message,
      sentAt: new Date().toISOString()
    };
  }

  async processInAppNotification(userId, data) {
    const { title, message, type, actionUrl } = data;

    logger.info(`Creating in-app notification for user ${userId}: ${title}`);

    // Aquí iría la lógica para guardar notificación en base de datos
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      userId,
      type: 'in-app',
      title,
      message,
      actionUrl,
      createdAt: new Date().toISOString()
    };
  }

  async processSMSNotification(userId, data) {
    const { message, phoneNumber } = data;

    logger.info(`Sending SMS notification to user ${userId}`);

    // Aquí iría la lógica real de envío de SMS
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      userId,
      type: 'sms',
      phoneNumber,
      sentAt: new Date().toISOString()
    };
  }

  // ===== MÉTODOS DE MOCK PARA DESARROLLO =====

  createMockQueues() {
    const mockQueue = {
      add: async (data, options) => {
        logger.info('Mock queue: job added (not processed)', { data, options });
        return { id: `mock-${Date.now()}`, data };
      },
      process: () => {
        logger.info('Mock queue: processor registered (not executed)');
      },
      on: () => {
        logger.debug('Mock queue: event listener registered');
      },
      getWaiting: async () => [],
      getActive: async () => [],
      getCompleted: async () => [],
      getFailed: async () => [],
      isPaused: async () => false,
      close: async () => {
        logger.info('Mock queue: closed');
      }
    };

    return {
      email: mockQueue,
      analytics: mockQueue,
      recommendations: mockQueue,
      notifications: mockQueue
    };
  }

  // ===== MÉTODOS DE AGREGACIÓN DE JOBS =====

  /**
   * Agregar job de email a la cola
   */
  async addEmailJob(type, data, options = {}) {
    if (this.redisDisabled) {
      logger.info('Mock: Email job added (not queued)', { type, data });
      return { id: `mock-email-${Date.now()}`, data: { type, data } };
    }

    const jobOptions = {
      ...QUEUE_CONFIG.defaultJobOptions,
      priority: this.getEmailPriority(type),
      ...options
    };

    return await this.queues.email.add({ type, data }, jobOptions);
  }

  /**
   * Agregar job de analytics a la cola
   */
  async addAnalyticsJob(type, data, options = {}) {
    if (this.redisDisabled) {
      logger.info('Mock: Analytics job added (not queued)', { type, data });
      return { id: `mock-analytics-${Date.now()}`, data: { type, data, timestamp: new Date() } };
    }

    const jobOptions = {
      ...QUEUE_CONFIG.defaultJobOptions,
      priority: this.getAnalyticsPriority(type),
      ...options
    };

    return await this.queues.analytics.add({ type, data, timestamp: new Date() }, jobOptions);
  }

  /**
   * Agregar job de recomendaciones a la cola
   */
  async addRecommendationJob(userId, type, context, options = {}) {
    if (this.redisDisabled) {
      logger.info('Mock: Recommendation job added (not queued)', { userId, type });
      return { id: `mock-recommendation-${Date.now()}`, data: { userId, type, context } };
    }

    const jobOptions = {
      ...QUEUE_CONFIG.defaultJobOptions,
      priority: 5, // Alta prioridad para recomendaciones
      ...options
    };

    return await this.queues.recommendations.add({ userId, type, context }, jobOptions);
  }

  /**
   * Agregar job de notificación a la cola
   */
  async addNotificationJob(type, userId, data, options = {}) {
    if (this.redisDisabled) {
      logger.info('Mock: Notification job added (not queued)', { type, userId });
      return { id: `mock-notification-${Date.now()}`, data: { type, userId, data } };
    }

    const jobOptions = {
      ...QUEUE_CONFIG.defaultJobOptions,
      priority: this.getNotificationPriority(type),
      ...options
    };

    return await this.queues.notifications.add({ type, userId, data }, jobOptions);
  }

  // ===== MÉTODOS DE PRIORIDAD =====

  getEmailPriority(type) {
    const priorities = {
      'password-reset': 10,    // Crítica
      'purchase-confirmation': 8, // Alta
      'event-update': 6,       // Media
      'newsletter': 2          // Baja
    };
    return priorities[type] || 5;
  }

  getAnalyticsPriority(type) {
    const priorities = {
      'performance-metrics': 3, // Baja, procesamiento batch
      'accessibility-metrics': 4,
      'search-analytics': 5,
      'user-behavior': 4
    };
    return priorities[type] || 3;
  }

  getNotificationPriority(type) {
    const priorities = {
      'push-notification': 7,  // Alta
      'in-app-notification': 5,
      'sms-notification': 8    // Muy alta para SMS
    };
    return priorities[type] || 5;
  }

  // ===== MÉTODOS DE ESTADÍSTICAS =====

  async getQueueStats() {
    if (this.redisDisabled) {
      logger.info('Mock: Returning mock queue stats');
      return {
        email: { waiting: 0, active: 0, completed: 0, failed: 0, isPaused: false, mock: true },
        analytics: { waiting: 0, active: 0, completed: 0, failed: 0, isPaused: false, mock: true },
        recommendations: { waiting: 0, active: 0, completed: 0, failed: 0, isPaused: false, mock: true },
        notifications: { waiting: 0, active: 0, completed: 0, failed: 0, isPaused: false, mock: true }
      };
    }

    const stats = {};

    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        const completed = await queue.getCompleted();
        const failed = await queue.getFailed();

        stats[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          isPaused: await queue.isPaused()
        };
      } catch (error) {
        logger.error(`Error getting stats for queue ${name}:`, error);
        stats[name] = { error: error.message };
      }
    }

    return stats;
  }

  // ===== MÉTODOS DE LIMPIEZA =====

  async close() {
    logger.info('Closing all queues...');

    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        await queue.close();
        logger.info(`Queue ${name} closed`);
      } catch (error) {
        logger.error(`Error closing queue ${name}:`, error);
      }
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  getMostFrequent(array) {
    return array.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );
  }

  // Métodos de generación de recomendaciones (simplificados)
  generateRecommendationsFromHistory(history) {
    // Lógica simplificada
    return ['song1', 'song2', 'song3'];
  }

  generateRecommendationsFromLikes(likes) {
    return ['liked-song1', 'liked-song2'];
  }

  generateRecommendationsFromSearches(searches) {
    return ['searched-song1', 'searched-song2'];
  }

  getTrendingSongs() {
    return ['trending1', 'trending2', 'trending3'];
  }

  getSimilarArtists(history) {
    return ['artist1', 'artist2'];
  }

  getNearbyEvents(location) {
    return ['event1', 'event2'];
  }

  generateEventRecommendationsFromHistory(history) {
    return ['event-based1', 'event-based2'];
  }

  generateEventRecommendationsFromPreferences(preferences) {
    return ['pref-event1', 'pref-event2'];
  }

  getUpcomingEvents() {
    return ['upcoming1', 'upcoming2'];
  }

  getSimilarContent(content) {
    return ['similar1', 'similar2'];
  }

  getTrendingContent() {
    return ['trending-content1', 'trending-content2'];
  }

  generatePersonalizedContent(viewed, liked) {
    return ['personalized1', 'personalized2'];
  }

  generateContentFromSearches(searches) {
    return ['search-content1', 'search-content2'];
  }
}

// Exportar instancia singleton
module.exports = new QueueService();