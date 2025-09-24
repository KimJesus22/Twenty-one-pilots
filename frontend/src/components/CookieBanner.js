import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAccessibility from '../hooks/useAccessibility';
import './CookieBanner.css';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Siempre true, no se puede desactivar
    analytics: false,
    marketing: false,
    functional: false
  });

  const navigate = useNavigate();
  const {
    announceToScreenReader,
    announceSuccess,
    trapFocus,
    focusRef,
    generateAriaIds
  } = useAccessibility();

  const ids = generateAriaIds('cookie-banner');

  // Verificar si ya se aceptaron las cookies
  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Mostrar banner después de un pequeño delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        announceToScreenReader(
          'Banner de cookies disponible. Use Tab para navegar y Enter para seleccionar opciones.',
          'polite'
        );
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Cargar preferencias guardadas
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setPreferences(savedPreferences);
      } catch (error) {
        console.warn('Error parsing cookie preferences:', error);
      }
    }
  }, [announceToScreenReader]);

  // Trap de foco cuando el modal de preferencias está abierto
  const modalRef = React.useRef(null);
  trapFocus(modalRef, showPreferences);

  const handleAcceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    savePreferences(allPreferences);
    announceSuccess('Todas las cookies aceptadas');
  };

  const handleRejectAll = () => {
    const minimalPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    savePreferences(minimalPreferences);
    announceSuccess('Solo cookies necesarias aceptadas');
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    setShowPreferences(false);
    announceSuccess('Preferencias de cookies guardadas');
  };

  const savePreferences = (prefs) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());

    // Aplicar preferencias (ejemplo básico)
    if (prefs.analytics) {
      // Habilitar Google Analytics u otros
      console.log('Analytics cookies enabled');
    }
    if (prefs.marketing) {
      // Habilitar cookies de marketing
      console.log('Marketing cookies enabled');
    }
    if (prefs.functional) {
      // Habilitar cookies funcionales
      console.log('Functional cookies enabled');
    }

    setIsVisible(false);
  };

  const handlePreferenceChange = (type, value) => {
    if (type === 'necessary') return; // No se puede cambiar

    setPreferences(prev => ({
      ...prev,
      [type]: value
    }));

    announceToScreenReader(
      `${type} cookies ${value ? 'habilitadas' : 'deshabilitadas'}`,
      'polite'
    );
  };

  const handlePrivacyPolicyClick = () => {
    navigate('/privacy-policy');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay para el banner */}
      <div
        className="cookie-banner-overlay"
        aria-hidden="true"
      />

      {/* Banner principal */}
      <div
        ref={focusRef}
        className="cookie-banner"
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.label}
        aria-describedby={ids.help}
        tabIndex="-1"
      >
        <div className="cookie-banner-content">
          <header className="cookie-banner-header">
            <h2 id={ids.label} className="cookie-banner-title">
              🍪 Cookies y Privacidad
            </h2>
            <button
              onClick={() => setIsVisible(false)}
              className="cookie-banner-close"
              aria-label="Cerrar banner de cookies"
              type="button"
            >
              ✕
            </button>
          </header>

          <div id={ids.help} className="cookie-banner-text">
            <p>
              Utilizamos cookies para mejorar tu experiencia en nuestro sitio web.
              Las cookies necesarias son esenciales para el funcionamiento del sitio.
            </p>
            <p>
              Puedes aceptar todas las cookies, rechazar las no necesarias, o
              personalizar tus preferencias.
            </p>
          </div>

          <div className="cookie-banner-actions">
            <button
              onClick={handleAcceptAll}
              className="btn btn-primary cookie-accept-all"
              aria-describedby="accept-all-help"
            >
              Aceptar Todas
            </button>
            <button
              onClick={handleRejectAll}
              className="btn btn-secondary cookie-reject-all"
              aria-describedby="reject-all-help"
            >
              Solo Necesarias
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="btn btn-secondary cookie-customize"
              aria-describedby="customize-help"
            >
              Personalizar
            </button>
          </div>

          <div className="cookie-banner-footer">
            <button
              onClick={handlePrivacyPolicyClick}
              className="cookie-privacy-link"
              aria-label="Ver política de privacidad completa"
            >
              Política de Privacidad
            </button>
          </div>

          {/* Descripciones de ayuda para lectores de pantalla */}
          <div className="sr-only">
            <div id="accept-all-help">
              Acepta todas las categorías de cookies incluyendo analíticas, marketing y funcionales
            </div>
            <div id="reject-all-help">
              Solo acepta cookies estrictamente necesarias para el funcionamiento del sitio
            </div>
            <div id="customize-help">
              Abre un panel para elegir qué tipos de cookies aceptar
            </div>
          </div>
        </div>
      </div>

      {/* Modal de preferencias */}
      {showPreferences && (
        <div
          ref={modalRef}
          className="cookie-preferences-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preferences-title"
          aria-describedby="preferences-description"
        >
          <div className="cookie-preferences-content">
            <header className="cookie-preferences-header">
              <h3 id="preferences-title">Preferencias de Cookies</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="cookie-preferences-close"
                aria-label="Cerrar preferencias de cookies"
                type="button"
              >
                ✕
              </button>
            </header>

            <div id="preferences-description" className="cookie-preferences-intro">
              <p>
                Elige qué tipos de cookies deseas aceptar. Las cookies necesarias
                son requeridas para el funcionamiento básico del sitio.
              </p>
            </div>

            <div className="cookie-preferences-list">
              {/* Cookies Necesarias */}
              <div className="cookie-preference-item">
                <div className="cookie-preference-header">
                  <h4>Cookies Necesarias</h4>
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                    aria-describedby="necessary-description"
                    tabIndex="-1"
                  />
                </div>
                <p id="necessary-description" className="cookie-preference-description">
                  Estas cookies son esenciales para el funcionamiento del sitio web
                  y no se pueden desactivar.
                </p>
              </div>

              {/* Cookies Analíticas */}
              <div className="cookie-preference-item">
                <div className="cookie-preference-header">
                  <h4>Cookies Analíticas</h4>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                      aria-describedby="analytics-description"
                    />
                    <span className="cookie-toggle-slider"></span>
                  </label>
                </div>
                <p id="analytics-description" className="cookie-preference-description">
                  Nos ayudan a entender cómo interactúas con el sitio para mejorar
                  la experiencia del usuario.
                </p>
              </div>

              {/* Cookies de Marketing */}
              <div className="cookie-preference-item">
                <div className="cookie-preference-header">
                  <h4>Cookies de Marketing</h4>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                      aria-describedby="marketing-description"
                    />
                    <span className="cookie-toggle-slider"></span>
                  </label>
                </div>
                <p id="marketing-description" className="cookie-preference-description">
                  Se utilizan para mostrar anuncios relevantes y medir la efectividad
                  de nuestras campañas publicitarias.
                </p>
              </div>

              {/* Cookies Funcionales */}
              <div className="cookie-preference-item">
                <div className="cookie-preference-header">
                  <h4>Cookies Funcionales</h4>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                      aria-describedby="functional-description"
                    />
                    <span className="cookie-toggle-slider"></span>
                  </label>
                </div>
                <p id="functional-description" className="cookie-preference-description">
                  Permiten recordar tus preferencias y configuraciones para
                  personalizar tu experiencia.
                </p>
              </div>
            </div>

            <div className="cookie-preferences-actions">
              <button
                onClick={handleSavePreferences}
                className="btn btn-primary"
                aria-describedby="save-preferences-help"
              >
                Guardar Preferencias
              </button>
              <button
                onClick={() => setShowPreferences(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>

            <div className="sr-only" id="save-preferences-help">
              Guarda tus preferencias de cookies y cierra este panel
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;