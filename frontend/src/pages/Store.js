import React, { useEffect, useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import storeAPI from '../api/store';
import './Store.css';

// Componente memoizado para tarjetas de producto
const ProductCard = memo(({ product, onAddToCart, onUpdateQuantity, quantity, t }) => (
  <div className="product-card">
    <div className="product-image">
      {product.image ? (
        <img src={product.image} alt={product.name} />
      ) : (
        <div className="no-image">📦</div>
      )}
    </div>

    <div className="product-info">
      <h3>{product.name}</h3>
      <p className="product-description">{product.description}</p>
      <p className="product-price">${product.price.toFixed(2)}</p>
      <p className="product-stock">
        {t('store.stock')}: {product.stock} {product.stock <= 5 && <span className="low-stock">({t('store.lowStock')})</span>}
      </p>
    </div>

    <div className="product-actions">
      {quantity > 0 ? (
        <div className="quantity-controls">
          <button
            onClick={() => onUpdateQuantity(product._id, quantity - 1)}
            className="quantity-btn"
            title={t('store.decrease')}
          >
            -
          </button>
          <span className="quantity">{quantity}</span>
          <button
            onClick={() => onUpdateQuantity(product._id, quantity + 1)}
            className="quantity-btn"
            disabled={quantity >= product.stock}
            title={t('store.increase')}
          >
            +
          </button>
        </div>
      ) : (
        <button
          onClick={() => onAddToCart(product)}
          className="btn btn-primary add-to-cart-btn"
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? t('store.outOfStock') : t('store.addToCart')}
        </button>
      )}
    </div>
  </div>
));

const Store = () => {
  const { addItem, removeItem, updateQuantity, items, total, itemCount, clearCart, validateStock } = useCart();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    category: 'all',
    search: '',
    sort: 'createdAt',
    order: 'desc',
    minPrice: '',
    maxPrice: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 12
  });
  const [showCart, setShowCart] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters.page, filters.category, filters.search, filters.sort, filters.order, filters.minPrice, filters.maxPrice]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (params.category === 'all') delete params.category;

      const response = await storeAPI.getProducts(params);

      if (response.success) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
        setError(null);
      } else {
        throw new Error(response.message || 'Error al cargar productos');
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError(err.message);
      // Fallback a datos mock
      setProducts([
        {
          _id: '1',
          name: 'T-Shirt Twenty One Pilots',
          description: 'Camiseta oficial de Twenty One Pilots',
          price: 25.99,
          image: null,
          category: 'clothing',
          stock: 50,
          isAvailable: true
        },
        {
          _id: '2',
          name: 'Poster Trench',
          description: 'Poster oficial del álbum Trench',
          price: 15.99,
          image: null,
          category: 'posters',
          stock: 30,
          isAvailable: true
        },
        {
          _id: '3',
          name: 'Gorra TOP',
          description: 'Gorra oficial de Twenty One Pilots',
          price: 20.99,
          image: null,
          category: 'accessories',
          stock: 25,
          isAvailable: true
        }
      ]);
      setPagination({ page: 1, pages: 1, total: 3, limit: 12 });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await storeAPI.getCategories();
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
      // Fallback a categorías mock
      setCategories(['clothing', 'accessories', 'music', 'posters', 'other']);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleAddToCart = useCallback((product) => {
    addItem(product, 1);
  }, [addItem]);

  const handleQuantityChange = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  }, [removeItem, updateQuantity]);

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);

      // Validar stock
      const isValid = await validateStock();
      if (!isValid) return;

      // Procesar pago con Stripe
      const response = await storeAPI.processPayment(
        items,
        `${window.location.origin}/store/success`,
        `${window.location.origin}/store`
      );

      if (response.success) {
        // Redirigir a Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error(response.message || 'Error al procesar el pago');
      }
    } catch (err) {
      console.error('Error en checkout:', err);
      alert('Error al procesar el pago: ' + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getItemQuantity = (productId) => {
    const item = items.find(item => item.product._id === productId);
    return item ? item.quantity : 0;
  };

  if (loading && products.length === 0) {
    return (
      <div className="store">
        <div className="loading">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="store">
      <div className="store-header">
        <h1>{t('store.title')}</h1>
        <p>{t('store.subtitle')}</p>
        <button
          className="cart-toggle-btn"
          onClick={() => setShowCart(!showCart)}
        >
          🛒 {t('store.cartToggle')} ({itemCount})
        </button>
      </div>

      <div className="store-content">
        <div className="store-sidebar">
          <div className="filters">
            <h3>{t('store.filters')}</h3>

            <div className="filter-group">
              <label>{t('store.category')}:</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
              >
                <option value="all">{t('common.all')}</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('common.search')}:</label>
              <input
                type="text"
                placeholder={t('store.search')}
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>{t('store.minPrice')}:</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>{t('store.maxPrice')}:</label>
              <input
                type="number"
                placeholder="1000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>{t('store.sortBy')}:</label>
              <select
                value={`${filters.sort}_${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('_');
                  handleFilterChange({ sort, order });
                }}
              >
                <option value="createdAt_desc">{t('store.newest')}</option>
                <option value="createdAt_asc">{t('store.oldest')}</option>
                <option value="price_asc">{t('store.priceLowHigh')}</option>
                <option value="price_desc">{t('store.priceHighLow')}</option>
                <option value="name_asc">{t('store.nameAZ')}</option>
                <option value="name_desc">{t('store.nameZA')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="store-main">
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={fetchProducts} className="btn btn-primary">
                Reintentar
              </button>
            </div>
          )}

          <div className="products-grid">
            {products.length === 0 ? (
              <div className="no-products">
                <h3>No hay productos disponibles</h3>
                <p>Los productos aparecerán aquí cuando estén disponibles.</p>
              </div>
            ) : (
              products.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleQuantityChange}
                  quantity={getItemQuantity(product._id)}
                  t={t}
                />
              ))
            )}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handleFilterChange({ page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn btn-secondary"
              >
                Anterior
              </button>

              <span className="page-info">
                Página {pagination.page} de {pagination.pages}
                ({pagination.total} productos)
              </span>

              <button
                onClick={() => handleFilterChange({ page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="btn btn-secondary"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {showCart && (
          <div className="cart-sidebar">
            <div className="cart-header">
              <h3>{t('store.cartTitle')}</h3>
              <button onClick={() => setShowCart(false)} className="close-cart">✕</button>
            </div>

            <div className="cart-items">
              {items.length === 0 ? (
                <p className="empty-cart">{t('store.cartEmpty')}</p>
              ) : (
                items.map(item => (
                  <div key={item.product._id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.product.name}</h4>
                      <p>${item.product.price.toFixed(2)} x {item.quantity}</p>
                      <p className="cart-item-total">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                        className="quantity-btn"
                        title={t('store.decrease')}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                        className="quantity-btn"
                        disabled={item.quantity >= item.product.stock}
                        title={t('store.increase')}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.product._id)}
                        className="remove-btn"
                        title={t('store.removeFromCart')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <strong>{t('store.cartTotal')}: ${total.toFixed(2)}</strong>
                </div>
                <button
                  onClick={handleCheckout}
                  className="btn btn-primary checkout-btn"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? t('store.processing') : t('store.checkout')}
                </button>
                <button onClick={clearCart} className="btn btn-secondary clear-cart-btn">
                  {t('store.clearCart')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;