const { google } = require('googleapis');

class CalendarService {
  constructor() {
    this.calendar = null;
    this.isInitialized = false;
  }

  // Inicializar Google Calendar API
  async initialize() {
    try {
      if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.warn('Google Calendar no configurado - usar variables de entorno');
        return false;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      this.isInitialized = true;

      console.log('Google Calendar inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error inicializando Google Calendar:', error);
      return false;
    }
  }

  // Crear evento de concierto en Google Calendar
  async createConcertEvent(concert, userEmail = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        console.warn('Google Calendar no disponible');
        return null;
      }

      const event = {
        summary: `${concert.name} - Twenty One Pilots`,
        location: concert.venue_name || concert.location,
        description: `Concierto de Twenty One Pilots\n\n${concert.description || ''}\n\nPrecio: ${concert.price || 'Por confirmar'}\n\nCompra tus boletos: ${concert.url || 'Información próximamente'}`,
        start: {
          dateTime: new Date(concert.start_date).toISOString(),
          timeZone: 'America/New_York', // Ajustar según ubicación
        },
        end: {
          dateTime: new Date(concert.end_date || concert.start_date).toISOString(),
          timeZone: 'America/New_York',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 día antes
            { method: 'popup', minutes: 60 }, // 1 hora antes
          ],
        },
        // Agregar imagen del evento si está disponible
        attachments: concert.image ? [{
          fileUrl: concert.image,
          title: 'Imagen del evento'
        }] : undefined,
      };

      // Crear evento en el calendario del usuario o en uno público
      const calendarId = userEmail ? 'primary' : process.env.GOOGLE_CALENDAR_ID || 'primary';

      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
        sendUpdates: userEmail ? 'all' : 'none',
      });

      console.log('Evento creado en Google Calendar:', response.data.id);
      return {
        eventId: response.data.id,
        calendarLink: response.data.htmlLink,
        success: true
      };
    } catch (error) {
      console.error('Error creando evento en Google Calendar:', error);
      return null;
    }
  }

  // Obtener eventos próximos
  async getUpcomingEvents(calendarId = 'primary', maxResults = 10) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return [];
      }

      const response = await this.calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location,
        description: event.description,
        calendarLink: event.htmlLink,
      }));
    } catch (error) {
      console.error('Error obteniendo eventos:', error);
      return [];
    }
  }

  // Actualizar evento
  async updateConcertEvent(eventId, updates, calendarId = 'primary') {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return false;
      }

      const response = await this.calendar.events.patch({
        calendarId,
        eventId,
        resource: updates,
      });

      return response.data;
    } catch (error) {
      console.error('Error actualizando evento:', error);
      return false;
    }
  }

  // Eliminar evento
  async deleteConcertEvent(eventId, calendarId = 'primary') {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return false;
      }

      await this.calendar.events.delete({
        calendarId,
        eventId,
      });

      return true;
    } catch (error) {
      console.error('Error eliminando evento:', error);
      return false;
    }
  }

  // Crear recordatorio personalizado
  async createCustomReminder(concert, userEmail, reminderTime) {
    try {
      const eventResult = await this.createConcertEvent(concert, userEmail);

      if (eventResult && reminderTime) {
        // Actualizar recordatorios
        await this.updateConcertEvent(eventResult.eventId, {
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: reminderTime },
              { method: 'popup', minutes: Math.min(reminderTime, 60) },
            ],
          },
        }, 'primary');
      }

      return eventResult;
    } catch (error) {
      console.error('Error creando recordatorio personalizado:', error);
      return null;
    }
  }

  // Compartir calendario
  async shareCalendar(calendarId, email) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return false;
      }

      await this.calendar.acl.insert({
        calendarId,
        resource: {
          role: 'reader',
          scope: {
            type: 'user',
            value: email,
          },
        },
      });

      return true;
    } catch (error) {
      console.error('Error compartiendo calendario:', error);
      return false;
    }
  }
}

module.exports = new CalendarService();