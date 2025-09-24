import React, { useState, useEffect } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../contexts/AuthContext';
import './WishlistButton.css';

const WishlistButton = ({
  productId,
  productName,
  size = 'medium',
  showText = true,
  className = '',
  onToggle
}) => {
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist, loading } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Verificar estado inicial
  useEffect(() => {
    if (isAuthenticated && productId) {
      setIsWishlisted(isInWishlist(productId));
    }
  }, [isAuthenticated, productId, isInWishlist]);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      // Redirigir a login o mostrar modal
      alert('Debes iniciar sesión para agregar productos a tu wishlist');
      return;
    }

    if (loading || localLoading) return;

    try {
      setLocalLoading(true);
      const result = await toggleWishlist(productId);

      // Actualizar estado local
      setIsWishlisted(result.action === 'added');

      // Callback opcional
      if (onToggle) {
        onToggle(result.action === 'added', productId);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      // Podríamos mostrar un toast de error aquí
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  return (
    <button
      className={`wishlist-button ${size} ${isWishlisted ? 'active' : ''} ${isLoading ? 'loading' : ''} ${className}`}
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={
        isWishlisted
          ? `Remover ${productName || 'producto'} de la wishlist`
          : `Agregar ${productName || 'producto'} a la wishlist`
      }
      title={
        isWishlisted
          ? `Remover ${productName || 'producto'} de la wishlist`
          : `Agregar ${productName || 'producto'} a la wishlist`
      }
    >
      <span className="wishlist-icon">
        {isLoading ? (
          <span className="spinner"></span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill={isWishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        )}
      </span>

      {showText && (
        <span className="wishlist-text">
          {isLoading ? 'Cargando...' : (isWishlisted ? 'En wishlist' : 'Agregar a wishlist')}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;