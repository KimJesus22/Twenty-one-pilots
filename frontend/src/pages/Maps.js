import React, { useState, useEffect } from 'react';
import { useMaps } from '../hooks/useMaps';
import { useFavorites } from '../hooks/useFavorites';
import './Maps.css';

const Maps = () => {
  const {
    geocodeAddress,
    getNearbyPlaces,
    getNearbyEvents,
    addLocationToFavorites,
    checkLocationFavorite,
    loading,
    error,
    currentLocation,
    nearbyPlaces,
    nearbyEvents,
    topLocations,
    getAutocompleteSuggestions,
    autocompleteSuggestions,
    clearAutocompleteSuggestions,
    isLocationFavorite
  } = useMaps();

  const [searchAddress, setSearchAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-98.5795, 39.8283]); // Centro de EE.UU.
  const [mapZoom, setMapZoom] = useState(4);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [showNearbyEvents, setShowNearbyEvents] = useState(false);
  const [showTopLocations, setShowTopLocations] = useState(true);

  useEffect(() => {
    // Centrar mapa en ubicación del usuario si está disponible
    if (currentLocation) {
      setMapCenter(currentLocation);
      setMapZoom(10);
    }
  }, [currentLocation]);

  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchAddress.trim()) return;

    try {
      const result = await geocodeAddress(searchAddress);
      setSelectedLocation(result);
      setMapCenter(result.coordinates);
      setMapZoom(12);
    } catch (err) {
      console.error('Error geocoding address:', err);
      alert('Error buscando dirección: ' + err.message);
    }
  };

  const handleGetNearbyPlaces = async () => {
    if (!currentLocation) {
      alert('Se necesita tu ubicación para buscar lugares cercanos');
      return;
    }

    try {
      await getNearbyPlaces(currentLocation, { radius: 2000, limit: 20 });
      setShowNearbyPlaces(true);
    } catch (err) {
      console.error('Error getting nearby places:', err);
      alert('Error obteniendo lugares cercanos: ' + err.message);
    }
  };

  const handleGetNearbyEvents = async () => {
    if (!currentLocation) {
      alert('Se necesita tu ubicación para buscar eventos cercanos');
      return;
    }

    try {
      await getNearbyEvents(currentLocation, { radius: 50000, limit: 10 });
      setShowNearbyEvents(true);
    } catch (err) {
      console.error('Error getting nearby events:', err);
      alert('Error obteniendo eventos cercanos: ' + err.message);
    }
  };

  const handleAddToFavorites = async (locationData) => {
    try {
      await addLocationToFavorites({
        locationId: locationData.id || `custom_${Date.now()}`,
        name: locationData.name,
        coordinates: locationData.coordinates,
        type: locationData.type || 'location',
        description: locationData.description || '',
        tags: ['map'],
        notes: `Ubicación encontrada en mapa`
      });
      alert('Ubicación agregada a favoritos');
    } catch (err) {
      console.error('Error adding to favorites:', err);
      alert('Error agregando a favoritos: ' + err.message);
    }
  };

  const handleAddressInputChange = async (e) => {
    const value = e.target.value;
    setSearchAddress(value);

    if (value.length > 2) {
      try {
        await getAutocompleteSuggestions(value, { limit: 5 });
      } catch (err) {
        console.error('Error getting suggestions:', err);
      }
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchAddress(suggestion.placeName || suggestion.text);
    setSelectedLocation({
      address: suggestion.placeName,
      coordinates: suggestion.coordinates
    });
    setMapCenter(suggestion.coordinates);
    setMapZoom(12);
    clearAutocompleteSuggestions();
  };

  return (
    <div className="maps">
      <div className="maps-header">
        <h1>Mapas Interactivos</h1>
        <p>Explora ubicaciones de Twenty One Pilots, encuentra lugares cercanos y eventos</p>
      </div>

      <div className="maps-content">
        {/* Controles del mapa */}
        <div className="maps-controls">
          <div className="search-section">
            <h3>Buscar Dirección</h3>
            <form onSubmit={handleSearchAddress} className="address-form">
              <div className="input-container">
                <input
                  type="text"
                  placeholder="Ingresa una dirección..."
                  value={searchAddress}
                  onChange={handleAddressInputChange}
                  className="address-input"
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {/* Sugerencias de autocompletado */}
              {autocompleteSuggestions.length > 0 && (
                <div className="suggestions-list">
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <strong>{suggestion.text}</strong>
                      <br />
                      <small>{suggestion.placeName}</small>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>

          <div className="actions-section">
            <h3>Acciones</h3>
            <div className="action-buttons">
              <button
                onClick={handleGetNearbyPlaces}
                className="btn btn-secondary"
                disabled={loading || !currentLocation}
              >
                📍 Lugares Cercanos
              </button>

              <button
                onClick={handleGetNearbyEvents}
                className="btn btn-secondary"
                disabled={loading || !currentLocation}
              >
                🎵 Eventos Cercanos
              </button>

              <button
                onClick={() => setShowTopLocations(!showTopLocations)}
                className={`btn ${showTopLocations ? 'btn-primary' : 'btn-secondary'}`}
              >
                🎸 Ubicaciones TOP
              </button>
            </div>
          </div>

          {/* Información de ubicación actual */}
          {currentLocation && (
            <div className="location-info">
              <h4>Tu Ubicación</h4>
              <p>Lat: {currentLocation[1].toFixed(4)}, Lng: {currentLocation[0].toFixed(4)}</p>
            </div>
          )}
        </div>

        {/* Mapa (simulado por ahora) */}
        <div className="map-container">
          <div className="map-placeholder">
            <div className="map-center">
              <p>Centro del mapa: [{mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}]</p>
              <p>Zoom: {mapZoom}</p>
            </div>

            {/* Ubicaciones de TOP */}
            {showTopLocations && topLocations.songLocations && (
              <div className="map-locations">
                <h4>🎵 Lugares en Canciones de TOP</h4>
                {topLocations.songLocations.map((location, index) => (
                  <div key={index} className="location-marker song-location">
                    <strong>{location.name}</strong>
                    <p>{location.description}</p>
                    <small>Canción: {location.song}</small>
                    <button
                      onClick={() => handleAddToFavorites({
                        id: location.id,
                        name: location.name,
                        coordinates: location.coordinates,
                        type: 'song_location',
                        description: location.description
                      })}
                      className="btn btn-small"
                      disabled={isLocationFavorite(location.id)}
                    >
                      {isLocationFavorite(location.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tiendas oficiales */}
            {showTopLocations && topLocations.officialStores && (
              <div className="map-locations">
                <h4>🏪 Tiendas Oficiales</h4>
                {topLocations.officialStores.map((store, index) => (
                  <div key={index} className="location-marker store-location">
                    <strong>{store.name}</strong>
                    <p>{store.address}</p>
                    <button
                      onClick={() => handleAddToFavorites({
                        id: store.id,
                        name: store.name,
                        coordinates: store.coordinates,
                        type: 'store',
                        description: `Tienda oficial: ${store.address}`
                      })}
                      className="btn btn-small"
                      disabled={isLocationFavorite(store.id)}
                    >
                      {isLocationFavorite(store.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Lugares cercanos */}
            {showNearbyPlaces && nearbyPlaces.length > 0 && (
              <div className="map-locations">
                <h4>📍 Lugares Cercanos</h4>
                {nearbyPlaces.slice(0, 10).map((place, index) => (
                  <div key={index} className="location-marker nearby-place">
                    <strong>{place.name}</strong>
                    <p>{place.address}</p>
                    <small>{Math.round(place.distance)}m de distancia</small>
                    <button
                      onClick={() => handleAddToFavorites({
                        id: place.id,
                        name: place.name,
                        coordinates: place.coordinates,
                        type: 'poi',
                        description: place.address
                      })}
                      className="btn btn-small"
                      disabled={isLocationFavorite(place.id)}
                    >
                      {isLocationFavorite(place.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Eventos cercanos */}
            {showNearbyEvents && nearbyEvents.length > 0 && (
              <div className="map-locations">
                <h4>🎵 Conciertos Cercanos</h4>
                {nearbyEvents.map((event, index) => (
                  <div key={index} className="location-marker concert-event">
                    <strong>{event.name}</strong>
                    <p>{event.venue}</p>
                    <small>
                      {new Date(event.date).toLocaleDateString()} - {Math.round(event.distance / 1000)}km
                    </small>
                    <button
                      onClick={() => handleAddToFavorites({
                        id: event.id,
                        name: event.name,
                        coordinates: event.coordinates,
                        type: 'concert',
                        description: `${event.venue} - ${new Date(event.date).toLocaleDateString()}`
                      })}
                      className="btn btn-small"
                      disabled={isLocationFavorite(event.id)}
                    >
                      {isLocationFavorite(event.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Ubicación seleccionada */}
            {selectedLocation && (
              <div className="selected-location">
                <h4>📍 Ubicación Seleccionada</h4>
                <p><strong>{selectedLocation.address}</strong></p>
                <p>Coordenadas: [{selectedLocation.coordinates[0].toFixed(4)}, {selectedLocation.coordinates[1].toFixed(4)}]</p>
                <button
                  onClick={() => handleAddToFavorites({
                    id: `searched_${Date.now()}`,
                    name: selectedLocation.address,
                    coordinates: selectedLocation.coordinates,
                    type: 'searched',
                    description: 'Ubicación buscada'
                  })}
                  className="btn btn-primary"
                >
                  Agregar a Favoritos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="maps-info">
          <div className="info-section">
            <h3>ℹ️ Información</h3>
            <ul>
              <li><strong>Geocoding:</strong> Convierte direcciones en coordenadas</li>
              <li><strong>Reverse Geocoding:</strong> Convierte coordenadas en direcciones</li>
              <li><strong>Lugares Cercanos:</strong> Encuentra POIs alrededor de tu ubicación</li>
              <li><strong>Eventos Cercanos:</strong> Conciertos próximos con notificaciones push</li>
              <li><strong>Ubicaciones TOP:</strong> Lugares mencionados en canciones y tiendas oficiales</li>
              <li><strong>Favoritos:</strong> Guarda ubicaciones para acceder rápidamente</li>
            </ul>
          </div>

          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maps;