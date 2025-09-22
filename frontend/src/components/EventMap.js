import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './EventMap.css';

// Iconos personalizados para marcadores
const createCustomIcon = (eventType, isSelected = false) => {
  const colors = {
    concert: '#1db954',
    festival: '#ff6b35',
    'album-release': '#9b59b6',
    tour: '#e74c3c',
    'special-event': '#f39c12'
  };

  const color = colors[eventType] || '#3498db';

  return L.divIcon({
    className: 'custom-event-marker',
    html: `
      <div style="
        background-color: ${color};
        border: 3px solid ${isSelected ? '#fff' : '#333'};
        border-radius: 50%;
        width: ${isSelected ? '24px' : '20px'};
        height: ${isSelected ? '24px' : '20px'};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${isSelected ? '12px' : '10px'};
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      ">
        🎵
      </div>
    `,
    iconSize: [isSelected ? 30 : 26, isSelected ? 30 : 26],
    iconAnchor: [isSelected ? 15 : 13, isSelected ? 15 : 13],
    popupAnchor: [0, -15]
  });
};

// Componente para centrar el mapa
function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

const EventMap = ({
  events = [],
  selectedEvent = null,
  onEventSelect,
  userLocation = null,
  height = '400px',
  showUserLocation = true
}) => {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // NYC por defecto
  const [mapZoom, setMapZoom] = useState(10);
  const [userMarker, setUserMarker] = useState(null);
  const mapRef = useRef(null);

  // Centrar mapa en eventos o ubicación del usuario
  useEffect(() => {
    if (events.length > 0) {
      // Calcular centro basado en eventos
      const latitudes = events.map(e => e.venue.coordinates.latitude);
      const longitudes = events.map(e => e.venue.coordinates.longitude);

      const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
      const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

      setMapCenter([avgLat, avgLng]);
      setMapZoom(events.length === 1 ? 12 : 8);
    } else if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setMapZoom(12);
    }
  }, [events, userLocation]);

  // Centrar en evento seleccionado
  useEffect(() => {
    if (selectedEvent) {
      const { latitude, longitude } = selectedEvent.venue.coordinates;
      setMapCenter([latitude, longitude]);
      setMapZoom(14);
    }
  }, [selectedEvent]);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserMarker({ latitude, longitude });
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [showUserLocation]);

  const formatEventDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (event) => {
    if (event.isFree) return 'Gratis';
    if (event.price.min === event.price.max) {
      return `$${event.price.min} ${event.price.currency}`;
    }
    return `$${event.price.min} - $${event.price.max} ${event.price.currency}`;
  };

  const getDistanceText = (event) => {
    if (!userMarker) return '';

    const distance = calculateDistance(
      userMarker.latitude,
      userMarker.longitude,
      event.venue.coordinates.latitude,
      event.venue.coordinates.longitude
    );

    return distance < 1
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`;
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="event-map-container" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} zoom={mapZoom} />

        {/* Marcador de ubicación del usuario */}
        {userMarker && showUserLocation && (
          <Marker
            position={[userMarker.latitude, userMarker.longitude]}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `
                <div style="
                  background-color: #3498db;
                  border: 3px solid white;
                  border-radius: 50%;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 12px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">
                  📍
                </div>
              `,
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            })}
          >
            <Popup>
              <div className="user-location-popup">
                <strong>Tu ubicación</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de eventos */}
        {events.map((event) => (
          <Marker
            key={event._id}
            position={[
              event.venue.coordinates.latitude,
              event.venue.coordinates.longitude
            ]}
            icon={createCustomIcon(event.type, selectedEvent?._id === event._id)}
            eventHandlers={{
              click: () => onEventSelect && onEventSelect(event)
            }}
          >
            <Popup>
              <div className="event-popup">
                <div className="event-popup-header">
                  <h4>{event.title}</h4>
                  <span className={`event-type-badge ${event.type}`}>
                    {event.type.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="event-popup-info">
                  <p><strong>🎤</strong> {event.artist}</p>
                  <p><strong>📅</strong> {formatEventDate(event.date)}</p>
                  <p><strong>📍</strong> {event.venue.name}, {event.venue.city}</p>
                  <p><strong>💰</strong> {formatPrice(event)}</p>

                  {userMarker && (
                    <p><strong>📏</strong> {getDistanceText(event)} de distancia</p>
                  )}

                  {event.popularity && (
                    <div className="event-popularity">
                      <span>⭐ Popularidad: {event.popularity}/100</span>
                    </div>
                  )}
                </div>

                <div className="event-popup-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onEventSelect && onEventSelect(event)}
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Leyenda del mapa */}
      <div className="map-legend">
        <h5>Tipos de evento:</h5>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#1db954' }}></div>
            <span>Concierto</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff6b35' }}></div>
            <span>Festival</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#9b59b6' }}></div>
            <span>Lanzamiento</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#e74c3c' }}></div>
            <span>Gira</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f39c12' }}></div>
            <span>Especial</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventMap;