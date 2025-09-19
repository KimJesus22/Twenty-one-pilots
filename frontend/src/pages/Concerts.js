import React, { useEffect, useState } from 'react';
import './Concerts.css';

const Concerts = () => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Twenty One Pilots');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchConcerts();
  }, [searchQuery, location]);

  const fetchConcerts = async () => {
    try {
      setLoading(true);

      // Intentar conectar con el backend
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          ...(location && { location })
        });

        const response = await fetch(`http://localhost:5000/api/concerts/search?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setConcerts(data || []);
        setError(null);
      } catch (backendError) {
        console.warn('Backend no disponible, usando datos mock:', backendError.message);

        // Datos mock si el backend no está disponible
        const mockConcerts = [
          {
            id: '1',
            name: { text: 'Twenty One Pilots - The Icy Tour' },
            description: { text: 'Concierto de Twenty One Pilots en el estadio más grande de la ciudad.' },
            start: { local: '2024-12-15T20:00:00' },
            venue: {
              name: 'Estadio Azteca',
              address: { city: 'Ciudad de México' }
            },
            is_free: false,
            url: 'https://example.com/event/1'
          },
          {
            id: '2',
            name: { text: 'Twenty One Pilots - Intimate Session' },
            description: { text: 'Sesión íntima acústica con Tyler y Josh.' },
            start: { local: '2024-11-20T19:30:00' },
            venue: {
              name: 'Teatro Metropolitan',
              address: { city: 'Ciudad de México' }
            },
            is_free: false,
            url: 'https://example.com/event/2'
          },
          {
            id: '3',
            name: { text: 'Twenty One Pilots - Fan Meet & Greet' },
            description: { text: 'Encuentro exclusivo con fans y sesión de preguntas.' },
            start: { local: '2024-10-25T18:00:00' },
            venue: {
              name: 'Centro Cultural',
              address: { city: 'Guadalajara' }
            },
            is_free: true,
            url: 'https://example.com/event/3'
          }
        ];

        setConcerts(mockConcerts);
        setError(null);
      }
    } catch (err) {
      console.error('Error cargando conciertos:', err);
      setError('Error al cargar los conciertos. Revisa la conexión con el backend.');
    } finally {
      setLoading(false);
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

  const getConcertStatus = (startDate) => {
    const now = new Date();
    const concertDate = new Date(startDate);

    if (concertDate < now) {
      return { text: 'Finalizado', class: 'status-past' };
    } else if (concertDate.toDateString() === now.toDateString()) {
      return { text: 'Hoy', class: 'status-today' };
    } else {
      return { text: 'Próximo', class: 'status-upcoming' };
    }
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
        <p>Encuentra fechas de conciertos y eventos próximos</p>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conciertos..."
            className="search-input"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ubicación (opcional)"
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>
      </div>

      <div className="concerts-grid">
        {concerts.length === 0 ? (
          <div className="no-concerts">
            <h3>No se encontraron conciertos</h3>
            <p>Intenta con una búsqueda diferente o ubicación.</p>
          </div>
        ) : (
          concerts.map(concert => {
            const status = getConcertStatus(concert.start.local);
            return (
              <div key={concert.id} className="concert-card">
                <div className="concert-header">
                  <span className={`status-badge ${status.class}`}>
                    {status.text}
                  </span>
                  {concert.logo && (
                    <img
                      src={concert.logo.url}
                      alt={concert.name.text}
                      className="concert-image"
                    />
                  )}
                </div>

                <div className="concert-info">
                  <h3 className="concert-title">{concert.name.text}</h3>
                  <p className="concert-description">
                    {concert.description?.text?.substring(0, 150)}...
                  </p>

                  <div className="concert-details">
                    <div className="detail-item">
                      <span className="detail-label">📅 Fecha:</span>
                      <span>{formatDate(concert.start.local)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">🕐 Hora:</span>
                      <span>{formatTime(concert.start.local)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">📍 Lugar:</span>
                      <span>{concert.venue?.name || 'Por confirmar'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">🏙 Ciudad:</span>
                      <span>{concert.venue?.address?.city || 'Por confirmar'}</span>
                    </div>
                  </div>

                  <div className="concert-footer">
                    <div className="price-info">
                      {concert.is_free ? (
                        <span className="free-event">Gratuito</span>
                      ) : (
                        <span className="paid-event">Pago</span>
                      )}
                    </div>
                    <a
                      href={concert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      Ver Detalles
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Concerts;