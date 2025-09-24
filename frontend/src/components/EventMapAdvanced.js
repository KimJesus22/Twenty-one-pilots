import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Map, Marker, InfoWindow, DirectionsService, DirectionsRenderer, TrafficLayer } from '@googlemaps/react-wrapper';
import mapService from '../services/mapService';
import './EventMapAdvanced.css';

// Componente de renderizado del mapa
const MapComponent = ({
  center,
  zoom,
  events,
  selectedEvent,
  userLocation,
  onEventSelect,
  route,
  onRouteCalculated,
  showTraffic,
  transportMode,
  onMapClick,
  venueLayout,
  selectedSeats,
  onSeatSelect,
  showAccessibility
}) => {
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Calcular ruta cuando cambie el evento seleccionado o modo de transporte
  useEffect(() => {
    if (map && selectedEvent && userLocation && transportMode) {
      // Usar el servicio de mapas para calcular la ruta
      const origin = userLocation;
      const destination = {
        latitude: selectedEvent.venue.coordinates.latitude,
        longitude: selectedEvent.venue.coordinates.longitude
      };

      // Esta lógica se moverá al componente padre
      // Por ahora, mantener la implementación básica
      const directionsService = new google.maps.DirectionsService();

      const request = {
        origin: origin,
        destination: {
          lat: destination.latitude,
          lng: destination.longitude
        },
        travelMode: google.maps.TravelMode[transportMode.toUpperCase()],
        drivingOptions: transportMode === 'driving' ? {
          departureTime: new Date(),
          trafficModel: 'bestguess'
        } : undefined,
        transitOptions: transportMode === 'transit' ? {
          departureTime: new Date(),
          modes: ['BUS', 'RAIL', 'SUBWAY', 'TRAIN', 'TRAM']
        } : undefined,
        provideRouteAlternatives: true
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          setDirectionsResponse(result);
          onRouteCalculated && onRouteCalculated(result);
        } else {
          console.error('Error calculating directions:', status);
        }
      });
    }
  }, [map, selectedEvent, userLocation, transportMode, onRouteCalculated]);

  const handleMarkerClick = (event) => {
    setSelectedMarker(event);
    onEventSelect && onEventSelect(event);
  };

  const handleSeatClick = (seat) => {
    onSeatSelect && onSeatSelect(seat);
  };

  return (
    <div className="advanced-map-container">
      <Map
        mapId="advanced-event-map"
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        onClick={onMapClick}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={true}
        scaleControl={true}
        streetViewControl={true}
        rotateControl={true}
        fullscreenControl={true}
      >
        {/* Capa de tráfico */}
        {showTraffic && <TrafficLayer />}

        {/* Marcador de ubicación del usuario */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#3498db" stroke="white" stroke-width="3"/>
                  <circle cx="20" cy="20" r="8" fill="white"/>
                  <circle cx="20" cy="20" r="4" fill="#3498db"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40)
            }}
            title="Tu ubicación"
          />
        )}

        {/* Marcadores de eventos */}
        {events.map((event) => (
          <Marker
            key={event._id}
            position={{
              lat: event.venue.coordinates.latitude,
              lng: event.venue.coordinates.longitude
            }}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="${getEventColor(event.type)}" stroke="white" stroke-width="3"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🎵</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 32)
            }}
            onClick={() => handleMarkerClick(event)}
          />
        ))}

        {/* Renderizar ruta */}
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              polylineOptions: {
                strokeColor: '#ff6b6b',
                strokeWeight: 5,
                strokeOpacity: 0.8
              },
              suppressMarkers: true
            }}
          />
        )}

        {/* Layout de asientos para venues con ticketing */}
        {venueLayout && selectedEvent && venueLayout.sections?.map((section) => (
          <VenueSectionOverlay
            key={section.id}
            section={section}
            venue={selectedEvent.venue}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatClick}
            showAccessibility={showAccessibility}
          />
        ))}

        {/* InfoWindow para evento seleccionado */}
        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.venue.coordinates.latitude,
              lng: selectedMarker.venue.coordinates.longitude
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <EventInfoWindow
              event={selectedMarker}
              route={route}
              transportMode={transportMode}
            />
          </InfoWindow>
        )}
      </Map>
    </div>
  );
};

// Componente para superponer layout de venue
const VenueSectionOverlay = ({ section, venue, selectedSeats, onSeatSelect, showAccessibility }) => {
  // Esta es una simplificación - en producción necesitarías coordenadas precisas
  const bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(venue.coordinates.latitude - 0.001, venue.coordinates.longitude - 0.001),
    new google.maps.LatLng(venue.coordinates.latitude + 0.001, venue.coordinates.longitude + 0.001)
  );

  return (
    <div className="venue-overlay">
      {/* Aquí iría la lógica para renderizar asientos como overlays en el mapa */}
    </div>
  );
};

// Componente InfoWindow personalizado
const EventInfoWindow = ({ event, route, transportMode }) => {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDistance = (meters) => {
    const km = meters / 1000;
    return km < 1 ? `${Math.round(meters)}m` : `${km.toFixed(1)}km`;
  };

  return (
    <div className="event-info-window">
      <h3>{event.title}</h3>
      <p><strong>🎤</strong> {event.artist}</p>
      <p><strong>📅</strong> {new Date(event.date).toLocaleDateString('es-ES')}</p>
      <p><strong>📍</strong> {event.venue.name}, {event.venue.city}</p>

      {route && (
        <div className="route-info">
          <h4>📍 Cómo llegar ({transportMode})</h4>
          <p><strong>Distancia:</strong> {formatDistance(route.distance?.value || 0)}</p>
          <p><strong>Tiempo:</strong> {formatDuration(route.duration?.value || 0)}</p>
          {route.duration_in_traffic && (
            <p><strong>Con tráfico:</strong> {formatDuration(route.duration_in_traffic.value)}</p>
          )}
        </div>
      )}

      <div className="event-actions">
        <button className="btn btn-primary">Ver detalles</button>
        {event.ticketing?.enabled && (
          <button className="btn btn-success">Comprar tickets</button>
        )}
      </div>
    </div>
  );
};

// Función auxiliar para colores de eventos
const getEventColor = (type) => {
  const colors = {
    concert: '#1db954',
    festival: '#ff6b35',
    'album-release': '#9b59b6',
    tour: '#e74c3c',
    'special-event': '#f39c12'
  };
  return colors[type] || '#3498db';
};

// Función auxiliar para iconos de transporte público
const getTransitIcon = (mode) => {
  const icons = {
    BUS: '🚌',
    RAIL: '🚆',
    SUBWAY: '🚇',
    TRAIN: '🚂',
    TRAM: '🚊',
    WALKING: '🚶'
  };
  return icons[mode] || '🚇';
};

// Componente principal EventMapAdvanced
const EventMapAdvanced = ({
  events = [],
  selectedEvent = null,
  onEventSelect,
  userLocation: initialUserLocation = null,
  height = '600px',
  apiKey,
  showTraffic: initialShowTraffic = false,
  transportMode: initialTransportMode = 'driving',
  onRouteCalculated,
  venueLayout = null,
  selectedSeats = [],
  onSeatSelect,
  showAccessibility: initialShowAccessibility = false,
  enableOffline = false,
  accessibilityNeeds = [],
  enableNotifications = false
}) => {
  const [mapCenter, setMapCenter] = useState({ lat: 19.4326, lng: -99.1332 }); // CDMX por defecto
  const [mapZoom, setMapZoom] = useState(10);
  const [route, setRoute] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mapError, setMapError] = useState(null);
  const [showTraffic, setShowTraffic] = useState(initialShowTraffic);
  const [transportMode, setTransportMode] = useState(initialTransportMode);
  const [showAccessibility, setShowAccessibility] = useState(initialShowAccessibility);
  const [userLocation, setUserLocation] = useState(initialUserLocation);
  const [preciseLocation, setPreciseLocation] = useState(null);
  const [locationTracking, setLocationTracking] = useState(false);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [routeAccessibility, setRouteAccessibility] = useState(null);
  const [publicTransportInfo, setPublicTransportInfo] = useState(null);
  const [mapServiceInitialized, setMapServiceInitialized] = useState(false);

  // Inicializar servicio de mapas
  useEffect(() => {
    const initializeMapService = async () => {
      try {
        const success = await mapService.initialize({
          googleMaps: apiKey,
          mapbox: process.env.REACT_APP_MAPBOX_TOKEN
        });

        if (success) {
          setMapServiceInitialized(true);

          // Habilitar notificaciones si se solicita
          if (enableNotifications) {
            await mapService.enableNotifications();
          }

          // Obtener ubicación precisa inicial
          try {
            const location = await mapService.getPreciseLocation();
            setPreciseLocation(location);
            setUserLocation(location);
          } catch (locationError) {
            console.warn('Error getting precise location:', locationError);
          }
        } else {
          setMapError('Error initializing map services');
        }
      } catch (error) {
        console.error('Error initializing map service:', error);
        setMapError(error.message);
      }
    };

    if (apiKey) {
      initializeMapService();
    }

    // Monitorear estado de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mapService.stopLocationTracking();
    };
  }, [apiKey, enableNotifications]);

  // Iniciar/detener seguimiento de ubicación
  useEffect(() => {
    if (locationTracking && mapServiceInitialized) {
      mapService.startLocationTracking();
    } else {
      mapService.stopLocationTracking();
    }

    return () => {
      mapService.stopLocationTracking();
    };
  }, [locationTracking, mapServiceInitialized]);

  // Buscar eventos cercanos cuando cambia la ubicación
  useEffect(() => {
    if (userLocation && events.length > 0) {
      const nearby = events.filter(event => {
        const distance = mapService.calculateDistance(
          userLocation,
          {
            latitude: event.venue.coordinates.latitude,
            longitude: event.venue.coordinates.longitude
          }
        );
        return distance <= 50; // 50km
      });

      setNearbyEvents(nearby);

      // Notificar eventos cercanos
      if (nearby.length > 0 && enableNotifications) {
        mapService.notifyNearbyEvents(nearby);
      }
    }
  }, [userLocation, events, enableNotifications]);

  // Centrar mapa en eventos
  useEffect(() => {
    if (events.length > 0) {
      const avgLat = events.reduce((sum, e) => sum + e.venue.coordinates.latitude, 0) / events.length;
      const avgLng = events.reduce((sum, e) => sum + e.venue.coordinates.longitude, 0) / events.length;

      setMapCenter({ lat: avgLat, lng: avgLng });
      setMapZoom(events.length === 1 ? 15 : 10);
    } else if (userLocation) {
      setMapCenter(userLocation);
      setMapZoom(12);
    }
  }, [events, userLocation]);

  // Centrar en evento seleccionado
  useEffect(() => {
    if (selectedEvent) {
      setMapCenter({
        lat: selectedEvent.venue.coordinates.latitude,
        lng: selectedEvent.venue.coordinates.longitude
      });
      setMapZoom(16);

      // Calcular ruta automáticamente si hay ubicación del usuario
      if (userLocation && mapServiceInitialized) {
        calculateRoute(userLocation, {
          latitude: selectedEvent.venue.coordinates.latitude,
          longitude: selectedEvent.venue.coordinates.longitude
        });
      }
    }
  }, [selectedEvent, userLocation, mapServiceInitialized]);

  // Función para obtener ubicación precisa
  const getPreciseLocation = async () => {
    if (!mapServiceInitialized) return;

    try {
      const location = await mapService.getPreciseLocation();
      setPreciseLocation(location);
      setUserLocation(location);
      setMapCenter({ lat: location.latitude, lng: location.longitude });
      setMapZoom(15);
    } catch (error) {
      console.error('Error getting precise location:', error);
      setMapError('Error obteniendo ubicación precisa');
    }
  };

  // Función para alternar seguimiento de ubicación
  const toggleLocationTracking = () => {
    setLocationTracking(!locationTracking);
  };

  // Calcular ruta usando el servicio de mapas
  const calculateRoute = useCallback(async (origin, destination, mode = transportMode) => {
    if (!mapServiceInitialized) {
      console.warn('Map service not initialized');
      return;
    }

    try {
      let routeResult;

      // Intentar con Google Maps primero
      if (mapService.googleMaps) {
        routeResult = await mapService.calculateRoute(origin, destination, { mode });
      } else if (mapService.mapboxClient) {
        // Fallback a Mapbox
        routeResult = await mapService.calculateRouteMapbox(origin, destination, { mode });
      } else {
        throw new Error('No map service available');
      }

      setRoute(routeResult.routes[0]);

      // Verificar accesibilidad si está habilitada
      if (showAccessibility && accessibilityNeeds.length > 0) {
        const accessibilityCheck = await mapService.checkRouteAccessibility(
          routeResult.routes[0],
          accessibilityNeeds
        );
        setRouteAccessibility(accessibilityCheck);
      }

      // Obtener información de transporte público si es modo transit
      if (mode === 'transit') {
        const transitInfo = await mapService.getPublicTransportInfo(origin, destination);
        setPublicTransportInfo(transitInfo);
      }

      onRouteCalculated && onRouteCalculated(routeResult);
    } catch (error) {
      console.error('Error calculating route:', error);
      setMapError(`Error calculando ruta: ${error.message}`);
    }
  }, [mapServiceInitialized, transportMode, showAccessibility, accessibilityNeeds, onRouteCalculated]);

  const handleRouteCalculated = useCallback((routeData) => {
    setRoute(routeData.routes[0]);
    onRouteCalculated && onRouteCalculated(routeData);
  }, [onRouteCalculated]);

  const handleMapClick = useCallback((event) => {
    // Manejar clics en el mapa para funcionalidades adicionales
    console.log('Map clicked at:', event.latLng.toJSON());
  }, []);

  // Renderizar estado de carga
  const renderLoading = (status) => {
    if (status === Status.LOADING) return <div className="map-loading">Cargando mapa...</div>;
    if (status === Status.FAILURE) return <div className="map-error">Error al cargar el mapa</div>;
    return null;
  };

  // Si está offline y no hay mapas offline habilitados
  if (!isOnline && !enableOffline) {
    return (
      <div className="offline-map-placeholder" style={{ height }}>
        <div className="offline-content">
          <h3>📍 Mapa no disponible</h3>
          <p>Conéctate a internet para ver el mapa interactivo</p>
          <div className="offline-events-list">
            {events.map(event => (
              <div key={event._id} className="offline-event-item">
                <h4>{event.title}</h4>
                <p>{event.venue.name}, {event.venue.city}</p>
                <button onClick={() => onEventSelect(event)}>Ver detalles</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="map-error" style={{ height }}>
        <p>Error: API Key de Google Maps no configurada</p>
      </div>
    );
  }

  return (
    <div className="event-map-advanced" style={{ height }}>
      <Wrapper apiKey={apiKey} render={renderLoading}>
        <MapComponent
          center={mapCenter}
          zoom={mapZoom}
          events={events}
          selectedEvent={selectedEvent}
          userLocation={userLocation}
          onEventSelect={onEventSelect}
          route={route}
          onRouteCalculated={handleRouteCalculated}
          showTraffic={showTraffic}
          transportMode={transportMode}
          onMapClick={handleMapClick}
          venueLayout={venueLayout}
          selectedSeats={selectedSeats}
          onSeatSelect={onSeatSelect}
          showAccessibility={showAccessibility}
        />
      </Wrapper>

      {/* Controles adicionales */}
      <div className="map-controls">
        {/* Controles de ubicación */}
        <div className="location-controls">
          <button
            className="btn-location"
            onClick={getPreciseLocation}
            title="Obtener ubicación precisa"
          >
            📍 GPS
          </button>
          <button
            className={`btn-tracking ${locationTracking ? 'active' : ''}`}
            onClick={toggleLocationTracking}
            title={locationTracking ? 'Detener seguimiento' : 'Iniciar seguimiento'}
          >
            {locationTracking ? '⏸️' : '▶️'} Seguimiento
          </button>
        </div>

        {/* Modos de transporte */}
        <div className="transport-modes">
          <button
            className={transportMode === 'driving' ? 'active' : ''}
            onClick={() => setTransportMode('driving')}
            title="Ruta en auto"
          >
            🚗 Auto
          </button>
          <button
            className={transportMode === 'transit' ? 'active' : ''}
            onClick={() => setTransportMode('transit')}
            title="Transporte público"
          >
            🚇 Público
          </button>
          <button
            className={transportMode === 'walking' ? 'active' : ''}
            onClick={() => setTransportMode('walking')}
            title="Ruta a pie"
          >
            🚶 Caminar
          </button>
          <button
            className={transportMode === 'bicycling' ? 'active' : ''}
            onClick={() => setTransportMode('bicycling')}
            title="Ruta en bicicleta"
          >
            🚴 Bicicleta
          </button>
        </div>

        {/* Opciones del mapa */}
        <div className="map-options">
          <label title="Mostrar información de tráfico en tiempo real">
            <input
              type="checkbox"
              checked={showTraffic}
              onChange={(e) => setShowTraffic(e.target.checked)}
            />
            Tráfico
          </label>

          <label title="Mostrar información de accesibilidad">
            <input
              type="checkbox"
              checked={showAccessibility}
              onChange={(e) => setShowAccessibility(e.target.checked)}
            />
            Accesibilidad
          </label>

          {enableNotifications && (
            <label title="Notificaciones de eventos cercanos">
              <input
                type="checkbox"
                checked={mapService.notificationsEnabled}
                onChange={async (e) => {
                  if (e.target.checked) {
                    await mapService.enableNotifications();
                  }
                }}
              />
              Notificaciones
            </label>
          )}
        </div>

        {/* Información de ubicación */}
        {preciseLocation && (
          <div className="location-info">
            <small>
              Precisión: {Math.round(preciseLocation.accuracy || 0)}m
              {preciseLocation.speed && ` | Velocidad: ${Math.round(preciseLocation.speed * 3.6)}km/h`}
            </small>
          </div>
        )}
      </div>

      {/* Información de ruta */}
      {route && (
        <div className="route-summary">
          <h4>📍 Ruta calculada ({transportMode})</h4>
          <div className="route-details">
            <span>📏 Distancia: {route.legs[0].distance.text}</span>
            <span>⏱️ Duración: {route.legs[0].duration.text}</span>
            {route.legs[0].duration_in_traffic && (
              <span>🚗 Con tráfico: {route.legs[0].duration_in_traffic.text}</span>
            )}
          </div>

          {/* Información de transporte público */}
          {publicTransportInfo && transportMode === 'transit' && (
            <div className="transit-info">
              <h5>🚇 Transporte público</h5>
              <div className="transit-details">
                <span>Salida: {publicTransportInfo.departureTime.toLocaleTimeString('es-ES')}</span>
                <span>Llegada: {publicTransportInfo.arrivalTime.toLocaleTimeString('es-ES')}</span>
              </div>
              <div className="transit-steps">
                {publicTransportInfo.steps.slice(0, 2).map((step, index) => (
                  <div key={index} className="transit-step">
                    <span className="transit-mode">{getTransitIcon(step.mode)}</span>
                    <span>{step.instructions}</span>
                    <small>{step.duration.text}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información de accesibilidad */}
          {routeAccessibility && showAccessibility && (
            <div className={`accessibility-info ${routeAccessibility.accessible ? 'accessible' : 'not-accessible'}`}>
              <h5>♿ Accesibilidad</h5>
              {routeAccessibility.accessible ? (
                <p>✅ Esta ruta es accesible para tus necesidades</p>
              ) : (
                <div>
                  <p>⚠️ Esta ruta puede tener barreras de accesibilidad:</p>
                  <ul>
                    {routeAccessibility.issues.map((issue, index) => (
                      <li key={index} className={`issue-${issue.severity}`}>
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="route-steps">
            <h5>Instrucciones:</h5>
            {route.legs[0].steps.slice(0, 3).map((step, index) => (
              <div key={index} className="route-step">
                <span className="step-number">{index + 1}.</span>
                <span>{step.instructions.replace(/<[^>]*>/g, '')}</span>
                <small className="step-distance">{step.distance.text}</small>
              </div>
            ))}
            {route.legs[0].steps.length > 3 && (
              <div className="route-more">
                ... y {route.legs[0].steps.length - 3} instrucciones más
                <button className="btn-show-more">Ver todas</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información de eventos cercanos */}
      {nearbyEvents.length > 0 && (
        <div className="nearby-events">
          <h4>🎪 Eventos cercanos ({nearbyEvents.length})</h4>
          <div className="nearby-list">
            {nearbyEvents.slice(0, 3).map(event => (
              <div key={event._id} className="nearby-event" onClick={() => onEventSelect(event)}>
                <h5>{event.title}</h5>
                <p>{event.venue.name} - {Math.round(mapService.calculateDistance(
                  userLocation,
                  { latitude: event.venue.coordinates.latitude, longitude: event.venue.coordinates.longitude }
                ))}km</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventMapAdvanced;