import ical from 'ical-generator';
import moment from 'moment-timezone';

class CalendarService {
  constructor() {
    this.googleAuth = null;
    this.calendarId = null;
    this.timezone = moment.tz.guess() || 'America/Mexico_City';
  }

  // Inicializar Google Calendar API
  async initializeGoogleCalendar(clientId, apiKey) {
    try {
      // Cargar Google API
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      // Inicializar cliente
      await window.gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.events'
      });

      this.googleAuth = window.gapi.auth2.getAuthInstance();

      console.log('Google Calendar API initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
      return false;
    }
  }

  // Cargar Google API dinámicamente
  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', resolve);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Autenticar con Google
  async signInWithGoogle() {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Calendar not initialized');
      }

      await this.googleAuth.signIn();
      return true;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return false;
    }
  }

  // Cerrar sesión de Google
  async signOutFromGoogle() {
    try {
      if (this.googleAuth) {
        await this.googleAuth.signOut();
      }
      return true;
    } catch (error) {
      console.error('Error signing out from Google:', error);
      return false;
    }
  }

  // Verificar si está autenticado
  isSignedIn() {
    return this.googleAuth && this.googleAuth.isSignedIn.get();
  }

  // Crear evento en Google Calendar
  async createGoogleCalendarEvent(eventData) {
    try {
      if (!this.isSignedIn()) {
        throw new Error('User not signed in to Google');
      }

      const event = {
        summary: `${eventData.artist} - ${eventData.title}`,
        description: this.generateEventDescription(eventData),
        start: {
          dateTime: moment(eventData.date).toISOString(),
          timeZone: this.timezone
        },
        end: {
          dateTime: moment(eventData.date).add(3, 'hours').toISOString(),
          timeZone: this.timezone
        },
        location: `${eventData.venue.name}, ${eventData.venue.address}, ${eventData.venue.city}, ${eventData.venue.country}`,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'email', minutes: 1440 }
          ]
        },
        source: {
          title: 'Twenty One Pilots App',
          url: `${window.location.origin}/events/${eventData._id}`
        }
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return {
        success: true,
        eventId: response.result.id,
        htmlLink: response.result.htmlLink,
        provider: 'google'
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generar archivo iCal
  generateICalEvent(eventData) {
    try {
      const calendar = ical({
        domain: 'twentyonepilots.app',
        name: 'Twenty One Pilots Events',
        timezone: this.timezone
      });

      const event = calendar.createEvent({
        start: moment(eventData.date),
        end: moment(eventData.date).add(3, 'hours'),
        timezone: this.timezone,
        summary: `${eventData.artist} - ${eventData.title}`,
        description: this.generateEventDescription(eventData),
        location: `${eventData.venue.name}, ${eventData.venue.address}, ${eventData.venue.city}, ${eventData.venue.country}`,
        url: `${window.location.origin}/events/${eventData._id}`,
        organizer: {
          name: 'Twenty One Pilots App',
          email: 'events@twentyonepilots.app'
        }
      });

      // Agregar alarmas/recordatorios
      event.createAlarm({
        type: 'display',
        trigger: 60 // 1 hora antes
      });

      event.createAlarm({
        type: 'display',
        trigger: 1440 // 24 horas antes
      });

      return {
        success: true,
        icalData: calendar.toString(),
        filename: `${eventData.artist.replace(/\s+/g, '_')}_${eventData.title.replace(/\s+/g, '_')}.ics`,
        provider: 'ical'
      };
    } catch (error) {
      console.error('Error generating iCal event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Descargar archivo iCal
  downloadICalEvent(eventData) {
    const result = this.generateICalEvent(eventData);

    if (result.success) {
      const blob = new Blob([result.icalData], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      return { success: true };
    }

    return result;
  }

  // Generar descripción del evento
  generateEventDescription(eventData) {
    let description = `🎵 ${eventData.artist}\n`;
    description += `📅 ${moment(eventData.date).format('LLLL')}\n`;
    description += `📍 ${eventData.venue.name}\n`;
    description += `🏙️ ${eventData.venue.city}, ${eventData.venue.country}\n\n`;

    if (eventData.description) {
      description += `${eventData.description}\n\n`;
    }

    if (eventData.price) {
      const priceText = eventData.price.min === eventData.price.max
        ? `$${eventData.price.min} ${eventData.price.currency}`
        : `$${eventData.price.min} - $${eventData.price.max} ${eventData.price.currency}`;
      description += `💰 ${priceText}\n\n`;
    }

    description += `🔗 Ver detalles: ${window.location.origin}/events/${eventData._id}\n`;

    if (eventData.ticketing?.enabled) {
      description += `🎫 Comprar tickets: ${window.location.origin}/events/${eventData._id}/tickets\n`;
    }

    return description;
  }

  // Crear evento en calendario (elige automáticamente el mejor método)
  async createCalendarEvent(eventData, preferredProvider = 'auto') {
    // Si el usuario está autenticado con Google, usar Google Calendar
    if (preferredProvider === 'auto' && this.isSignedIn()) {
      return await this.createGoogleCalendarEvent(eventData);
    }

    // Si especifica Google pero no está autenticado, pedir autenticación
    if (preferredProvider === 'google' && !this.isSignedIn()) {
      const signedIn = await this.signInWithGoogle();
      if (signedIn) {
        return await this.createGoogleCalendarEvent(eventData);
      }
    }

    // Por defecto, usar iCal (descarga)
    return this.downloadICalEvent(eventData);
  }

  // Crear múltiples eventos
  async createMultipleCalendarEvents(eventsData, preferredProvider = 'auto') {
    const results = [];

    for (const eventData of eventsData) {
      const result = await this.createCalendarEvent(eventData, preferredProvider);
      results.push({
        event: eventData,
        result: result
      });
    }

    return results;
  }

  // Obtener calendarios disponibles (Google Calendar)
  async getAvailableCalendars() {
    try {
      if (!this.isSignedIn()) {
        return [];
      }

      const response = await window.gapi.client.calendar.calendarList.list();
      return response.result.items || [];
    } catch (error) {
      console.error('Error getting calendars:', error);
      return [];
    }
  }

  // Verificar soporte de calendarios
  getCalendarSupport() {
    return {
      googleCalendar: !!window.gapi,
      ical: true, // Siempre disponible
      authenticated: this.isSignedIn(),
      timezone: this.timezone
    };
  }

  // Limpiar recursos
  cleanup() {
    this.googleAuth = null;
    this.calendarId = null;
  }
}

// Exportar instancia singleton
export default new CalendarService();