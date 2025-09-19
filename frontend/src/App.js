import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Discography from './pages/Discography';
import Videos from './pages/Videos';
import Concerts from './pages/Concerts';
import Forum from './pages/Forum';
import Playlists from './pages/Playlists';
import Store from './pages/Store';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discography" element={<Discography />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/concerts" element={<Concerts />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/store" element={<Store />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
