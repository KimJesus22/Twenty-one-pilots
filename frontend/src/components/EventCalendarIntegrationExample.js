import React, { useState } from 'react';
import EventMapAdvanced from './EventMapAdvanced';
import EventReminderManager from './EventReminderManager';
import './EventCalendarIntegrationExample.css';

const EventCalendarIntegrationExample = () => {
  // Estado para eventos de ejemplo
  const [events] = useState([
    {
      _id: 'event_001',
      title: 'Twenty One Pilots - The Bandito Tour',
      artist: 'Twenty One Pilots',
      date: new Date('2024-09-15T20:00:00'),
      venue: {
        name: 'Arena Ciudad de México',
        address: 'Av. Río Churubusco 601',
        city: 'Ciudad de México',
        state: 'CDMX',
        country: 'México',
        coordinates: { latitude: 19.4067, longitude: -99.1436 }
      },
      type: 'concert',
      description: 'Concierto principal de la gira The Bandito Tour con Tyler y Josh.',
      price: { min: 850, max: 2500, currency: 'MXN' },
      ticketing: {
        enabled: true,
        provider: 'ticketmaster'
      },
      popularity: 95
    },
    {
      _id: 'event_002',
      title: 'Lollapalooza México 2024',
      artist: 'Multiple Artists',
      date: new Date('2024-09-20T12:00:00'),
      venue: {
        name: 'Parque Bicentenario',
        address: 'Av. Constituyentes 1000',
        city: 'Zapopan',
        state: 'Jalisco',
        country: 'México',
        coordinates: { latitude: 20.6797, longitude: -103.3475 }
      },
      type: 'festival',
      description: 'Festival de música con múltiples artistas internacionales.',
      price: { min: 1200, max: 4500, currency: 'MXN' },
      ticketing: {
        enabled: true,
        provider: 'lollapalooza'
      },
      popularity: 88
    }
  ]);

  const [selectedEvent, setSelectedEvent] = useState(events[0]);
  const [userLocation, setUserLocation] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [calendarExports, setCalendarExports] = useState([]);

  // Obtener ubicación del usuario
  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          // Ubicación por defecto (Centro de CDMX)
          setUserLocation({ lat: 19.4326, lng: -99.1332 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  };

  // Manejar selección de evento
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    console.log('Evento seleccionado:', event);
  };

  // Manejar creación de recordatorio
  const handleReminderCreated = (reminderResult) => {
    setReminders(prev => [...prev, {
      id: reminderResult.reminderId,
      event: selectedEvent,
      scheduledTime: reminderResult.scheduledTime,
      createdAt: new Date()
    }]);
    console.log('Recordatorio creado:', reminderResult);
  };

  // Manejar exportación a calendario
  const handleCalendarExported = (exportResult) => {
    setCalendarExports(prev => [...prev, {
      event: selectedEvent,
      provider: exportResult.provider,
      exportedAt: new Date(),
      link: exportResult.htmlLink
    }]);
    console.log('Evento exportado:', exportResult);
  };

  // Manejar selección de asientos (simulado)
  const handleSeatSelect = (seat) => {
    console.log('Asiento seleccionado:', seat);
    // Aquí iría la lógica para manejar selección de asientos
  };

  return (
    <div className="calendar-integration-example">
      <div className="example-header">
        <h1>🎵 Integración Completa: Calendario y Recordatorios</h1>
        <p>
          Sistema completo de gestión de eventos con mapas interactivos,
          exportación a calendarios y recordatorios inteligentes.
        </p>
      </div>

      <div className="example-controls">
        <button
          className="location-btn"
          onClick={handleGetUserLocation}
        >
          📍 Obtener mi ubicación
        </button>

        <div className="event-selector">
          <label>Seleccionar evento:</label>
          <select
            value={selectedEvent?._id || ''}
            onChange={(e) => {
              const event = events.find(ev => ev._id === e.target.value);
              setSelectedEvent(event);
            }}
          >
            {events.map(event => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="integration-content">
        {/* Mapa Avanzado */}
        <div className="map-section">
          <h2>🗺️ Mapa Interactivo Avanzado</h2>
          <EventMapAdvanced
            events={events}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
            userLocation={userLocation}
            height="500px"
            apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            showTraffic={true}
            transportMode="driving"
            venueLayout={selectedEvent?.ticketing?.enabled ? {
              sections: [
                {
                  id: 'VIP',
                  name: 'VIP',
                  type: 'seated',
                  capacity: 100,
                  price: { min: 1500, max: 1500, currency: 'MXN' }
                },
                {
                  id: 'GENERAL',
                  name: 'General',
                  type: 'seated',
                  capacity: 500,
                  price: { min: 500, max: 500, currency: 'MXN' }
                }
              ]
            } : null}
            selectedSeats={[]}
            onSeatSelect={handleSeatSelect}
            showAccessibility={true}
            accessibilityNeeds={['wheelchair', 'visual']}
            enableNotifications={true}
            enableOffline={true}
          />
        </div>

        {/* Gestor de Recordatorios */}
        <div className="reminder-section">
          <h2>🔔 Gestor de Recordatorios</h2>
          <EventReminderManager
            event={selectedEvent}
            userLocation={userLocation}
            onReminderCreated={handleReminderCreated}
            onCalendarExported={handleCalendarExported}
          />
        </div>
      </div>

      {/* Información del evento seleccionado */}
      {selectedEvent && (
        <div className="event-details">
          <h2>📋 Detalles del Evento</h2>
          <div className="event-card">
            <div className="event-header">
              <h3>{selectedEvent.title}</h3>
              <span className="event-type">{selectedEvent.type}</span>
            </div>

            <div className="event-info">
              <div className="info-item">
                <span className="label">🎤 Artista:</span>
                <span className="value">{selectedEvent.artist}</span>
              </div>

              <div className="info-item">
                <span className="label">📅 Fecha:</span>
                <span className="value">
                  {selectedEvent.date.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="info-item">
                <span className="label">📍 Venue:</span>
                <span className="value">{selectedEvent.venue.name}</span>
              </div>

              <div className="info-item">
                <span className="label">🏙️ Ubicación:</span>
                <span className="value">
                  {selectedEvent.venue.city}, {selectedEvent.venue.state}
                </span>
              </div>

              {selectedEvent.price && (
                <div className="info-item">
                  <span className="label">💰 Precio:</span>
                  <span className="value">
                    ${selectedEvent.price.min} - ${selectedEvent.price.max} {selectedEvent.price.currency}
                  </span>
                </div>
              )}

              <div className="info-item">
                <span className="label">⭐ Popularidad:</span>
                <span className="value">{selectedEvent.popularity}/100</span>
              </div>
            </div>

            {selectedEvent.description && (
              <div className="event-description">
                <h4>📝 Descripción</h4>
                <p>{selectedEvent.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial de actividades */}
      <div className="activity-history">
        <h2>📊 Historial de Actividades</h2>

        {reminders.length > 0 && (
          <div className="history-section">
            <h3>🔔 Recordatorios Creados</h3>
            <div className="history-list">
              {reminders.map((reminder, index) => (
                <div key={index} className="history-item">
                  <div className="history-icon">⏰</div>
                  <div className="history-content">
                    <div className="history-title">
                      Recordatorio para {reminder.event.title}
                    </div>
                    <div className="history-meta">
                      Programado: {reminder.scheduledTime.toLocaleString('es-ES')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {calendarExports.length > 0 && (
          <div className="history-section">
            <h3>📅 Eventos Exportados</h3>
            <div className="history-list">
              {calendarExports.map((exportItem, index) => (
                <div key={index} className="history-item">
                  <div className="history-icon">📅</div>
                  <div className="history-content">
                    <div className="history-title">
                      {exportItem.event.title} exportado
                    </div>
                    <div className="history-meta">
                      Proveedor: {exportItem.provider} • {exportItem.exportedAt.toLocaleString('es-ES')}
                    </div>
                    {exportItem.link && (
                      <a
                        href={exportItem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="history-link"
                      >
                        Ver en calendario →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reminders.length === 0 && calendarExports.length === 0 && (
          <div className="no-activity">
            <p>📝 No hay actividades registradas aún.</p>
            <p>¡Crea recordatorios y exporta eventos para ver el historial!</p>
          </div>
        )}
      </div>

      {/* Información técnica */}
      <div className="technical-info">
        <h2>🔧 Información Técnica</h2>
        <div className="tech-grid">
          <div className="tech-item">
            <h4>🗺️ EventMapAdvanced</h4>
            <ul>
              <li>✅ Google Maps API Integration</li>
              <li>✅ Rutas en tiempo real con tráfico</li>
              <li>✅ Selección visual de asientos</li>
              <li>✅ Verificación de accesibilidad</li>
              <li>✅ Notificaciones push</li>
              <li>✅ Modo offline</li>
            </ul>
          </div>

          <div className="tech-item">
            <h4>📅 CalendarService</h4>
            <ul>
              <li>✅ Google Calendar API</li>
              <li>✅ Exportación iCal</li>
              <li>✅ Eventos con recordatorios</li>
              <li>✅ Zonas horarias automáticas</li>
              <li>✅ Metadatos completos</li>
            </ul>
          </div>

          <div className="tech-item">
            <h4>🔔 NotificationService</h4>
            <ul>
              <li>✅ Notificaciones push</li>
              <li>✅ Recordatorios programados</li>
              <li>✅ Basados en ubicación</li>
              <li>✅ Notificaciones email</li>
              <li>✅ Información de rutas</li>
            </ul>
          </div>

          <div className="tech-item">
            <h4>🎨 EventReminderManager</h4>
            <ul>
              <li>✅ Interfaz unificada</li>
              <li>✅ Modo compacto</li>
              <li>✅ Configuración avanzada</li>
              <li>✅ Diseño responsive</li>
              <li>✅ Accesibilidad WCAG</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendarIntegrationExample;