import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discography" element={<div>Discografía - Próximamente</div>} />
            <Route path="/videos" element={<div>Videos - Próximamente</div>} />
            <Route path="/concerts" element={<div>Conciertos - Próximamente</div>} />
            <Route path="/forum" element={<div>Foro - Próximamente</div>} />
            <Route path="/playlists" element={<div>Playlists - Próximamente</div>} />
            <Route path="/store" element={<div>Tienda - Próximamente</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
