import moment from 'moment-timezone';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.permission = null;
    this.timezone = moment.tz.guess() || 'America/Mexico_City';
    this.eventListeners = new Map();
  }

  // Inicializar servicio de notificaciones
  async initialize() {
    // Verificar soporte de notificaciones
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    // Verificar permisos
    this.permission = Notification.permission;

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission === 'granted';
  }

  // Programar recordatorio para evento
  async scheduleEventReminder(eventData, reminderSettings) {
    try {
      const reminderId = `event_${eventData._id}_${Date.now()}`;

      const reminder = {
        id: reminderId,
        eventId: eventData._id,
        eventData: eventData,
        settings: reminderSettings,
        scheduledTime: this.calculateReminderTime(eventData.date, reminderSettings),
        type: reminderSettings.type,
        status: 'scheduled'
      };

      // Si es notificación push inmediata
      if (reminderSettings.type === 'push' && reminderSettings.immediate) {
        await this.sendPushNotification(reminder);
        reminder.status = 'sent';
      }

      // Si es email, enviar a través de API
      if (reminderSettings.type === 'email') {
        await this.sendEmailNotification(reminder);
        reminder.status = 'sent';
      }

      // Si es basado en ubicación, registrar listener
      if (reminderSettings.type === 'location') {
        this.setupLocationReminder(reminder);
      }

      // Si es tiempo programado, programar notificación
      if (reminderSettings.type === 'scheduled') {
        this.scheduleTimedReminder(reminder);
      }

      this.notifications.push(reminder);

      return {
        success: true,
        reminderId: reminderId,
        scheduledTime: reminder.scheduledTime
      };
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calcular tiempo del recordatorio
  calculateReminderTime(eventDate, settings) {
    const eventTime = moment(eventDate);
    let reminderTime;

    switch (settings.unit) {
      case 'minutes':
        reminderTime = eventTime.subtract(settings.value, 'minutes');
        break;
      case 'hours':
        reminderTime = eventTime.subtract(settings.value, 'hours');
        break;
      case 'days':
        reminderTime = eventTime.subtract(settings.value, 'days');
        break;
      case 'weeks':
        reminderTime = eventTime.subtract(settings.value, 'weeks');
        break;
      default:
        reminderTime = eventTime.subtract(1, 'hours'); // Default 1 hora
    }

    return reminderTime.toDate();
  }

  // Enviar notificación push
  async sendPushNotification(reminder) {
    if (this.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const event = reminder.eventData;
    const settings = reminder.settings;

    let title = `🎵 Recordatorio: ${event.artist}`;
    let body = `${event.title}\n📅 ${moment(event.date).format('LLLL')}\n📍 ${event.venue.name}, ${event.venue.city}`;

    // Personalizar según tipo de recordatorio
    if (settings.unit && settings.value) {
      const timeText = this.getTimeText(settings.value, settings.unit);
      body += `\n⏰ ${timeText}`;
    }

    // Agregar información de ruta si está disponible
    if (settings.includeRoute && settings.routeInfo) {
      body += `\n🚗 ${settings.routeInfo.duration} - ${settings.routeInfo.distance}`;
    }

    const notification = new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      badge: '/badge.png',
      tag: `event-reminder-${event._id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Ver evento'
        },
        {
          action: 'navigate',
          title: 'Cómo llegar'
        }
      ],
      data: {
        eventId: event._id,
        reminderId: reminder.id,
        action: 'reminder'
      }
    });

    // Manejar clics en la notificación
    notification.onclick = () => {
      window.focus();
      // Emitir evento para que la app maneje la navegación
      window.dispatchEvent(new CustomEvent('notificationClick', {
        detail: {
          eventId: event._id,
          action: 'view'
        }
      }));
    };

    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }

  // Enviar notificación por email (a través de API)
  async sendEmailNotification(reminder) {
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: reminder.eventId,
          eventData: reminder.eventData,
          reminderSettings: reminder.settings,
          scheduledTime: reminder.scheduledTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  // Configurar recordatorio basado en ubicación
  setupLocationReminder(reminder) {
    const event = reminder.eventData;
    const settings = reminder.settings;

    // Crear listener para ubicación
    const locationListener = (location) => {
      const distance = this.calculateDistance(
        location,
        {
          latitude: event.venue.coordinates.latitude,
          longitude: event.venue.coordinates.longitude
        }
      );

      // Si está dentro del radio configurado, enviar notificación
      if (distance <= (settings.radius || 5)) { // 5km por defecto
        this.sendPushNotification({
          ...reminder,
          settings: {
            ...settings,
            immediate: true,
            locationDistance: distance
          }
        });

        // Remover listener después de enviar
        this.removeLocationListener(reminder.id);
      }
    };

    this.eventListeners.set(reminder.id, locationListener);

    // Escuchar cambios de ubicación (esto debería integrarse con el MapService)
    window.addEventListener('locationUpdate', (event) => {
      locationListener(event.detail);
    });
  }

  // Programar recordatorio con tiempo
  scheduleTimedReminder(reminder) {
    const now = new Date();
    const scheduledTime = reminder.scheduledTime;

    if (scheduledTime > now) {
      const timeoutId = setTimeout(async () => {
        await this.sendPushNotification(reminder);
        reminder.status = 'sent';
      }, scheduledTime - now);

      reminder.timeoutId = timeoutId;
    } else {
      // Si el tiempo ya pasó, enviar inmediatamente
      this.sendPushNotification(reminder);
      reminder.status = 'sent';
    }
  }

  // Calcular distancia entre dos puntos
  calculateDistance(point1, point2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLng = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Convertir grados a radianes
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Obtener texto descriptivo del tiempo
  getTimeText(value, unit) {
    const unitTexts = {
      minutes: value === 1 ? 'minuto' : 'minutos',
      hours: value === 1 ? 'hora' : 'horas',
      days: value === 1 ? 'día' : 'días',
      weeks: value === 1 ? 'semana' : 'semanas'
    };

    return `En ${value} ${unitTexts[unit]}`;
  }

  // Cancelar recordatorio
  cancelReminder(reminderId) {
    const reminder = this.notifications.find(r => r.id === reminderId);
    if (reminder) {
      // Cancelar timeout si existe
      if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
      }

      // Remover listener de ubicación
      this.removeLocationListener(reminderId);

      reminder.status = 'cancelled';
    }
  }

  // Remover listener de ubicación
  removeLocationListener(reminderId) {
    if (this.eventListeners.has(reminderId)) {
      this.eventListeners.delete(reminderId);
    }
  }

  // Obtener recordatorios activos
  getActiveReminders() {
    return this.notifications.filter(r => r.status === 'scheduled');
  }

  // Obtener historial de notificaciones
  getNotificationHistory() {
    return this.notifications.filter(r => r.status !== 'scheduled');
  }

  // Configurar preferencias de notificación
  async updateNotificationPreferences(preferences) {
    try {
      // Guardar en localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      // Si hay cambios en permisos, solicitarlos
      if (preferences.enablePush && this.permission !== 'granted') {
        await this.initialize();
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener preferencias guardadas
  getNotificationPreferences() {
    try {
      const saved = localStorage.getItem('notificationPreferences');
      return saved ? JSON.parse(saved) : {
        enablePush: false,
        enableEmail: false,
        defaultReminderTime: 60, // minutos
        defaultReminderUnit: 'minutes',
        enableLocationReminders: false,
        locationRadius: 5 // km
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return {};
    }
  }

  // Verificar soporte de notificaciones
  getNotificationSupport() {
    return {
      pushSupported: 'Notification' in window,
      pushGranted: this.permission === 'granted',
      serviceWorkerSupported: 'serviceWorker' in navigator,
      timezone: this.timezone,
      activeReminders: this.getActiveReminders().length
    };
  }

  // Limpiar recursos
  cleanup() {
    // Cancelar todos los timeouts
    this.notifications.forEach(reminder => {
      if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
      }
    });

    // Limpiar listeners
    this.eventListeners.clear();

    // Limpiar notificaciones
    this.notifications = [];
  }
}

// Exportar instancia singleton
export default new NotificationService();