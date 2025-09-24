import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageCurrencySelector from './LanguageCurrencySelector';
import { useTheme } from '../ThemeProvider';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { getWishlistCount } = useWishlist();

  const menuItems = [
    { path: '/', label: 'Inicio' },
    { path: '/discography', label: 'Discografía' },
    { path: '/videos', label: 'Videos' },
    { path: '/playlists', label: 'Playlists' },
    { path: '/album-metrics', label: 'Métricas' },
    { path: '/concerts', label: 'Conciertos' },
    { path: '/forum', label: 'Foro' },
    { path: '/store', label: 'Tienda' },
  ];

  return (
    <nav style={{
      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#000000',
      padding: '1rem',
      borderBottom: '2px solid #ff0000',
      transition: 'background-color 0.3s ease, color 0.3s ease'
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
                color: location.pathname === item.path ? '#ff0000' : (isDarkMode ? '#ffffff' : '#000000'),
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
          {/* Wishlist Icon */}
          {isAuthenticated && (
            <Link
              to="/wishlist"
              style={{
                position: 'relative',
                color: location.pathname === '/wishlist' ? '#ff0000' : (isDarkMode ? '#ffffff' : '#000000'),
                textDecoration: 'none',
                padding: '0.5rem',
                borderRadius: '4px',
                transition: 'background-color 0.3s ease'
              }}
              title="Mi lista de deseos"
            >
              <span style={{ fontSize: '1.2rem' }}>❤️</span>
              {getWishlistCount() > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#ff0000',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getWishlistCount()}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${isDarkMode ? '#ffffff' : '#000000'}`,
              color: isDarkMode ? '#ffffff' : '#000000',
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            aria-label={isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <LanguageCurrencySelector />
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