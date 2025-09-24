import React, { useState, useEffect } from 'react';
import calendarService from '../services/calendarService';
import notificationService from '../services/notificationService';
import mapService from '../services/mapService';
import './EventReminderManager.css';

const EventReminderManager = ({
  event,
  userLocation,
  onReminderCreated,
  onCalendarExported,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [calendarProvider, setCalendarProvider] = useState('auto');
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Configuración de recordatorios
  const [reminderSettings, setReminderSettings] = useState({
    type: 'scheduled',
    value: 60,
    unit: 'minutes',
    includeRoute: false,
    routeInfo: null
  });

  // Estado de servicios
  const [servicesStatus, setServicesStatus] = useState({
    calendar: null,
    notifications: null
  });

  // Inicializar servicios
  useEffect(() => {
    const initializeServices = async () => {
      // Verificar estado de calendario
      const calendarStatus = calendarService.getCalendarSupport();
      setIsGoogleSignedIn(calendarStatus.authenticated);

      // Verificar estado de notificaciones
      const notificationStatus = notificationService.getNotificationSupport();

      setServicesStatus({
        calendar: calendarStatus,
        notifications: notificationStatus
      });

      // Inicializar servicios si es necesario
      if (!calendarStatus.googleCalendar) {
        await calendarService.initializeGoogleCalendar(
          process.env.REACT_APP_GOOGLE_CLIENT_ID,
          process.env.REACT_APP_GOOGLE_API_KEY
        );
      }

      if (!notificationStatus.pushSupported) {
        await notificationService.initialize();
      }
    };

    initializeServices();
  }, []);

  // Calcular información de ruta cuando cambie la configuración
  useEffect(() => {
    const calculateRouteInfo = async () => {
      if (reminderSettings.includeRoute && userLocation && event) {
        try {
          const route = await mapService.calculateRoute(userLocation, {
            latitude: event.venue.coordinates.latitude,
            longitude: event.venue.coordinates.longitude
          }, { mode: 'driving' });

          if (route.routes && route.routes[0]) {
            const leg = route.routes[0].legs[0];
            setReminderSettings(prev => ({
              ...prev,
              routeInfo: {
                duration: leg.duration.text,
                distance: leg.distance.text,
                mode: 'driving'
              }
            }));
          }
        } catch (error) {
          console.error('Error calculating route for reminder:', error);
        }
      }
    };

    calculateRouteInfo();
  }, [reminderSettings.includeRoute, userLocation, event]);

  // Manejar exportación a calendario
  const handleCalendarExport = async () => {
    if (!event) return;

    setCalendarLoading(true);
    try {
      const result = await calendarService.createCalendarEvent(event, calendarProvider);

      if (result.success) {
        onCalendarExported && onCalendarExported(result);
        alert(`Evento exportado exitosamente a ${result.provider === 'google' ? 'Google Calendar' : 'archivo iCal'}`);
      } else {
        alert(`Error exportando evento: ${result.error}`);
      }
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      alert('Error exportando evento al calendario');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Manejar creación de recordatorio
  const handleCreateReminder = async () => {
    if (!event) return;

    setNotificationLoading(true);
    try {
      const result = await notificationService.scheduleEventReminder(event, reminderSettings);

      if (result.success) {
        onReminderCreated && onReminderCreated(result);
        alert(`Recordatorio programado para ${new Date(result.scheduledTime).toLocaleString()}`);
      } else {
        alert(`Error creando recordatorio: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Error creando recordatorio');
    } finally {
      setNotificationLoading(false);
    }
  };

  // Manejar autenticación con Google
  const handleGoogleSignIn = async () => {
    try {
      const success = await calendarService.signInWithGoogle();
      setIsGoogleSignedIn(success);

      if (success) {
        alert('Conectado exitosamente con Google Calendar');
      } else {
        alert('Error conectando con Google Calendar');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error conectando con Google');
    }
  };

  // Manejar cambio de configuración de recordatorio
  const handleReminderSettingChange = (field, value) => {
    setReminderSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (compact) {
    return (
      <div className="event-reminder-compact">
        <button
          className="reminder-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Recordatorios y calendario"
        >
          🔔📅
        </button>

        {isOpen && (
          <div className="reminder-popup">
            <div className="reminder-popup-header">
              <h4>Recordatorios</h4>
              <button onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="reminder-popup-content">
              <button
                className="quick-reminder-btn"
                onClick={() => handleReminderSettingChange('value', 60)}
                disabled={notificationLoading}
              >
                ⏰ 1 hora antes
              </button>

              <button
                className="quick-reminder-btn"
                onClick={() => handleReminderSettingChange('value', 1440)}
                disabled={notificationLoading}
              >
                📧 1 día antes
              </button>

              <button
                className="calendar-export-btn"
                onClick={handleCalendarExport}
                disabled={calendarLoading}
              >
                📅 Agregar al calendario
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="event-reminder-manager">
      <div className="reminder-header">
        <h3>🔔 Recordatorios y Calendario</h3>
        <p>Configura recordatorios y exporta eventos a tu calendario</p>
      </div>

      <div className="reminder-tabs">
        <button
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendario
        </button>
        <button
          className={`tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          🔔 Recordatorios
        </button>
      </div>

      <div className="reminder-content">
        {activeTab === 'calendar' && (
          <div className="calendar-tab">
            <div className="calendar-options">
              <h4>Exportar a calendario</h4>

              <div className="provider-selection">
                <label>
                  <input
                    type="radio"
                    value="auto"
                    checked={calendarProvider === 'auto'}
                    onChange={(e) => setCalendarProvider(e.target.value)}
                  />
                  Automático (recomendado)
                </label>

                <label>
                  <input
                    type="radio"
                    value="google"
                    checked={calendarProvider === 'google'}
                    onChange={(e) => setCalendarProvider(e.target.value)}
                  />
                  Google Calendar
                  {!isGoogleSignedIn && (
                    <button
                      className="google-signin-btn"
                      onClick={handleGoogleSignIn}
                    >
                      Conectar
                    </button>
                  )}
                </label>

                <label>
                  <input
                    type="radio"
                    value="ical"
                    checked={calendarProvider === 'ical'}
                    onChange={(e) => setCalendarProvider(e.target.value)}
                  />
                  Archivo iCal (descarga)
                </label>
              </div>

              <button
                className="export-btn"
                onClick={handleCalendarExport}
                disabled={calendarLoading}
              >
                {calendarLoading ? 'Exportando...' : '📅 Exportar Evento'}
              </button>
            </div>

            {servicesStatus.calendar && (
              <div className="calendar-status">
                <h5>Estado de servicios:</h5>
                <div className="status-item">
                  <span>Google Calendar:</span>
                  <span className={servicesStatus.calendar.googleCalendar ? 'available' : 'unavailable'}>
                    {servicesStatus.calendar.googleCalendar ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <div className="status-item">
                  <span>iCal:</span>
                  <span className="available">Disponible</span>
                </div>
                <div className="status-item">
                  <span>Autenticado:</span>
                  <span className={isGoogleSignedIn ? 'available' : 'unavailable'}>
                    {isGoogleSignedIn ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="reminders-tab">
            <div className="reminder-config">
              <h4>Configurar recordatorio</h4>

              <div className="reminder-type">
                <label>
                  <input
                    type="radio"
                    value="scheduled"
                    checked={reminderSettings.type === 'scheduled'}
                    onChange={(e) => handleReminderSettingChange('type', e.target.value)}
                  />
                  ⏰ Programado
                </label>

                <label>
                  <input
                    type="radio"
                    value="location"
                    checked={reminderSettings.type === 'location'}
                    onChange={(e) => handleReminderSettingChange('type', e.target.value)}
                  />
                  📍 Basado en ubicación
                </label>

                <label>
                  <input
                    type="radio"
                    value="email"
                    checked={reminderSettings.type === 'email'}
                    onChange={(e) => handleReminderSettingChange('type', e.target.value)}
                  />
                  📧 Email
                </label>
              </div>

              {reminderSettings.type === 'scheduled' && (
                <div className="time-config">
                  <label>
                    Tiempo antes del evento:
                    <select
                      value={reminderSettings.value}
                      onChange={(e) => handleReminderSettingChange('value', parseInt(e.target.value))}
                    >
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="120">2 horas</option>
                      <option value="360">6 horas</option>
                      <option value="720">12 horas</option>
                      <option value="1440">1 día</option>
                      <option value="2880">2 días</option>
                      <option value="10080">1 semana</option>
                    </select>
                  </label>
                </div>
              )}

              {reminderSettings.type === 'location' && (
                <div className="location-config">
                  <p>Recibirás una notificación cuando estés cerca del venue</p>
                  <label>
                    Radio de activación:
                    <select
                      value={reminderSettings.radius || 5}
                      onChange={(e) => handleReminderSettingChange('radius', parseInt(e.target.value))}
                    >
                      <option value="1">1 km</option>
                      <option value="2">2 km</option>
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="20">20 km</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="reminder-options">
                <label>
                  <input
                    type="checkbox"
                    checked={reminderSettings.includeRoute}
                    onChange={(e) => handleReminderSettingChange('includeRoute', e.target.checked)}
                  />
                  Incluir información de ruta en la notificación
                </label>
              </div>

              {reminderSettings.routeInfo && (
                <div className="route-preview">
                  <h5>Información de ruta incluida:</h5>
                  <p>🚗 {reminderSettings.routeInfo.duration} • 📏 {reminderSettings.routeInfo.distance}</p>
                </div>
              )}

              <button
                className="create-reminder-btn"
                onClick={handleCreateReminder}
                disabled={notificationLoading}
              >
                {notificationLoading ? 'Creando...' : '🔔 Crear Recordatorio'}
              </button>
            </div>

            {servicesStatus.notifications && (
              <div className="notifications-status">
                <h5>Estado de notificaciones:</h5>
                <div className="status-item">
                  <span>Push soportadas:</span>
                  <span className={servicesStatus.notifications.pushSupported ? 'available' : 'unavailable'}>
                    {servicesStatus.notifications.pushSupported ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="status-item">
                  <span>Permiso concedido:</span>
                  <span className={servicesStatus.notifications.pushGranted ? 'available' : 'unavailable'}>
                    {servicesStatus.notifications.pushGranted ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="status-item">
                  <span>Recordatorios activos:</span>
                  <span>{servicesStatus.notifications.activeReminders}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventReminderManager;