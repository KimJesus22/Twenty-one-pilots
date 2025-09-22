import React, { useState } from 'react';
import { useAccessibilityPreferences } from '../hooks/useAccessibility';
import './AccessibilityPanel.css';

const AccessibilityPanel = ({ isOpen, onClose }) => {
  const {
    preferences,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    toggleScreenReader
  } = useAccessibilityPreferences();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="accessibility-panel-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
      aria-describedby="accessibility-description"
    >
      <div
        className="accessibility-panel"
        onClick={(e) => e.stopPropagation()}
        role="region"
        aria-labelledby="accessibility-title"
      >
        <div className="accessibility-header">
          <h2 id="accessibility-title">Configuración de Accesibilidad</h2>
          <p id="accessibility-description">
            Personaliza la aplicación según tus necesidades de accesibilidad
          </p>
          <button
            className="accessibility-close"
            onClick={onClose}
            aria-label="Cerrar panel de accesibilidad"
            data-close
          >
            ✕
          </button>
        </div>

        <div className="accessibility-content">
          <div className="accessibility-section">
            <h3>Preferencias Visuales</h3>

            <div className="accessibility-option">
              <label className="accessibility-toggle">
                <input
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={toggleHighContrast}
                  aria-describedby="high-contrast-desc"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Alto Contraste</span>
              </label>
              <p id="high-contrast-desc" className="option-description">
                Mejora el contraste entre texto y fondo para mejor legibilidad
              </p>
            </div>

            <div className="accessibility-option">
              <label className="accessibility-toggle">
                <input
                  type="checkbox"
                  checked={preferences.reducedMotion}
                  onChange={toggleReducedMotion}
                  aria-describedby="reduced-motion-desc"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Reducir Movimiento</span>
              </label>
              <p id="reduced-motion-desc" className="option-description">
                Minimiza animaciones y transiciones para evitar mareos
              </p>
            </div>

            <div className="accessibility-option">
              <label className="accessibility-toggle">
                <input
                  type="checkbox"
                  checked={preferences.largeText}
                  onChange={toggleLargeText}
                  aria-describedby="large-text-desc"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Texto Grande</span>
              </label>
              <p id="large-text-desc" className="option-description">
                Aumenta el tamaño del texto en toda la aplicación
              </p>
            </div>
          </div>

          <div className="accessibility-section">
            <h3>Asistencia Técnica</h3>

            <div className="accessibility-option">
              <label className="accessibility-toggle">
                <input
                  type="checkbox"
                  checked={preferences.screenReader}
                  onChange={toggleScreenReader}
                  aria-describedby="screen-reader-desc"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Modo Lector de Pantalla</span>
              </label>
              <p id="screen-reader-desc" className="option-description">
                Optimiza la navegación para usuarios de lectores de pantalla
              </p>
            </div>
          </div>

          <div className="accessibility-section">
            <h3>Información de Accesibilidad</h3>
            <div className="accessibility-info">
              <p>
                Esta aplicación cumple con las pautas WCAG 2.1 AA para accesibilidad web.
                Para más información sobre nuestras características de accesibilidad:
              </p>
              <ul>
                <li>Navegación completa por teclado</li>
                <li>Soporte para lectores de pantalla</li>
                <li>Contraste de colores optimizado</li>
                <li>Textos alternativos en imágenes</li>
                <li>Formularios accesibles con validación clara</li>
              </ul>
            </div>
          </div>

          <div className="accessibility-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls="advanced-options"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'} Opciones Avanzadas
            </button>

            {isExpanded && (
              <div id="advanced-options" className="advanced-options">
                <h4>Accesos Directos de Teclado</h4>
                <dl className="keyboard-shortcuts">
                  <dt>Tab</dt>
                  <dd>Navegar entre elementos interactivos</dd>
                  <dt>Shift + Tab</dt>
                  <dd>Navegar hacia atrás</dd>
                  <dt>Enter / Espacio</dt>
                  <dd>Activar botones y enlaces</dd>
                  <dt>Escape</dt>
                  <dd>Cerrar menús y modales</dd>
                  <dt>Alt + A</dt>
                  <dd>Abrir panel de accesibilidad</dd>
                </dl>

                <h4>Compatibilidad</h4>
                <ul>
                  <li>Navegadores modernos (Chrome, Firefox, Safari, Edge)</li>
                  <li>Lectores de pantalla (NVDA, JAWS, VoiceOver)</li>
                  <li>Dispositivos móviles y tablets</li>
                  <li>Teclados alternativos y switches</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="accessibility-footer">
          <p>
            ¿Necesitas ayuda adicional?{' '}
            <a href="/support" aria-label="Contactar soporte técnico">
              Contacta nuestro soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;