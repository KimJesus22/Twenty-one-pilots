import React, { useState, useMemo } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import WishlistItem from '../components/WishlistItem';
import RangeSlider from '../components/RangeSlider';
import './WishlistPage.css';

const WishlistPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { formatPrice } = useUserPreferences();
  const {
    wishlist,
    loading,
    error,
    filters,
    recommendations,
    removeFromWishlist,
    clearWishlist,
    getWishlistCount,
    getWishlistValue,
    updateFilters,
    applyFilters,
    loadWishlist,
    isInWishlist,
    addToWishlist
  } = useWishlist();

  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Aplicar filtros y ordenamiento
  const filteredWishlist = useMemo(() => {
    return applyFilters(wishlist);
  }, [wishlist, applyFilters]);

  const handleFilterChange = (newFilters) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }));
  };

  const applyLocalFilters = () => {
    updateFilters(localFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      sortBy: 'addedAt',
      sortOrder: 'desc',
      minPrice: 0,
      maxPrice: 1000,
      category: 'all'
    };
    setLocalFilters(defaultFilters);
    updateFilters(defaultFilters);
  };

  // Redirigir si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-container">
          <div className="auth-required">
            <h1>Mi Lista de Deseos</h1>
            <p>Debes iniciar sesión para ver tu lista de deseos.</p>
            <a href="/login" className="login-link">Iniciar Sesión</a>
          </div>
        </div>
      </div>
    );
  }

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
    }
  };

  const handleClearWishlist = async () => {
    try {
      await clearWishlist();
      setShowConfirmClear(false);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    }
  };

  const handleRetry = () => {
    loadWishlist();
  };

  if (loading && wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando tu lista de deseos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>Mi Lista de Deseos</h1>
          <div className="wishlist-stats">
            <span className="stat-item">
              {filteredWishlist.length} {filteredWishlist.length === 1 ? 'producto' : 'productos'}
            </span>
            <span className="stat-item">
              Valor total: {formatPrice(getWishlistValue() || 0)}
            </span>
          </div>
        </div>

        {/* Filtros avanzados */}
        {wishlist.length > 0 && (
          <div className="wishlist-filters">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="toggle-filters-btn"
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros avanzados'}
            </button>

            {showFilters && (
              <div className="filters-content">
                <div className="filter-group">
                  <label>Ordenar por:</label>
                  <select
                    value={`${localFilters.sortBy}_${localFilters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('_');
                      handleFilterChange({ sortBy, sortOrder });
                    }}
                  >
                    <option value="addedAt_desc">Fecha de añadido (más reciente)</option>
                    <option value="addedAt_asc">Fecha de añadido (más antiguo)</option>
                    <option value="price_asc">Precio (menor a mayor)</option>
                    <option value="price_desc">Precio (mayor a menor)</option>
                    <option value="name_asc">Nombre (A-Z)</option>
                    <option value="name_desc">Nombre (Z-A)</option>
                    <option value="popularity_desc">Popularidad (mayor)</option>
                    <option value="popularity_asc">Popularidad (menor)</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Rango de precios:</label>
                  <RangeSlider
                    min={0}
                    max={1000}
                    value={[localFilters.minPrice, localFilters.maxPrice]}
                    onChange={(value) => handleFilterChange({ minPrice: value[0], maxPrice: value[1] })}
                  />
                </div>

                <div className="filter-group">
                  <label>Categoría:</label>
                  <select
                    value={localFilters.category}
                    onChange={(e) => handleFilterChange({ category: e.target.value })}
                  >
                    <option value="all">Todas las categorías</option>
                    <option value="electronics">Electrónicos</option>
                    <option value="clothing">Ropa</option>
                    <option value="books">Libros</option>
                    <option value="home">Hogar</option>
                    <option value="sports">Deportes</option>
                    <option value="other">Otros</option>
                  </select>
                </div>

                <div className="filter-actions">
                  <button onClick={applyLocalFilters} className="apply-filters-btn">
                    Aplicar filtros
                  </button>
                  <button onClick={resetFilters} className="reset-filters-btn">
                    Restablecer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>Error al cargar la lista de deseos: {error}</p>
            <button onClick={handleRetry} className="retry-btn">
              Reintentar
            </button>
          </div>
        )}

        {!error && (
          <>
            {wishlist.length === 0 ? (
              <div className="empty-wishlist">
                <div className="empty-icon">❤️</div>
                <h2>Tu lista de deseos está vacía</h2>
                <p>Agrega productos que te interesen para comprarlos más tarde.</p>
                <a href="/store" className="shop-link">Ir a la tienda</a>
              </div>
            ) : (
              <>
                <div className="wishlist-actions">
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="clear-wishlist-btn"
                    disabled={loading}
                  >
                    Limpiar lista
                  </button>
                </div>

                <div className="wishlist-items">
                  {filteredWishlist.map((item) => (
                    <WishlistItem
                      key={item.product._id}
                      item={item}
                      onRemove={handleRemoveItem}
                      loading={loading}
                    />
                  ))}
                </div>

                {/* Recomendaciones */}
                {recommendations.length > 0 && (
                  <div className="wishlist-recommendations">
                    <h3>Productos recomendados</h3>
                    <p>Basado en tus intereses actuales</p>
                    <div className="recommendations-grid">
                      {recommendations.slice(0, 4).map((product) => (
                        <div key={product._id} className="recommendation-card">
                          <img
                            src={product.images?.[0] || '/placeholder-product.png'}
                            alt={product.name}
                            className="recommendation-image"
                          />
                          <div className="recommendation-info">
                            <h4>{product.name}</h4>
                            <p className="recommendation-price">{formatPrice(product.price || 0)}</p>
                            <span className="recommendation-category">{product.category}</span>
                          </div>
                          <button
                            className={`add-recommendation-btn ${isInWishlist(product._id) ? 'in-wishlist' : ''}`}
                            onClick={async () => {
                              if (!isInWishlist(product._id)) {
                                try {
                                  await addToWishlist(product._id);
                                } catch (error) {
                                  console.error('Error adding recommendation to wishlist:', error);
                                }
                              }
                            }}
                            disabled={loading || isInWishlist(product._id)}
                          >
                            {loading ? 'Agregando...' : isInWishlist(product._id) ? 'En wishlist' : 'Agregar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Modal de confirmación para limpiar wishlist */}
        {showConfirmClear && (
          <div className="modal-overlay" onClick={() => setShowConfirmClear(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>¿Estás seguro?</h3>
              <p>Esta acción eliminará todos los productos de tu lista de deseos. Esta acción no se puede deshacer.</p>
              <div className="modal-actions">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="cancel-btn"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearWishlist}
                  className="confirm-btn"
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Eliminar todo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;