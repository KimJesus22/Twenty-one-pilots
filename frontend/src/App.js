import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { ThemeProvider } from './ThemeProvider';
import Navbar from './components/Navbar';
import './App.css';
import './i18n'; // Asegurar que i18n se importe

// Importar componentes directamente (sin lazy loading para evitar problemas)
import Home from './pages/Home';
import Discography from './pages/Discography';
import Videos from './pages/Videos.jsx';
import Concerts from './pages/Concerts';
import Events from './pages/Events';
import Forum from './pages/Forum';
import Playlists from './pages/Playlists';
import Spotify from './pages/Spotify';
import Store from './pages/Store';
import Lyrics from './pages/Lyrics';
import Maps from './pages/Maps';
import Login from './pages/Login';
import Admin from './pages/Admin';
import AlbumMetrics from './pages/AlbumMetrics';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DataRequests from './pages/DataRequests';
import Profile from './pages/Profile';
import CookieBanner from './components/CookieBanner';
import AccessibilityAuditor from './components/AccessibilityAuditor';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ThemeProvider>
      <div className="App" style={{
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <UserPreferencesProvider>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <header>
                    <Navbar />
                  </header>
                  <main
                    id="main-content"
                    role="main"
                    style={{ padding: '20px' }}
                    tabIndex="-1"
                  >
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/discography" element={<Discography />} />
                        <Route path="/videos" element={<Videos />} />
                        <Route path="/concerts" element={<Concerts />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/forum" element={<Forum />} />
                        <Route path="/playlists" element={<Playlists />} />
                        <Route path="/album-metrics" element={<AlbumMetrics />} />
                        <Route path="/spotify" element={<Spotify />} />
                        <Route path="/store" element={<Store />} />
                        <Route path="/lyrics" element={<Lyrics />} />
                        <Route path="/maps" element={<Maps />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/user" element={<Profile />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/data-requests" element={<DataRequests />} />
                      </Routes>
                    </ErrorBoundary>
                  </main>
                </BrowserRouter>
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </UserPreferencesProvider>
        <CookieBanner />
        <AccessibilityAuditor />
      </div>
    </ThemeProvider>
  );
}

export default App;
