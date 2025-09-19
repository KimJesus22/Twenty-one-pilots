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
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Simular productos por ahora
      const mockProducts = [
        {
          _id: '1',
          name: 'Camiseta Oficial Twenty One Pilots',
          description: 'Camiseta negra con logo oficial de la banda',
          price: 25.99,
          originalPrice: 29.99,
          image: null,
          category: 'clothing',
          inStock: true,
          rating: 4.5,
          reviews: 128
        },
        {
          _id: '2',
          name: 'Vinilo - Trench',
          description: 'Álbum Trench en formato vinilo',
          price: 34.99,
          originalPrice: null,
          image: null,
          category: 'music',
          inStock: true,
          rating: 4.8,
          reviews: 89
        },
        {
          _id: '3',
          name: 'Gorra Oficial',
          description: 'Gorra negra con logo bordado',
          price: 19.99,
          originalPrice: 24.99,
          image: null,
          category: 'accessories',
          inStock: false,
          rating: 4.2,
          reviews: 67
        }
      ];
      setProducts(mockProducts);
      setError(null);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    return product.category === filter;
  });

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
          <p>Merchandise oficial de Twenty One Pilots</p>
        </div>
        <div className="cart-button-container">
          <button
            onClick={() => setShowCart(true)}
            className="cart-button"
          >
            🛒 Carrito ({cart.length})
          </button>
        </div>
      </div>

      <div className="store-filters">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${filter === 'clothing' ? 'active' : ''}`}
            onClick={() => setFilter('clothing')}
          >
            Ropa
          </button>
          <button
            className={`filter-btn ${filter === 'music' ? 'active' : ''}`}
            onClick={() => setFilter('music')}
          >
            Música
          </button>
          <button
            className={`filter-btn ${filter === 'accessories' ? 'active' : ''}`}
            onClick={() => setFilter('accessories')}
          >
            Accesorios
          </button>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <h3>No hay productos disponibles</h3>
            <p>Los productos aparecerán aquí cuando estén disponibles.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="no-image">
                    <span>🎵</span>
                  </div>
                )}
                {!product.inStock && (
                  <div className="out-of-stock">Agotado</div>
                )}
                {product.originalPrice && (
                  <div className="discount-badge">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
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
                  <span className="current-price">${product.price}</span>
                  {product.originalPrice && (
                    <span className="original-price">${product.originalPrice}</span>
                  )}
                </div>

                <div className="product-tags">
                  <span className="tag">{product.category}</span>
                </div>
              </div>

              <div className="product-actions">
                <button
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                  className="add-to-cart-btn"
                >
                  {product.inStock ? 'Agregar al Carrito' : 'Agotado'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCart && (
        <div className="cart-modal">
          <div className="modal-overlay" onClick={() => setShowCart(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Carrito de Compras</h2>
              <button
                onClick={() => setShowCart(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="cart-content">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item._id} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <p>${item.price}</p>
                      </div>
                      <div className="cart-item-controls">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="remove-btn"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
                </div>
                <button className="checkout-btn">
                  Proceder al Pago
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;