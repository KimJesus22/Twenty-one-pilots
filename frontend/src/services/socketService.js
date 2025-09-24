import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      withCredentials: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection_error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('reconnected', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔌 Reconnection failed:', error);
      this.emit('reconnect_error', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔌 Failed to reconnect after', this.maxReconnectAttempts, 'attempts');
      this.emit('reconnect_failed');
    });
  }

  // Forum-specific methods
  joinForum() {
    if (this.socket?.connected) {
      this.socket.emit('join-forum');
    }
  }

  joinThread(threadId) {
    if (this.socket?.connected) {
      this.socket.emit('join-thread', threadId);
    }
  }

  leaveThread(threadId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-thread', threadId);
    }
  }

  joinUserNotifications(userId) {
    if (this.socket?.connected) {
      this.socket.emit('join-user-notifications', userId);
    }
  }

  // Listen for forum events
  onThreadUpdate(callback) {
    this.addListener('thread-update', callback);
    if (this.socket?.connected) {
      this.socket.on('thread-update', callback);
    }
  }

  onNewComment(callback) {
    this.addListener('new-comment', callback);
    if (this.socket?.connected) {
      this.socket.on('new-comment', callback);
    }
  }

  onCommentUpdate(callback) {
    this.addListener('comment-update', callback);
    if (this.socket?.connected) {
      this.socket.on('comment-update', callback);
    }
  }

  onCommentDelete(callback) {
    this.addListener('comment-delete', callback);
    if (this.socket?.connected) {
      this.socket.on('comment-delete', callback);
    }
  }

  onThreadVote(callback) {
    this.addListener('thread-vote', callback);
    if (this.socket?.connected) {
      this.socket.on('thread-vote', callback);
    }
  }

  onCommentVote(callback) {
    this.addListener('comment-vote', callback);
    if (this.socket?.connected) {
      this.socket.on('comment-vote', callback);
    }
  }

  onNotification(callback) {
    this.addListener('notification', callback);
    if (this.socket?.connected) {
      this.socket.on('notification', callback);
    }
  }

  // Generic event listeners
  on(event, callback) {
    this.addListener(event, callback);
    if (this.socket?.connected) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    this.removeListener(event, callback);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Internal listener management
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, ...args) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;