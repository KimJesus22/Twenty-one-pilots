import React, { useState } from 'react';
import EventMapAdvanced from './EventMapAdvanced';

// Ejemplo de uso del componente EventMapAdvanced
const EventMapAdvancedExample = () => {
  // Estado para simular datos de eventos
  const [events] = useState([
    {
      _id: '1',
      title: 'Twenty One Pilots - The Bandito Tour',
      artist: 'Twenty One Pilots',
      date: new Date('2024-08-15T20:00:00'),
      venue: {
        name: 'Auditorio Nacional',
        address: 'Paseo de la Reforma 50',
        city: 'Ciudad de México',
        state: 'CDMX',
        country: 'México',
        coordinates: { latitude: 19.4247, longitude: -99.1556 }
      },
      type: 'concert',
      ticketing: {
        enabled: true,
        provider: 'internal'
      },
      popularity: 95
    },
    {
      _id: '2',
      title: 'Lollapalooza 2024',
      artist: 'Multiple Artists',
      date: new Date('2024-08-03T12:00:00'),
      venue: {
        name: 'Parque Bicentenario',
        address: 'Av. Constituyentes 1000',
        city: 'Zapopan',
        state: 'Jalisco',
        country: 'México',
        coordinates: { latitude: 20.6797, longitude: -103.3475 }
      },
      type: 'festival',
      ticketing: {
        enabled: true,
        provider: 'eventbrite'
      },
      popularity: 88
    }
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // API Key de Google Maps (debe configurarse en variables de entorno)
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Manejar selección de evento
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    console.log('Evento seleccionado:', event);
  };

  // Manejar selección de asientos
  const handleSeatSelect = (seat) => {
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.id === seat.id);
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  // Obtener ubicación del usuario
  const getUserLocation = () => {
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
          // Ubicación por defecto (CDMX)
          setUserLocation({ lat: 19.4326, lng: -99.1332 });
        }
      );
    }
  };

  // Layout de ejemplo para venue con ticketing
  const venueLayout = selectedEvent?.ticketing?.enabled ? {
    sections: [
      {
        id: 'VIP',
        name: 'VIP',
        type: 'seated',
        capacity: 50,
        price: { min: 500, max: 500, currency: 'MXN' }
      },
      {
        id: 'GENERAL',
        name: 'General',
        type: 'seated',
        capacity: 200,
        price: { min: 200, max: 200, currency: 'MXN' }
      }
    ]
  } : null;

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <h2>🗺️ EventMap Avanzado - Ejemplo</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button
            onClick={getUserLocation}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📍 Obtener mi ubicación
          </button>

          <button
            onClick={() => setSelectedEvent(events[0])}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🎵 Ver concierto TOP
          </button>

          <button
            onClick={() => setSelectedEvent(events[1])}
            style={{
              background: '#ffc107',
              color: 'black',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🎪 Ver festival
          </button>
        </div>

        {selectedEvent && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <h3>Evento seleccionado: {selectedEvent.title}</h3>
            <p><strong>📅</strong> {selectedEvent.date.toLocaleDateString('es-ES')}</p>
            <p><strong>📍</strong> {selectedEvent.venue.name}, {selectedEvent.venue.city}</p>
            {selectedSeats.length > 0 && (
              <p><strong>🎫 Asientos seleccionados:</strong> {selectedSeats.length}</p>
            )}
          </div>
        )}

        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          <p><strong>Características implementadas:</strong></p>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
            <li>🗺️ Mapa interactivo con Google Maps</li>
            <li>🚗 Rutas en tiempo real con múltiples modos de transporte</li>
            <li>🚦 Información de tráfico en vivo</li>
            <li>♿ Verificación de accesibilidad</li>
            <li>🚇 Información detallada de transporte público</li>
            <li>🎫 Selección de asientos en mapa (para eventos con ticketing)</li>
            <li>📍 Geolocalización precisa</li>
            <li>🔔 Notificaciones push para eventos cercanos</li>
            <li>📱 Diseño responsivo</li>
            <li>🔄 Modo offline con lista básica</li>
          </ul>
        </div>
      </div>

      <EventMapAdvanced
        events={events}
        selectedEvent={selectedEvent}
        onEventSelect={handleEventSelect}
        userLocation={userLocation}
        height="100vh"
        apiKey={googleMapsApiKey}
        showTraffic={true}
        transportMode="driving"
        venueLayout={venueLayout}
        selectedSeats={selectedSeats}
        onSeatSelect={handleSeatSelect}
        showAccessibility={true}
        enableNotifications={true}
        accessibilityNeeds={['wheelchair', 'visual']}
        enableOffline={true}
      />
    </div>
  );
};

export default EventMapAdvancedExample;