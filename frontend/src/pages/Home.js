import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero">
        <h1>Twenty One Pilots</h1>
        <p>Explora la discografía, videos, conciertos y conecta con la comunidad de fans.</p>
      </div>
      <div className="features">
        <div className="feature-card">
          <h3>Discografía</h3>
          <p>Descubre todos los álbumes y canciones de Twenty One Pilots.</p>
        </div>
        <div className="feature-card">
          <h3>Videos</h3>
          <p>Mira los mejores videos musicales y contenido oficial.</p>
        </div>
        <div className="feature-card">
          <h3>Conciertos</h3>
          <p>Encuentra fechas de conciertos y eventos próximos.</p>
        </div>
        <div className="feature-card">
          <h3>Comunidad</h3>
          <p>Únete al foro de fans y comparte tus playlists.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;