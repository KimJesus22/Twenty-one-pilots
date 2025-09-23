import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Inicio' },
    { path: '/discography', label: 'Discografía' },
    { path: '/videos', label: 'Videos' },
    { path: '/concerts', label: 'Conciertos' },
    { path: '/forum', label: 'Foro' },
    { path: '/store', label: 'Tienda' },
  ];

  return (
    <nav style={{
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '1rem',
      borderBottom: '2px solid #ff0000'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link
          to="/"
          style={{
            color: '#ff0000',
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          Twenty One Pilots
        </Link>

        <div style={{ display: 'flex', gap: '2rem' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                color: location.pathname === item.path ? '#ff0000' : '#ffffff',
                textDecoration: 'none',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                padding: '0.5rem 1rem',
                borderBottom: location.pathname === item.path ? '2px solid #ff0000' : 'none'
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LanguageSelector />
          <Link
            to="/login"
            style={{
              backgroundColor: '#ff0000',
              color: '#000000',
              padding: '0.5rem 1rem',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;