import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import './App.css';

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

function App() {
  return (
    <div className="App" style={{
      backgroundColor: '#000000',
      color: '#ffffff',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <Navbar />
              <main style={{ padding: '20px' }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/discography" element={<Discography />} />
                  <Route path="/videos" element={<Videos />} />
                  <Route path="/concerts" element={<Concerts />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/forum" element={<Forum />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/spotify" element={<Spotify />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/lyrics" element={<Lyrics />} />
                  <Route path="/maps" element={<Maps />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </main>
            </Router>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;
