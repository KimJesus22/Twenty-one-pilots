import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import './WishlistItem.css';

const WishlistItem = ({ item, onRemove, loading }) => {
  const { product, addedAt, notes } = item;
  const { formatPrice } = useUserPreferences();
  const [showNotes, setShowNotes] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (isRemoving || loading) return;

    try {
      setIsRemoving(true);
      await onRemove(product._id);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddToCart = () => {
    // Aquí iría la lógica para agregar al carrito
    // Por ahora solo mostramos un mensaje
    alert(`Producto "${product.name}" agregado al carrito`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="wishlist-item">
      <div className="item-image">
        <Link to={`/store/product/${product._id}`}>
          <img
            src={product.images?.[0] || '/placeholder-product.png'}
            alt={product.name}
            onError={(e) => {
              e.target.src = '/placeholder-product.png';
            }}
          />
        </Link>
      </div>

      <div className="item-details">
        <div className="item-header">
          <Link to={`/store/product/${product._id}`} className="item-title">
            {product.name}
          </Link>
          <div className="item-price">
            {formatPrice(product.price || 0)}
          </div>
        </div>

        <div className="item-meta">
          <span className="item-category">{product.category}</span>
          {product.stock > 0 ? (
            <span className="item-stock in-stock">En stock</span>
          ) : (
            <span className="item-stock out-of-stock">Agotado</span>
          )}
        </div>

        <div className="item-added">
          Agregado el {formatDate(addedAt)}
        </div>

        {notes && (
          <div className="item-notes">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="notes-toggle"
            >
              {showNotes ? 'Ocultar' : 'Mostrar'} notas
            </button>
            {showNotes && (
              <div className="notes-content">
                {notes}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="item-actions">
        <button
          onClick={handleAddToCart}
          className="add-to-cart-btn"
          disabled={!product.stock || product.stock <= 0}
        >
          Agregar al carrito
        </button>

        <button
          onClick={handleRemove}
          className="remove-btn"
          disabled={isRemoving || loading}
        >
          {isRemoving ? (
            <>
              <span className="spinner small"></span>
              Removiendo...
            </>
          ) : (
            'Remover'
          )}
        </button>
      </div>
    </div>
  );
};

export default WishlistItem;