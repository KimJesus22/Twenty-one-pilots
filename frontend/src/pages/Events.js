import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import eventsAPI from '../api/events';
import EventMap from '../components/EventMap';
import AdvancedFilters from '../components/AdvancedFilters';
import AudioPlayer from '../components/AudioPlayer';
import Spinner from '../components/Spinner';
import './Events.css';

const Events = () => {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map', 'list', 'calendar'
  const [eventStats, setEventStats] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    sort: 'date',
    order: 'asc',
    search: '',
    genre: 'all',
    type: 'all',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    isFree: '',
    maxDistance: '',
    city: '',
    country: ''
  });

  // Géneros y tipos disponibles
  const [genres] = useState(['rock', 'alternative', 'indie', 'pop', 'electronic', 'other']);
  const [types] = useState(['concert', 'festival', 'album-release', 'tour', 'special-event']);

  useEffect(() => {
    fetchEvents();
    fetchEventStats();
    getUserLocation();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvents(filters);

      if (response.success) {
        setEvents(response.data.events);
        setError(null);
      } else {
        throw new Error(response.message || 'Error cargando eventos');
      }
    } catch (err) {
      console.error('Error cargando eventos:', err);
      setError(err.message);
      // Fallback a datos mock
      setEvents([
        {
          _id: '1',
          title: 'Twenty One Pilots - The Bandito Tour',
          artist: 'Twenty One Pilots',
          date: new Date('2024-08-15T20:00:00'),
          venue: {
            name: 'Madison Square Garden',
            address: '4 Pennsylvania Plaza',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            coordinates: { latitude: 40.7505, longitude: -73.9934 }
          },
          genre: 'alternative',
          type: 'concert',
          price: { min: 75, max: 250, currency: 'USD' },
          isFree: false,
          capacity: 20000,
          popularity: 95,
          views: 50000,
          likes: [],
          attending: [],
          image: null,
          status: 'upcoming'
        },
        {
          _id: '2',
          title: 'Lollapalooza 2024',
          artist: 'Multiple Artists',
          date: new Date('2024-08-03T12:00:00'),
          endDate: new Date('2024-08-05T23:00:00'),
          venue: {
            name: 'Grant Park',
            address: '337 E Randolph St',
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
            coordinates: { latitude: 41.8781, longitude: -87.6298 }
          },
          genre: 'rock',
          type: 'festival',
          price: { min: 150, max: 400, currency: 'USD' },
          isFree: false,
          capacity: 100000,
          popularity: 88,
          views: 75000,
          likes: [],
          attending: [],
          image: null,
          status: 'upcoming'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStats = async () => {
    try {
      const response = await eventsAPI.getEventStats();
      if (response.success) {
        setEventStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching event stats:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Aplicar filtros locales
    if (filters.search) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.artist.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.venue.city.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.genre !== 'all') {
      filtered = filtered.filter(event => event.genre === filters.genre);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(event => event.type === filters.type);
    }

    if (filters.isFree === 'true') {
      filtered = filtered.filter(event => event.isFree);
    }

    if (filters.city) {
      filtered = filtered.filter(event =>
        event.venue.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.country) {
      filtered = filtered.filter(event =>
        event.venue.country.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[filters.sort];
      let bValue = b[filters.sort];

      if (filters.sort === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (filters.order === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    setFilteredEvents(filtered);
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
  };

  const handleBuyTickets = (event) => {
    if (event.ticketUrl) {
      window.open(event.ticketUrl, '_blank');
    } else if (event.eventbriteId) {
      window.open(`https://www.eventbrite.com/e/${event.eventbriteId}`, '_blank');
    } else {
      alert('Compra de entradas próximamente disponible');
    }
  };

  const handleAddToCalendar = async (event) => {
    try {
      // Intentar Google Calendar primero
      const response = await eventsAPI.getCalendarLink(event._id);
      if (response.success) {
        window.open(response.data.calendarLink, '_blank');
      }
    } catch (error) {
      console.error('Error obteniendo calendar link:', error);
      // Fallback a iCalendar
      try {
        await eventsAPI.downloadICalendar(event._id);
      } catch (icalError) {
        console.error('Error descargando iCalendar:', icalError);
        alert('Error agregando a calendario');
      }
    }
  };

  const handleToggleLike = async (event) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para dar like');
      return;
    }

    try {
      const response = await eventsAPI.toggleEventLike(event._id, user._id);
      if (response.success) {
        // Actualizar el evento en la lista
        setEvents(prev => prev.map(e =>
          e._id === event._id
            ? { ...e, likes: response.data.isLiked
                ? [...(e.likes || []), user._id]
                : (e.likes || []).filter(id => id !== user._id) }
            : e
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleToggleAttendance = async (event) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para confirmar asistencia');
      return;
    }

    try {
      const response = await eventsAPI.toggleAttendance(event._id, user._id);
      if (response.success) {
        setEvents(prev => prev.map(e =>
          e._id === event._id
            ? { ...e, attending: response.data.isAttending
                ? [...(e.attending || []), user._id]
                : (e.attending || []).filter(id => id !== user._id) }
            : e
        ));
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  };

  const handlePlayRelatedMusic = (event) => {
    if (event.spotifyPlaylist) {
      window.open(event.spotifyPlaylist, '_blank');
    } else if (event.youtubeVideo) {
      window.open(event.youtubeVideo, '_blank');
    } else {
      alert('Música relacionada próximamente disponible');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="events">
        <div className="loading">
          <Spinner />
          <p>Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events">
      <div className="events-header">
        <h1>Eventos Musicales</h1>
        <p>Descubre conciertos, festivales y eventos musicales cerca de ti</p>

        {/* Estadísticas */}
        {eventStats && (
          <div className="events-stats">
            <div className="stat-card">
              <div className="stat-number">{eventStats.totalEvents || 0}</div>
              <div className="stat-label">Eventos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{eventStats.totalViews?.toLocaleString() || 0}</div>
              <div className="stat-label">Vistas</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{eventStats.totalAttending?.toLocaleString() || 0}</div>
              <div className="stat-label">Asistirán</div>
            </div>
          </div>
        )}
      </div>

      <div className="events-controls">
        <div className="view-mode-selector">
          <button
            className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            🗺️ Mapa
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 Lista
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendario
          </button>
        </div>
      </div>

      <div className="events-content">
        {/* Filtros */}
        <div className="events-sidebar">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            genres={genres}
            types={types}
            showAdvanced={true}
          />
        </div>

        {/* Contenido principal */}
        <div className="events-main">
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={fetchEvents} className="btn btn-primary">
                Reintentar
              </button>
            </div>
          )}

          {viewMode === 'map' && (
            <div className="map-view">
              <EventMap
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
                userLocation={userLocation}
                height="600px"
              />
            </div>
          )}

          {viewMode === 'list' && (
            <div className="list-view">
              {filteredEvents.length === 0 ? (
                <div className="no-events">
                  <h3>No se encontraron eventos</h3>
                  <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="events-list">
                  {filteredEvents.map(event => (
                    <div key={event._id} className="event-card">
                      <div className="event-image">
                        {event.image ? (
                          <img src={event.image} alt={event.title} />
                        ) : (
                          <div className="no-image">🎵</div>
                        )}
                      </div>

                      <div className="event-info">
                        <div className="event-header">
                          <h3>{event.title}</h3>
                          <span className={`event-type ${event.type}`}>
                            {event.type.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>

                        <p className="event-artist">🎤 {event.artist}</p>
                        <p className="event-date">📅 {formatDate(event.date)}</p>
                        <p className="event-venue">📍 {event.venue.name}, {event.venue.city}</p>
                        <p className="event-price">💰 {formatPrice(event)}</p>

                        <div className="event-stats">
                          <span>👁️ {event.views || 0}</span>
                          <span>❤️ {event.likes?.length || 0}</span>
                          <span>👥 {event.attending?.length || 0}</span>
                        </div>
                      </div>

                      <div className="event-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEventSelect(event)}
                        >
                          Ver detalles
                        </button>

                        <button
                          className="btn btn-success"
                          onClick={() => handleBuyTickets(event)}
                          disabled={event.soldOut}
                        >
                          {event.soldOut ? 'Agotado' : 'Comprar entradas'}
                        </button>

                        {isAuthenticated && (
                          <>
                            <button
                              className={`btn ${event.likes?.includes(user._id) ? 'btn-liked' : 'btn-secondary'}`}
                              onClick={() => handleToggleLike(event)}
                            >
                              {event.likes?.includes(user._id) ? '❤️' : '🤍'}
                            </button>

                            <button
                              className={`btn ${event.attending?.includes(user._id) ? 'btn-attending' : 'btn-secondary'}`}
                              onClick={() => handleToggleAttendance(event)}
                            >
                              {event.attending?.includes(user._id) ? '✅ Asistiré' : '👥 Asistir'}
                            </button>
                          </>
                        )}

                        <button
                          className="btn btn-secondary"
                          onClick={() => handleAddToCalendar(event)}
                        >
                          📅 Agregar a calendario
                        </button>

                        {(event.spotifyPlaylist || event.youtubeVideo) && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handlePlayRelatedMusic(event)}
                          >
                            🎵 Música relacionada
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === 'calendar' && (
            <div className="calendar-view">
              <div className="coming-soon">
                <h3>📅 Vista de Calendario</h3>
                <p>Próximamente disponible - Organiza tus eventos por fecha</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles del evento */}
      {selectedEvent && (
        <div className="event-detail-modal">
          <div className="modal-overlay" onClick={() => setSelectedEvent(null)}></div>
          <div className="modal-content">
            <div className="event-detail">
              <div className="event-detail-header">
                <div className="event-image-large">
                  {selectedEvent.image ? (
                    <img src={selectedEvent.image} alt={selectedEvent.title} />
                  ) : (
                    <div className="no-image-large">🎵</div>
                  )}
                </div>

                <div className="event-info-detailed">
                  <h2>{selectedEvent.title}</h2>
                  <p className="event-artist-large">🎤 {selectedEvent.artist}</p>
                  <p className="event-date-large">📅 {formatDate(selectedEvent.date)}</p>
                  <p className="event-venue-large">📍 {selectedEvent.venue.name}, {selectedEvent.venue.address}, {selectedEvent.venue.city}</p>
                  <p className="event-price-large">💰 {formatPrice(selectedEvent)}</p>

                  <div className="event-stats-large">
                    <span>👁️ {selectedEvent.views || 0} vistas</span>
                    <span>❤️ {selectedEvent.likes?.length || 0} likes</span>
                    <span>👥 {selectedEvent.attending?.length || 0} asistirán</span>
                  </div>
                </div>
              </div>

              <div className="event-description">
                <h3>Descripción</h3>
                <p>{selectedEvent.description || 'Sin descripción disponible'}</p>
              </div>

              <div className="event-actions-large">
                <button
                  className="btn btn-success btn-large"
                  onClick={() => handleBuyTickets(selectedEvent)}
                  disabled={selectedEvent.soldOut}
                >
                  {selectedEvent.soldOut ? '🎫 Agotado' : '🎫 Comprar Entradas'}
                </button>

                <button
                  className="btn btn-primary btn-large"
                  onClick={() => handleAddToCalendar(selectedEvent)}
                >
                  📅 Agregar a Calendario
                </button>

                {(selectedEvent.spotifyPlaylist || selectedEvent.youtubeVideo) && (
                  <button
                    className="btn btn-secondary btn-large"
                    onClick={() => handlePlayRelatedMusic(selectedEvent)}
                  >
                    🎵 Música Relacionada
                  </button>
                )}
              </div>

              <button
                className="close-modal-btn"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reproductor de música relacionado */}
      {currentSong && (
        <AudioPlayer
          song={currentSong}
          onClose={() => {
            setCurrentSong(null);
            setCurrentPlaylist(null);
          }}
          onNext={() => {
            if (currentPlaylist) {
              const currentIndex = currentPlaylist.songs.findIndex(s => s._id === currentSong._id);
              const nextIndex = (currentIndex + 1) % currentPlaylist.songs.length;
              setCurrentSong(currentPlaylist.songs[nextIndex]);
            }
          }}
          onPrevious={() => {
            if (currentPlaylist) {
              const currentIndex = currentPlaylist.songs.findIndex(s => s._id === currentSong._id);
              const prevIndex = currentIndex === 0 ? currentPlaylist.songs.length - 1 : currentIndex - 1;
              setCurrentSong(currentPlaylist.songs[prevIndex]);
            }
          }}
          hasNext={currentPlaylist && currentPlaylist.songs.length > 1}
          hasPrevious={currentPlaylist && currentPlaylist.songs.length > 1}
        />
      )}
    </div>
  );
};

export default Events;