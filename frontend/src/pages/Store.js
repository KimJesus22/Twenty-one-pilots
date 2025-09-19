import React, { useEffect, useState } from 'react';
import './Store.css';

const Store = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Simular datos por ahora - en producción vendría de la API
      const mockProducts = [
        {
          id: 1,
          name: "Camiseta Oficial Blurryface",
          description: "Camiseta de algodón premium con diseño oficial de Blurryface",
          price: 29.99,
          originalPrice: 39.99,
          image: null,
          category: "camisetas",
          inStock: true,
          rating: 4.8,
          reviews: 156,
          tags: ["oficial", "blurryface", "algodon"]
        },
        {
          id: 2,
          name: "Vinilo Trench",
          description: "Álbum completo en vinilo de alta calidad",
          price: 34.99,
          originalPrice: null,
          image: null,
          category: "musica",
          inStock: true,
          rating: 4.9,
          reviews: 89,
          tags: ["vinilo", "trench", "coleccionable"]
        },
        {
          id: 3,
          name: "Taza Twenty One Pilots",
          description: "Taza de cerámica con diseño único",
          price: 14.99,
          originalPrice: 19.99,
          image: null,
          category: "accesorios",
          inStock: false,
          rating: 4.5,
          reviews: 67,
          tags: ["taza", "ceramica", "cafe"]
        },
        {
          id: 4,
          name: "Poster Scaled and Icy",
          description: "Poster oficial del álbum Scaled and Icy",
          price: 9.99,
          originalPrice: null,
          image: null,
          category: "decoracion",
          inStock: true,
          rating: 4.7,
          reviews: 43,
          tags: ["poster", "scaled", "decoracion"]
        },
        {
          id: 5,
          name: "Gorra TOP",
          description: "Gorra ajustable con logo oficial",
          price: 24.99,
          originalPrice: 29.99,
          image: null,
          category: "accesorios",
          inStock: true,
          rating: 4.6,
          reviews: 112,
          tags: ["gorra", "ajustable", "oficial"]
        },
        {
          id: 6,
          name: "CD Completo",
          description: "Colección completa de CDs oficiales",
          price: 79.99,
          originalPrice: 99.99,
          image: null,
          category: "musica",
          inStock: true,
          rating: 4.9,
          reviews: 78,
          tags: ["cd", "coleccion", "completo"]
        }
      ];

      let filteredProducts = mockProducts;

      if (filter !== 'all') {
        filteredProducts = mockProducts.filter(p => p.category === filter);
      }

      setProducts(filteredProducts);
      setError(null);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star">☆</span>);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="store">
        <div className="loading">Cargando tienda...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="store">
        <div className="error">
          <h2>Error al cargar la tienda</h2>
          <p>{error}</p>
          <button onClick={fetchProducts} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="store">
      <div className="store-header">
        <div className="header-content">
          <h1>Tienda Oficial</h1>
          <p>Merchandise exclusivo de Twenty One Pilots</p>
        </div>

        <div className="cart-button-container">
          <button
            className="cart-button"
            onClick={() => setShowCart(true)}
          >
            🛒 Carrito ({getTotalItems()})
          </button>
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="cart-modal">
          <div className="modal-overlay" onClick={() => setShowCart(false)}></div>
          <div className="modal-content cart-content">
            <div className="modal-header">
              <h2>Carrito de Compras</h2>
              <button
                className="close-btn"
                onClick={() => setShowCart(false)}
              >
                ×
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p>${item.price.toFixed(2)}</p>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="remove-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
                </div>
                <button className="btn btn-primary checkout-btn">
                  Proceder al Pago
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="store-filters">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos los Productos
          </button>
          <button
            className={`filter-btn ${filter === 'camisetas' ? 'active' : ''}`}
            onClick={() => setFilter('camisetas')}
          >
            Camisetas
          </button>
          <button
            className={`filter-btn ${filter === 'musica' ? 'active' : ''}`}
            onClick={() => setFilter('musica')}
          >
            Música
          </button>
          <button
            className={`filter-btn ${filter === 'accesorios' ? 'active' : ''}`}
            onClick={() => setFilter('accesorios')}
          >
            Accesorios
          </button>
          <button
            className={`filter-btn ${filter === 'decoracion' ? 'active' : ''}`}
            onClick={() => setFilter('decoracion')}
          >
            Decoración
          </button>
        </div>
      </div>

      <div className="products-grid">
        {products.length === 0 ? (
          <div className="no-products">
            <h3>No hay productos en esta categoría</h3>
            <p>Intenta con otra categoría o revisa más tarde.</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="no-image">
                    <span>🛍️</span>
                  </div>
                )}

                {!product.inStock && (
                  <div className="out-of-stock">Agotado</div>
                )}

                {product.originalPrice && (
                  <div className="discount-badge">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </div>
                )}
              </div>

              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>

                <div className="product-rating">
                  <div className="stars">
                    {renderStars(product.rating)}
                  </div>
                  <span className="rating-text">
                    {product.rating} ({product.reviews} reseñas)
                  </span>
                </div>

                <div className="product-price">
                  <span className="current-price">${product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="original-price">${product.originalPrice.toFixed(2)}</span>
                  )}
                </div>

                {product.tags && (
                  <div className="product-tags">
                    {product.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="product-actions">
                <button
                  className="btn btn-primary add-to-cart-btn"
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                >
                  {product.inStock ? '🛒 Agregar al Carrito' : 'Agotado'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Store;