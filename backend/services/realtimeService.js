const EventEmitter = require('events');
const logger = require('../utils/logger');

class RealtimeService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // userId -> Set of connectionIds
    this.playlists = new Map(); // playlistId -> Set of userIds watching
    this.maxConnectionsPerUser = 5;
    this.connectionTimeout = 30 * 60 * 1000; // 30 minutos
  }

  /**
   * Registrar una conexión de usuario
   */
  registerConnection(userId, connectionId) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    const userConnections = this.connections.get(userId);

    // Limitar conexiones por usuario
    if (userConnections.size >= this.maxConnectionsPerUser) {
      const oldestConnection = userConnections.values().next().value;
      userConnections.delete(oldestConnection);
      logger.warn(`Connection limit exceeded for user ${userId}, removed oldest connection`);
    }

    userConnections.add(connectionId);

    // Configurar timeout para la conexión
    setTimeout(() => {
      this.unregisterConnection(userId, connectionId);
    }, this.connectionTimeout);

    logger.debug(`Connection registered: user ${userId}, connection ${connectionId}`);
  }

  /**
   * Desregistrar una conexión de usuario
   */
  unregisterConnection(userId, connectionId) {
    if (this.connections.has(userId)) {
      const userConnections = this.connections.get(userId);
      userConnections.delete(connectionId);

      if (userConnections.size === 0) {
        this.connections.delete(userId);
        // También remover de todas las playlists que estaba watching
        this.stopWatchingAllPlaylists(userId);
      }

      logger.debug(`Connection unregistered: user ${userId}, connection ${connectionId}`);
    }
  }

  /**
   * Usuario comienza a observar una playlist
   */
  startWatchingPlaylist(userId, playlistId) {
    if (!this.playlists.has(playlistId)) {
      this.playlists.set(playlistId, new Set());
    }

    this.playlists.get(playlistId).add(userId);
    logger.debug(`User ${userId} started watching playlist ${playlistId}`);
  }

  /**
   * Usuario deja de observar una playlist
   */
  stopWatchingPlaylist(userId, playlistId) {
    if (this.playlists.has(playlistId)) {
      this.playlists.get(playlistId).delete(userId);

      if (this.playlists.get(playlistId).size === 0) {
        this.playlists.delete(playlistId);
      }

      logger.debug(`User ${userId} stopped watching playlist ${playlistId}`);
    }
  }

  /**
   * Usuario deja de observar todas las playlists
   */
  stopWatchingAllPlaylists(userId) {
    for (const [playlistId, watchers] of this.playlists.entries()) {
      watchers.delete(userId);
      if (watchers.size === 0) {
        this.playlists.delete(playlistId);
      }
    }
    logger.debug(`User ${userId} stopped watching all playlists`);
  }

  /**
   * Notificar a los observadores de una playlist sobre un cambio
   */
  notifyPlaylistUpdate(playlistId, eventType, data, excludeUserId = null) {
    if (!this.playlists.has(playlistId)) {
      return;
    }

    const watchers = this.playlists.get(playlistId);
    const notification = {
      type: 'playlist_update',
      playlistId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    let notifiedCount = 0;
    for (const userId of watchers) {
      if (userId !== excludeUserId) {
        this.emit('notification', userId, notification);
        notifiedCount++;
      }
    }

    logger.debug(`Notified ${notifiedCount} users about playlist ${playlistId} update: ${eventType}`);
  }

  /**
   * Notificar a un usuario específico
   */
  notifyUser(userId, notification) {
    this.emit('notification', userId, notification);
    logger.debug(`Notified user ${userId}: ${notification.type}`);
  }

  /**
   * Obtener estadísticas de conexiones
   */
  getStats() {
    const totalConnections = Array.from(this.connections.values())
      .reduce((sum, connections) => sum + connections.size, 0);

    return {
      totalUsers: this.connections.size,
      totalConnections,
      totalPlaylists: this.playlists.size,
      playlistsBreakdown: Array.from(this.playlists.entries()).map(([playlistId, watchers]) => ({
        playlistId,
        watcherCount: watchers.size
      }))
    };
  }

  /**
   * Limpiar conexiones inactivas (método para mantenimiento)
   */
  cleanup() {
    // Esta implementación básica no hace limpieza automática
    // En una implementación real, se haría seguimiento de timestamps de actividad
    logger.info('Realtime service cleanup completed');
  }
}

// Eventos disponibles para playlists
RealtimeService.PLAYLIST_EVENTS = {
  VIDEO_ADDED: 'video_added',
  VIDEO_REMOVED: 'video_removed',
  VIDEOS_REORDERED: 'videos_reordered',
  COLLABORATOR_ADDED: 'collaborator_added',
  COLLABORATOR_REMOVED: 'collaborator_removed',
  SETTINGS_UPDATED: 'settings_updated',
  LIKED: 'liked',
  COMMENT_ADDED: 'comment_added',
  SHARED: 'shared'
};

module.exports = new RealtimeService();