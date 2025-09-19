import React, { useEffect, useState } from 'react';
import './Concerts.css';

const Concerts = () => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Twenty One Pilots');
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchConcerts();
    getUserLocation();
  }, [searchQuery]);

  const fetchConcerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/concerts/search?q=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setConcerts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando conciertos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        }
      );
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchConcerts();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
    return (R * c).toFixed(1);
  };

  if (loading) {
    return (
      <div className="concerts">
        <div className="loading">Cargando conciertos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="concerts">
        <div className="error">
          <h2>Error al cargar los conciertos</h2>
          <p>{error}</p>
          <button onClick={fetchConcerts} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="concerts">
      <div className="concerts-header">
        <h1>Conciertos de Twenty One Pilots</h1>
        <p>Encuentra fechas de conciertos próximos y mapas interactivos</p>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conciertos..."
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>
      </div>

      <div className="concerts-content">
        <div className="concerts-list">
          {concerts.length === 0 ? (
            <div className="no-concerts">
              <h3>No se encontraron conciertos</h3>
              <p>Intenta con una búsqueda diferente o revisa más tarde.</p>
            </div>
          ) : (
            concerts.map(concert => (
              <div
                key={concert.id}
                className={`concert-card ${selectedConcert?.id === concert.id ? 'selected' : ''}`}
                onClick={() => setSelectedConcert(concert)}
              >
                <div className="concert-header">
                  <h3>{concert.name}</h3>
                  <span className="concert-date">
                    {formatDate(concert.start.local)}
                  </span>
                </div>

                <div className="concert-details">
                  <div className="concert-venue">
                    <strong>{concert.venue?.name}</strong>
                    <p>{concert.venue?.address?.localized_address_display}</p>
                  </div>

                  <div className="concert-time">
                    <span>🕐 {formatTime(concert.start.local)}</span>
                  </div>

                  {userLocation && concert.venue?.location && (
                    <div className="concert-distance">
                      <span>
                        📍 {calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          concert.venue.location.latitude,
                          concert.venue.location.longitude
                        )} km de distancia
                      </span>
                    </div>
                  )}

                  <div className="concert-price">
                    {concert.is_free ? (
                      <span className="free-event">🎟️ Evento Gratuito</span>
                    ) : (
                      <span>🎫 Ver precios en Eventbrite</span>
                    )}
                  </div>
                </div>

                <div className="concert-actions">
                  <a
                    href={concert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-small"
                  >
                    Comprar Boletos
                  </a>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConcert(concert);
                    }}
                  >
                    Ver en Mapa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="map-container">
          <div className="map-header">
            <h3>Ubicación del Concierto</h3>
            {selectedConcert ? (
              <p>{selectedConcert.venue?.name}</p>
            ) : (
              <p>Selecciona un concierto para ver su ubicación</p>
            )}
          </div>

          <div className="map-placeholder">
            {selectedConcert ? (
              <div className="map-content">
                <div className="map-mock">
                  <div className="map-marker">
                    📍
                  </div>
                  <div className="map-info">
                    <h4>{selectedConcert.venue?.name}</h4>
                    <p>{selectedConcert.venue?.address?.localized_address_display}</p>
                    <p>{formatDate(selectedConcert.start.local)} - {formatTime(selectedConcert.start.local)}</p>
                  </div>
                </div>

                <div className="map-actions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedConcert.venue?.location?.latitude},${selectedConcert.venue?.location?.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    🗺️ Ver en Google Maps
                  </a>
                  <a
                    href={`https://www.waze.com/ul?ll=${selectedConcert.venue?.location?.latitude},${selectedConcert.venue?.location?.longitude}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    🚗 Ruta en Waze
                  </a>
                </div>
              </div>
            ) : (
              <div className="map-empty">
                <div className="map-icon">🗺️</div>
                <p>Haz clic en un concierto para ver su ubicación en el mapa</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Concerts;