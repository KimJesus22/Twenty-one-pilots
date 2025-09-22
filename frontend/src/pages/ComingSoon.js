import React from 'react';
import './ComingSoon.css';

const ComingSoon = ({ title, description, features = [] }) => {
  return (
    <div className="coming-soon">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <span>🚧</span>
        </div>

        <h1>{title || 'Próximamente'}</h1>

        <p className="coming-soon-description">
          {description || 'Esta funcionalidad está en desarrollo y estará disponible próximamente.'}
        </p>

        {features.length > 0 && (
          <div className="coming-soon-features">
            <h3>Características planeadas:</h3>
            <ul>
              {features.map((feature, index) => (
                <li key={index}>
                  <span className="feature-icon">✨</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="coming-soon-actions">
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            ← Volver
          </button>
          <a
            href="/"
            className="btn btn-primary"
          >
            Ir al Inicio
          </a>
        </div>

        <div className="coming-soon-footer">
          <p>¡Mantente atento para más actualizaciones!</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;