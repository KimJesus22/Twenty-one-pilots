import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useAccessibilityPreferences, useKeyboardNavigation, useScreenReaderAnnouncement } from './hooks/useAccessibility';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import AccessibilityPanel from './components/AccessibilityPanel';
import AccessibilityAuditor from './components/AccessibilityAuditor';
import './App.css';

// Lazy loading de componentes
const Home = lazy(() => import('./pages/Home'));
const Discography = lazy(() => import('./pages/Discography'));
const Videos = lazy(() => import('./pages/Videos.jsx'));
const Concerts = lazy(() => import('./pages/Concerts'));
const Events = lazy(() => import('./pages/Events'));
const Forum = lazy(() => import('./pages/Forum'));
const Playlists = lazy(() => import('./pages/Playlists'));
const Spotify = lazy(() => import('./pages/Spotify'));
const Store = lazy(() => import('./pages/Store'));
const Lyrics = lazy(() => import('./pages/Lyrics'));
const Maps = lazy(() => import('./pages/Maps'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));

// Componente de loading
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '18px',
    color: '#666'
  }}>
    Cargando...
  </div>
);

function App() {
  const { preferences } = useAccessibilityPreferences();
  const isKeyboardUser = useKeyboardNavigation();
  const { announce } = useScreenReaderAnnouncement();

  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [showAccessibilityAuditor, setShowAccessibilityAuditor] = useState(false);

  // Aplicar clases de accesibilidad dinámicamente
  useEffect(() => {
    const appElement = document.querySelector('.App');
    if (appElement) {
      // Limpiar clases anteriores
      appElement.classList.remove(
        'accessibility-high-contrast',
        'accessibility-reduced-motion',
        'accessibility-large-text',
        'accessibility-screen-reader'
      );

      // Aplicar clases basadas en preferencias
      if (preferences.highContrast) {
        appElement.classList.add('accessibility-high-contrast');
      }
      if (preferences.reducedMotion) {
        appElement.classList.add('accessibility-reduced-motion');
      }
      if (preferences.largeText) {
        appElement.classList.add('accessibility-large-text');
      }
      if (preferences.screenReader) {
        appElement.classList.add('accessibility-screen-reader');
      }
    }
  }, [preferences]);

  // Anunciar navegación para lectores de pantalla
  useEffect(() => {
    if (preferences.screenReader) {
      announce('Aplicación Twenty One Pilots cargada. Navegación principal disponible.', 'polite');
    }
  }, [preferences.screenReader, announce]);

  // Atajo de teclado para panel de accesibilidad
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        setShowAccessibilityPanel(true);
        announce('Panel de accesibilidad abierto', 'assertive');
      }
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        setShowAccessibilityAuditor(true);
        announce('Auditor de accesibilidad abierto', 'assertive');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [announce]);

  // Skip links para navegación rápida
  const skipLinks = [
    { href: '#main-content', label: 'Ir al contenido principal' },
    { href: '#navigation', label: 'Ir a la navegación' },
    { href: '#search', label: 'Ir a la búsqueda' }
  ];

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <div className="App">
              {/* Skip Links para accesibilidad */}
              <nav className="skip-links" aria-label="Enlaces de navegación rápida">
                {skipLinks.map((link, index) => (
                  <a key={index} href={link.href} className="skip-link">
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Indicador de navegación por teclado */}
              {isKeyboardUser && (
                <div className="sr-only" aria-live="polite">
                  Modo de navegación por teclado activado
                </div>
              )}

              <Router>
                <Navbar />
                <main id="main-content" role="main" tabIndex="-1">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/discography" element={<Discography />} />
                      <Route path="/videos" element={<Videos />} />
                      <Route path="/concerts" element={<Concerts />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/forum" element={<Forum />} />
                      <Route
                        path="/playlists"
                        element={
                          <ProtectedRoute>
                            <Playlists />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/spotify" element={<Spotify />} />
                      <Route path="/store" element={<Store />} />
                      <Route path="/lyrics" element={<Lyrics />} />
                      <Route path="/maps" element={<Maps />} />
                      <Route
                        path="/login"
                        element={
                          <ProtectedRoute requireAuth={false}>
                            <Login />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <Admin />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Suspense>
                </main>
              </Router>

              {/* Panel de accesibilidad */}
              <AccessibilityPanel
                isOpen={showAccessibilityPanel}
                onClose={() => setShowAccessibilityPanel(false)}
              />

              {/* Auditor de accesibilidad */}
              <AccessibilityAuditor
                isOpen={showAccessibilityAuditor}
                onClose={() => setShowAccessibilityAuditor(false)}
              />

              {/* Botón flotante de accesibilidad */}
              <button
                className="accessibility-trigger"
                onClick={() => setShowAccessibilityPanel(true)}
                aria-label="Abrir panel de configuración de accesibilidad"
                title="Accesibilidad (Alt + A)"
              >
                ♿
              </button>

              {/* Botón de auditoría (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  className="accessibility-auditor-trigger"
                  onClick={() => setShowAccessibilityAuditor(true)}
                  aria-label="Abrir auditoría de accesibilidad"
                  title="Auditoría de Accesibilidad (Alt + S)"
                  style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '20px',
                    background: '#0088ff',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  🔍
                </button>
              )}

              {/* Anuncios para lectores de pantalla */}
              <div aria-live="polite" aria-atomic="true" className="sr-only" id="accessibility-announcements">
                {/* Los anuncios se manejan a través del hook useScreenReaderAnnouncement */}
              </div>
            </div>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
