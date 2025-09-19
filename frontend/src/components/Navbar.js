import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">Twenty One Pilots</Link>
      </div>
      <ul className="navbar-menu">
        <li><Link to="/" className="nav-link">Inicio</Link></li>
        <li><Link to="/discography" className="nav-link">Discografía</Link></li>
        <li><Link to="/videos" className="nav-link">Videos</Link></li>
        <li><Link to="/concerts" className="nav-link">Conciertos</Link></li>
        <li><Link to="/forum" className="nav-link">Foro</Link></li>
        <li><Link to="/playlists" className="nav-link">Playlists</Link></li>
        <li><Link to="/store" className="nav-link">Tienda</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;