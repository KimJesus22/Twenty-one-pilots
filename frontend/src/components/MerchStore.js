import React, { useState, useEffect } from 'react';
import './MerchStore.css';

const MerchStore = ({
  eventId,
  compact = false,
  onPurchase,
  onAddToWishlist,
  onViewDetails
}) => {
  const [merch, setMerch] = useState([]);
  const [filteredMerch, setFilteredMerch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Cargar merchandising del evento
  useEffect(() => {
    loadMerch();
  }, [eventId]);

  // Filtrar y ordenar productos
  useEffect(() => {
    let filtered = [...merch];

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filtrar por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.pricing.salePrice || a.pricing.originalPrice) - (b.pricing.salePrice || b.pricing.originalPrice);
        case 'price-high':
          return (b.pricing.salePrice || b.pricing.originalPrice) - (a.pricing.salePrice || a.pricing.originalPrice);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'rating':
          return b.stats.rating.average - a.stats.rating.average;
        case 'priority':
        default:
          return b.priority - a.priority;
      }
    });

    setFilteredMerch(filtered);
  }, [merch, selectedCategory, selectedType, sortBy, searchTerm]);

  const loadMerch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/musicMerch/merch/event/${eventId}?limit=50`);
      const data = await response.json();

      if (data.success) {
        setMerch(data.data);
      }
    } catch (error) {
      console.error('Error loading merch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (merchItem) => {
    // Aquí iría la lógica de compra
    console.log('Purchase:', merchItem);
    onPurchase && onPurchase(merchItem);
  };

  const handleAddToWishlist = async (merchId) => {
    try {
      const response = await fetch(`/api/musicMerch/merch/${merchId}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'add' })
      });

      if (response.ok) {
        // Actualizar estado local
        setMerch(prev => prev.map(item =>
          item._id === merchId
            ? { ...item, stats: { ...item.stats, wishlistCount: item.stats.wishlistCount + 1 } }
            : item
        ));
        onAddToWishlist && onAddToWishlist(merchId);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const handleViewDetails = (merchItem) => {
    onViewDetails && onViewDetails(merchItem);
  };

  const formatPrice = (pricing) => {
    const price = pricing.salePrice || pricing.originalPrice;
    const currency = pricing.currency === 'MXN' ? '$' : pricing.currency === 'USD' ? '$' : '€';
    return `${currency}${price}`;
  };

  const getStockStatus = (inventory) => {
    if (!inventory.isAvailable) return { text: 'Agotado', class: 'out-of-stock' };
    if (inventory.available <= inventory.lowStockThreshold) return { text: 'Pocas unidades', class: 'low-stock' };
    return { text: 'Disponible', class: 'in-stock' };
  };

  if (compact) {
    const featuredMerch = merch.filter(item => item.featured).slice(0, 3);

    return (
      <div className="merch-store compact">
        <div className="compact-header">
          <h4>🛍️ Merch Exclusivo</h4>
          <button
            className="view-all-btn"
            onClick={() => setShowFilters(true)}
          >
            Ver todo
          </button>
        </div>

        <div className="featured-merch">
          {featuredMerch.map(item => (
            <div key={item._id} className="merch-item-compact">
              <div className="merch-image">
                <img
                  src={item.images.find(img => img.isPrimary)?.url || item.images[0]?.url}
                  alt={item.name}
                />
                {item.pricing.discountPercentage > 0 && (
                  <div className="discount-badge">
                    -{item.pricing.discountPercentage}%
                  </div>
                )}
              </div>

              <div className="merch-info">
                <h5>{item.name}</h5>
                <div className="price">
                  {item.pricing.salePrice ? (
                    <>
                      <span className="original-price">${item.pricing.originalPrice}</span>
                      <span className="sale-price">${item.pricing.salePrice}</span>
                    </>
                  ) : (
                    <span className="regular-price">${item.pricing.originalPrice}</span>
                  )}
                </div>

                <button
                  className="buy-btn compact"
                  onClick={() => handlePurchase(item)}
                  disabled={!item.availability.isAvailable}
                >
                  {item.availability.isAvailable ? 'Comprar' : 'Agotado'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="merch-store">
      <div className="store-header">
        <h3>🛍️ Merchandising Exclusivo</h3>
        <p>Productos oficiales y ediciones limitadas del evento</p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="store-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-btn">🔍</button>
        </div>

        <div className="filter-controls">
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            🎛️ Filtros {showFilters ? '▼' : '▶'}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="priority">Destacados</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
            <option value="name">Nombre A-Z</option>
            <option value="newest">Más Recientes</option>
            <option value="rating">Mejor Calificación</option>
          </select>
        </div>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Categoría:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              <option value="t-shirt">Playeras</option>
              <option value="hoodie">Sudaderas</option>
              <option value="hat">Gorras</option>
              <option value="poster">Pósters</option>
              <option value="vinyl">Vinilos</option>
              <option value="cd">CDs</option>
              <option value="digital_album">Álbumes Digitales</option>
              <option value="bundle">Paquetes</option>
              <option value="limited_edition">Edición Limitada</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Tipo:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              <option value="clothing">Ropa</option>
              <option value="accessories">Accesorios</option>
              <option value="music">Música</option>
              <option value="collectibles">Coleccionables</option>
              <option value="digital">Digital</option>
              <option value="other">Otros</option>
            </select>
          </div>

          <button
            className="clear-filters"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedType('all');
              setSearchTerm('');
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      )}

      {/* Grid de productos */}
      {!loading && (
        <div className="merch-grid">
          {filteredMerch.length === 0 ? (
            <div className="no-products">
              <p>No se encontraron productos que coincidan con los filtros.</p>
            </div>
          ) : (
            filteredMerch.map(item => (
              <div key={item._id} className="merch-item">
                <div className="merch-image-container">
                  <img
                    src={item.images.find(img => img.isPrimary)?.url || item.images[0]?.url}
                    alt={item.name}
                    className="merch-image"
                    onClick={() => handleViewDetails(item)}
                  />

                  {item.pricing.discountPercentage > 0 && (
                    <div className="discount-badge">
                      -{item.pricing.discountPercentage}%
                    </div>
                  )}

                  {item.featured && (
                    <div className="featured-badge">⭐</div>
                  )}

                  {item.availability.limitedEdition && (
                    <div className="limited-badge">⚡ Edición Limitada</div>
                  )}

                  <div className={`stock-status ${getStockStatus(item.inventory).class}`}>
                    {getStockStatus(item.inventory).text}
                  </div>
                </div>

                <div className="merch-info">
                  <h4 className="merch-name">{item.name}</h4>
                  <p className="merch-description">{item.description}</p>

                  <div className="merch-meta">
                    <span className="category">{item.category.replace('-', ' ')}</span>
                    <span className="type">{item.type}</span>
                  </div>

                  <div className="merch-stats">
                    {item.stats.rating.average > 0 && (
                      <div className="rating">
                        ⭐ {item.stats.rating.average.toFixed(1)} ({item.stats.rating.count})
                      </div>
                    )}
                    <div className="views">👁️ {item.stats.views}</div>
                  </div>

                  <div className="merch-pricing">
                    {item.pricing.salePrice ? (
                      <>
                        <span className="original-price">
                          {formatPrice({ originalPrice: item.pricing.originalPrice, currency: item.pricing.currency })}
                        </span>
                        <span className="sale-price">
                          {formatPrice({ salePrice: item.pricing.salePrice, currency: item.pricing.currency })}
                        </span>
                      </>
                    ) : (
                      <span className="regular-price">
                        {formatPrice(item.pricing)}
                      </span>
                    )}

                    {item.shipping.freeShipping && (
                      <span className="shipping-info">🚚 Envío gratis</span>
                    )}
                  </div>

                  <div className="merch-actions">
                    <button
                      className="wishlist-btn"
                      onClick={() => handleAddToWishlist(item._id)}
                    >
                      ❤️ {item.stats.wishlistCount}
                    </button>

                    <button
                      className="details-btn"
                      onClick={() => handleViewDetails(item)}
                    >
                      Ver detalles
                    </button>

                    <button
                      className="buy-btn"
                      onClick={() => handlePurchase(item)}
                      disabled={!item.availability.isAvailable}
                    >
                      {item.availability.isPreOrder ? 'Pre-ordenar' :
                       !item.availability.isAvailable ? 'Agotado' : 'Comprar'}
                    </button>
                  </div>

                  {item.externalLinks?.purchaseUrl && (
                    <div className="external-purchase">
                      <a
                        href={item.externalLinks.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                      >
                        🛒 Comprar en tienda oficial
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de filtros para móvil */}
      {showFilters && compact && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Filtros</h3>
              <button onClick={() => setShowFilters(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Filtros aquí */}
              <p>Contenido de filtros para móvil</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchStore;