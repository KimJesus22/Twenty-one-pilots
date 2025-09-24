import React, { useState } from 'react';
import EventSocialHub from './EventSocialHub';
import EventReminderManager from './EventReminderManager';
import EventMapAdvanced from './EventMapAdvanced';
import './EventSocialIntegrationExample.css';

const EventSocialIntegrationExample = () => {
  // Estado para eventos de ejemplo
  const [events] = useState([
    {
      _id: 'event_social_001',
      title: 'Twenty One Pilots - The Bandito Tour',
      artist: 'Twenty One Pilots',
      date: new Date('2024-09-15T20:00:00'),
      venue: {
        name: 'Arena Ciudad de México',
        address: 'Av. Río Churubusco 601, Ciudad de México',
        city: 'Ciudad de México',
        state: 'CDMX',
        country: 'México',
        coordinates: { latitude: 19.4067, longitude: -99.1436 }
      },
      type: 'concert',
      description: 'Concierto principal de la gira The Bandito Tour con Tyler y Josh. ¡No te lo pierdas!',
      price: { min: 850, max: 2500, currency: 'MXN' },
      ticketing: {
        enabled: true,
        provider: 'ticketmaster'
      },
      popularity: 95,
      image: '/images/top-concert.jpg'
    },
    {
      _id: 'event_social_002',
      title: 'Lollapalooza México 2024',
      artist: 'Multiple Artists',
      date: new Date('2024-09-20T12:00:00'),
      venue: {
        name: 'Parque Bicentenario',
        address: 'Av. Constituyentes 1000, Zapopan',
        city: 'Zapopan',
        state: 'Jalisco',
        country: 'México',
        coordinates: { latitude: 20.6797, longitude: -103.3475 }
      },
      type: 'festival',
      description: 'Festival de música con múltiples artistas internacionales en un ambiente increíble.',
      price: { min: 1200, max: 4500, currency: 'MXN' },
      ticketing: {
        enabled: true,
        provider: 'lollapalooza'
      },
      popularity: 88,
      image: '/images/lollapalooza.jpg'
    }
  ]);

  const [selectedEvent, setSelectedEvent] = useState(events[0]);
  const [userLocation, setUserLocation] = useState(null);
  const [activeView, setActiveView] = useState('social'); // 'social', 'map', 'reminders'
  const [user] = useState({
    id: 'user_123',
    name: 'Ana García',
    email: 'ana@example.com'
  });

  // Callbacks para eventos sociales
  const handleAttendanceChange = (attendance) => {
    console.log('Asistencia cambiada:', attendance);
    // Aquí iría la lógica para actualizar la UI o enviar notificaciones
  };

  const handleGroupJoin = (group) => {
    console.log('Usuario se unió a grupo:', group);
    // Aquí iría la lógica para actualizar la UI
  };

  const handlePostCreate = (post) => {
    console.log('Nueva publicación creada:', post);
    // Aquí iría la lógica para actualizar el feed
  };

  // Callbacks para recordatorios
  const handleReminderCreated = (reminder) => {
    console.log('Recordatorio creado:', reminder);
    // Mostrar notificación de éxito
    alert(`¡Recordatorio programado! Te notificaremos ${new Date(reminder.scheduledTime).toLocaleString('es-ES')}`);
  };

  const handleCalendarExported = (exportResult) => {
    console.log('Evento exportado:', exportResult);
    if (exportResult.success) {
      alert(`Evento exportado exitosamente a ${exportResult.provider === 'google' ? 'Google Calendar' : 'archivo iCal'}`);
    } else {
      alert('Error exportando evento');
    }
  };

  // Obtener ubicación del usuario
  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log('Ubicación obtenida:', position.coords);
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

  // Manejar selección de asientos (simulado)
  const handleSeatSelect = (seat) => {
    console.log('Asiento seleccionado:', seat);
    // Aquí iría la lógica para manejar selección de asientos
  };

  return (
    <div className="social-integration-example">
      <div className="example-header">
        <h1>🎵 Comunidad y Eventos Sociales</h1>
        <p>
          Sistema completo de interacción social para eventos de música:
          asistencia, grupos, publicaciones, mapas y recordatorios integrados.
        </p>
      </div>

      <div className="example-controls">
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

        <button
          className="location-btn"
          onClick={handleGetUserLocation}
        >
          📍 Mi ubicación
        </button>

        <div className="view-selector">
          <label>Vista:</label>
          <div className="view-buttons">
            <button
              className={activeView === 'social' ? 'active' : ''}
              onClick={() => setActiveView('social')}
            >
              👥 Social
            </button>
            <button
              className={activeView === 'map' ? 'active' : ''}
              onClick={() => setActiveView('map')}
            >
              🗺️ Mapa
            </button>
            <button
              className={activeView === 'reminders' ? 'active' : ''}
              onClick={() => setActiveView('reminders')}
            >
              🔔 Recordatorios
            </button>
          </div>
        </div>
      </div>

      <div className="integration-content">
        {/* Vista Social */}
        {activeView === 'social' && (
          <div className="social-view">
            <div className="event-info-card">
              <div className="event-header">
                <div className="event-image">
                  <img src={selectedEvent.image || '/images/default-event.jpg'} alt={selectedEvent.title} />
                </div>
                <div className="event-details">
                  <h2>{selectedEvent.title}</h2>
                  <div className="event-meta">
                    <span className="artist">🎤 {selectedEvent.artist}</span>
                    <span className="date">📅 {selectedEvent.date.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                    <span className="venue">📍 {selectedEvent.venue.name}, {selectedEvent.venue.city}</span>
                    <span className="price">💰 ${selectedEvent.price.min} - ${selectedEvent.price.max} {selectedEvent.price.currency}</span>
                  </div>
                </div>
              </div>

              <div className="event-description">
                <h3>Descripción del evento</h3>
                <p>{selectedEvent.description}</p>
              </div>
            </div>

            <EventSocialHub
              event={selectedEvent}
              user={user}
              userLocation={userLocation}
              onAttendanceChange={handleAttendanceChange}
              onGroupJoin={handleGroupJoin}
              onPostCreate={handlePostCreate}
            />
          </div>
        )}

        {/* Vista de Mapa */}
        {activeView === 'map' && (
          <div className="map-view">
            <div className="map-header">
              <h2>🗺️ Mapa Interactivo</h2>
              <p>Encuentra el venue, planifica tu ruta y selecciona asientos</p>
            </div>

            <EventMapAdvanced
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={handleEventSelect}
              userLocation={userLocation}
              height="600px"
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

            {/* Información adicional del mapa */}
            <div className="map-info">
              <div className="info-section">
                <h3>🚗 Información de Ruta</h3>
                {userLocation ? (
                  <p>Calculando ruta desde tu ubicación actual...</p>
                ) : (
                  <p>Haz clic en "Mi ubicación" para calcular rutas personalizadas</p>
                )}
              </div>

              <div className="info-section">
                <h3>♿ Accesibilidad</h3>
                <p>El mapa muestra información de accesibilidad y rutas alternativas</p>
              </div>

              <div className="info-section">
                <h3>🎫 Selección de Asientos</h3>
                <p>Para eventos con ticketing, puedes seleccionar asientos directamente en el mapa</p>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Recordatorios */}
        {activeView === 'reminders' && (
          <div className="reminders-view">
            <div className="reminders-header">
              <h2>🔔 Gestor de Recordatorios</h2>
              <p>Configura recordatorios y exporta eventos a tu calendario</p>
            </div>

            <EventReminderManager
              event={selectedEvent}
              userLocation={userLocation}
              onReminderCreated={handleReminderCreated}
              onCalendarExported={handleCalendarExported}
            />

            {/* Consejos de recordatorios */}
            <div className="reminders-tips">
              <h3>💡 Consejos para Recordatorios</h3>
              <div className="tips-grid">
                <div className="tip-card">
                  <h4>⏰ Recordatorios Temporales</h4>
                  <p>Configura alertas minutos, horas o días antes del evento</p>
                </div>

                <div className="tip-card">
                  <h4>📍 Basados en Ubicación</h4>
                  <p>Recibe notificaciones cuando estés cerca del venue</p>
                </div>

                <div className="tip-card">
                  <h4>📅 Calendario Integrado</h4>
                  <p>Exporta eventos directamente a Google Calendar o iCal</p>
                </div>

                <div className="tip-card">
                  <h4>🚗 Información de Ruta</h4>
                  <p>Incluye tiempo de viaje y distancia en las notificaciones</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Información técnica */}
      <div className="technical-overview">
        <h2>🔧 Integración Técnica Completa</h2>
        <div className="tech-features">
          <div className="feature-category">
            <h3>👥 Funcionalidades Sociales</h3>
            <ul>
              <li>✅ Asistencia a eventos (Voy/Interesado/No voy)</li>
              <li>✅ Creación de grupos para ir juntos</li>
              <li>✅ Publicaciones y fotos después de eventos</li>
              <li>✅ Sistema de reacciones y comentarios</li>
              <li>✅ Estadísticas de engagement</li>
            </ul>
          </div>

          <div className="feature-category">
            <h3>🗺️ Mapas y Navegación</h3>
            <ul>
              <li>✅ Google Maps con rutas en tiempo real</li>
              <li>✅ Selección visual de asientos</li>
              <li>✅ Información de accesibilidad</li>
              <li>✅ Múltiples modos de transporte</li>
              <li>✅ Modo offline básico</li>
            </ul>
          </div>

          <div className="feature-category">
            <h3>🔔 Recordatorios y Calendarios</h3>
            <ul>
              <li>✅ Recordatorios programados y por ubicación</li>
              <li>✅ Exportación a Google Calendar e iCal</li>
              <li>✅ Notificaciones push y email</li>
              <li>✅ Información de rutas integrada</li>
              <li>✅ Preferencias personalizables</li>
            </ul>
          </div>

          <div className="feature-category">
            <h3>📱 Experiencia Móvil</h3>
            <ul>
              <li>✅ Diseño responsive completo</li>
              <li>✅ Modo compacto para móviles</li>
              <li>✅ Accesibilidad WCAG 2.1 AA</li>
              <li>✅ Soporte para modo oscuro</li>
              <li>✅ Optimización de batería</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo interactiva */}
      <div className="demo-section">
        <h2>🎮 Demo Interactiva</h2>
        <div className="demo-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Selecciona un evento</h3>
              <p>Elige entre diferentes conciertos y festivales</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Marca tu asistencia</h3>
              <p>Indica si vas a ir, te interesa o no puedes asistir</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Únete a un grupo</h3>
              <p>Conecta con otros fans para ir juntos al evento</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Planifica tu viaje</h3>
              <p>Usa el mapa para ver rutas y seleccionar asientos</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h3>Configura recordatorios</h3>
              <p>Programa alertas y exporta a tu calendario</p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">6</div>
            <div className="step-content">
              <h3>Comparte experiencias</h3>
              <p>Publica fotos y comentarios después del evento</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSocialIntegrationExample;