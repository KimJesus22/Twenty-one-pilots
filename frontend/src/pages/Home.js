import React, { useEffect, useState } from 'react';
import './Home.css';

const Home = () => {
  const [stats, setStats] = useState({
    albums: 0,
    songs: 0,
    videos: 0,
    users: 0
  });

  useEffect(() => {
    // Simular carga de estadísticas
    const loadStats = async () => {
      try {
        // En un futuro, esto vendría de la API
        setStats({
          albums: 7,
          songs: 120,
          videos: 85,
          users: 15420
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section
        className="hero"
        aria-labelledby="hero-title"
      >
        <div className="hero-overlay" aria-hidden="true"></div>
        <div className="hero-content">
          <h1
            id="hero-title"
            className="hero-title"
          >
            <span className="hero-title-main">Twenty One Pilots</span>
            <span className="hero-title-sub">Fan Experience</span>
          </h1>
          <p
            className="hero-description"
            aria-describedby="hero-description"
          >
            Sumérgete en el universo musical de Twenty One Pilots.
            Explora su discografía completa, descubre videos exclusivos,
            encuentra conciertos próximos y conecta con una comunidad apasionada.
          </p>
          <div
            className="hero-buttons"
            role="group"
            aria-label="Acciones principales"
          >
            <button
              className="btn btn-primary btn-large"
              onClick={() => scrollToSection('features')}
              aria-describedby="explore-description"
            >
              Explorar Ahora
            </button>
            <span id="explore-description" className="sr-only">
              Navegar a la sección de características principales
            </span>
            <button
              className="btn btn-secondary btn-large"
              onClick={() => window.open('http://34.51.90.100/api-docs', '_blank')}
              aria-describedby="api-description"
            >
              Ver API Docs
            </button>
            <span id="api-description" className="sr-only">
              Abrir documentación de la API en una nueva ventana
            </span>
          </div>
        </div>
        <div
          className="hero-scroll"
          aria-label="Indicador de desplazamiento"
        >
          <span aria-hidden="true">Desplázate para explorar</span>
          <div className="scroll-arrow" aria-hidden="true">↓</div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{stats.albums}</div>
              <div className="stat-label">Álbumes</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.songs}+</div>
              <div className="stat-label">Canciones</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.videos}+</div>
              <div className="stat-label">Videos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.users.toLocaleString()}</div>
              <div className="stat-label">Fans Activos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Descubre Todo Sobre Twenty One Pilots</h2>
            <p>Una experiencia completa para los fans más apasionados</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎵</div>
              <h3>Discografía Completa</h3>
              <p>Accede a todos los álbumes, canciones y letras de Twenty One Pilots. Desde sus inicios hasta sus últimos lanzamientos.</p>
              <a href="/discography" className="feature-link">Explorar Discografía →</a>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Videos Oficiales</h3>
              <p>Mira videos musicales, conciertos en vivo, detrás de cámaras y contenido exclusivo directamente desde YouTube.</p>
              <a href="/videos" className="feature-link">Ver Videos →</a>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎪</div>
              <h3>Conciertos y Eventos</h3>
              <p>Encuentra fechas de conciertos próximos, mapas interactivos de venues y reseñas de shows anteriores.</p>
              <a href="/concerts" className="feature-link">Buscar Conciertos →</a>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Comunidad de Fans</h3>
              <p>Únete al foro, comparte tus playlists favoritas, conecta con otros fans y participa en discusiones apasionadas.</p>
              <a href="/forum" className="feature-link">Unirse a la Comunidad →</a>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎧</div>
              <h3>Playlists Personalizadas</h3>
              <p>Crea y comparte playlists temáticas, descubre nuevas canciones y guarda tus tracks favoritos.</p>
              <a href="/playlists" className="feature-link">Crear Playlist →</a>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛍️</div>
              <h3>Tienda Oficial</h3>
              <p>Compra merch oficial, discos, camisetas y artículos exclusivos de Twenty One Pilots.</p>
              <a href="/store" className="feature-link">Ir a la Tienda →</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>¿Listo para la Experiencia Completa?</h2>
            <p>Únete a miles de fans que ya están explorando el universo de Twenty One Pilots</p>
            <div className="cta-buttons">
              <a href="/discography" className="btn btn-primary btn-large">
                Comenzar Ahora
              </a>
              <a href="http://20.81.227.69/api-docs" target="_blank" className="btn btn-secondary btn-large">
                Documentación API
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Twenty One Pilots Fan App</h3>
              <p>La experiencia definitiva para fans</p>
            </div>

            <div className="footer-links">
              <div className="footer-section">
                <h4>Explorar</h4>
                <ul>
                  <li><a href="/discography">Discografía</a></li>
                  <li><a href="/videos">Videos</a></li>
                  <li><a href="/concerts">Conciertos</a></li>
                  <li><a href="/forum">Foro</a></li>
                </ul>
              </div>

              <div className="footer-section">
                <h4>Comunidad</h4>
                <ul>
                  <li><a href="/playlists">Playlists</a></li>
                  <li><a href="/store">Tienda</a></li>
                  <li><a href="http://20.81.227.69/api-docs" target="_blank">API Docs</a></li>
                </ul>
              </div>

              <div className="footer-section">
                <h4>Conectar</h4>
                <ul>
                  <li><a href="https://github.com" target="_blank">GitHub</a></li>
                  <li><a href="http://20.81.227.69/api-docs" target="_blank">Swagger</a></li>
                  <li><span>Desarrollado con ❤️</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Twenty One Pilots Fan App. Todos los derechos reservados.</p>
            <p>Esta es una aplicación de fans no oficial. Twenty One Pilots® es una marca registrada.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;