import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { getUserOrders, getOrderStats, formatOrderStatus, reorderOrder, formatPaymentMethod, formatPaymentStatus } from '../api/orders';
import './OrderHistory.css';

const OrderHistory = () => {
  const { user } = useAuth();
  const { formatPrice } = useUserPreferences();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [reordering, setReordering] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Cargar pedidos
  const loadOrders = useCallback(async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      setError(null);

      const [ordersResponse, statsResponse] = await Promise.all([
        getUserOrders(user._id, {
          ...filters,
          page: currentPage,
          limit: pageSize
        }),
        getOrderStats(user._id)
      ]);

      setOrders(ordersResponse.data);
      setPagination(ordersResponse.pagination);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [user?._id, filters, currentPage, pageSize]);

  // Cargar datos iniciales
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Manejar cambios de filtros
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Resetear a primera página
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Manejar reordenar pedido
  const handleReorder = async (orderId) => {
    if (!user?._id) return;

    try {
      setReordering(orderId);
      const response = await reorderOrder(orderId, user._id);

      // Aquí normalmente se agregarían los items al carrito
      // Por ahora mostramos un mensaje de éxito
      alert(`Se agregaron ${response.data.totalItems} productos al carrito`);

      // Recargar pedidos para actualizar cualquier cambio
      loadOrders();
    } catch (err) {
      console.error('Error reordering:', err);
      alert('Error al reordenar los productos');
    } finally {
      setReordering(null);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Renderizar estado del pedido
  const renderOrderStatus = (status) => {
    const statusInfo = formatOrderStatus(status);
    return (
      <span
        className={`order-status ${status}`}
        style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
      >
        {statusInfo.label}
      </span>
    );
  };

  // Renderizar información de envío
  const renderShippingInfo = (order) => {
    if (!order.shipping) return null;

    const progress = order.shipping.progress || 0;

    return (
      <div className="shipping-info">
        <div className="shipping-header">
          <span className="shipping-status">
            {order.shipping.currentDescription || 'Estado desconocido'}
          </span>
          {order.shipping.trackingNumber && (
            <span className="tracking-number">
              #{order.shipping.trackingNumber}
            </span>
          )}
        </div>

        <div className="shipping-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            {progress.toFixed(0)}% completado
            {order.shipping.isDelayed && (
              <span style={{ color: '#f44336', marginLeft: '0.5rem' }}>
                (Retrasado)
              </span>
            )}
          </div>
        </div>

        {order.shipping.estimatedDelivery && (
          <div className="shipping-estimate">
            Entrega estimada: {formatDate(order.shipping.estimatedDelivery)}
            {order.shipping.timeRemaining && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: '#666' }}>
                ({order.shipping.timeRemaining})
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderizar información de pago
  const renderPaymentInfo = (order) => {
    if (!order.paymentMethod) return null;

    const paymentMethodInfo = formatPaymentMethod(order.paymentMethod);
    const paymentStatusInfo = formatPaymentStatus(order.paymentStatus);

    return (
      <div className="payment-info">
        <div className="payment-header">
          <span className="payment-method">
            <span className="payment-icon">{paymentMethodInfo.icon}</span>
            {paymentMethodInfo.name}
          </span>
          <span
            className={`payment-status ${order.paymentStatus}`}
            style={{ backgroundColor: paymentStatusInfo.color + '20', color: paymentStatusInfo.color }}
          >
            {paymentStatusInfo.label}
          </span>
        </div>
        {order.currency && (
          <div className="payment-details">
            <span className="currency-info">
              Moneda: {order.currency}
            </span>
            {order.paymentReference && (
              <span className="payment-ref">
                Ref: {order.paymentReference}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="order-history">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando tu historial de pedidos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <div className="order-history">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadOrders} className="action-btn primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history">
      {/* Header con estadísticas */}
      <div className="order-history-header">
        <h1 className="order-history-title">Mis Pedidos</h1>

        {stats && (
          <div className="order-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.totalOrders}</span>
              <span className="stat-label">Total de pedidos</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatPrice(stats.totalSpent)}</span>
              <span className="stat-label">Total gastado</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatPrice(stats.averageOrderValue)}</span>
              <span className="stat-label">Promedio por pedido</span>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="order-filters">
        <div className="filter-group">
          <label className="filter-label">Estado:</label>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
          >
            <option value="all">Todos los pedidos</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmados</option>
            <option value="processing">Procesando</option>
            <option value="shipped">Enviados</option>
            <option value="delivered">Entregados</option>
            <option value="cancelled">Cancelados</option>
            <option value="completed">Completados</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Ordenar por:</label>
          <select
            className="filter-select"
            value={`${filters.sortBy}_${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('_');
              handleFilterChange({ sortBy, sortOrder });
            }}
          >
            <option value="createdAt_desc">Fecha (más reciente)</option>
            <option value="createdAt_asc">Fecha (más antiguo)</option>
            <option value="total_desc">Total (mayor)</option>
            <option value="total_asc">Total (menor)</option>
          </select>
        </div>
      </div>

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No tienes pedidos aún</h2>
          <p>Cuando realices tu primera compra, aparecerá aquí.</p>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <div className="order-number">Pedido #{order.orderNumber}</div>
                    <div className="order-date">{formatDate(order.createdAt)}</div>
                    {renderOrderStatus(order.status)}
                  </div>
                  <div className="order-total">{formatPrice(order.total)}</div>
                </div>

                {/* Items del pedido */}
                <div className="order-items">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="order-item">
                      <img
                        src={item.productImage || '/placeholder-product.png'}
                        alt={item.productName}
                        className="item-image"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                      <div className="item-details">
                        <div className="item-name">{item.productName}</div>
                        <div className="item-meta">
                          Cantidad: {item.quantity} × {formatPrice(item.price)}
                        </div>
                      </div>
                      <div className="item-price">{formatPrice(item.total)}</div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="order-item">
                      <div className="item-details">
                        <div className="item-meta">
                          Y {order.items.length - 3} producto{order.items.length - 3 > 1 ? 's' : ''} más...
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Información de pago */}
                {renderPaymentInfo(order)}

                {/* Información de envío */}
                {renderShippingInfo(order)}

                {/* Acciones */}
                <div className="order-actions">
                  <button
                    className="action-btn primary"
                    onClick={() => handleReorder(order._id)}
                    disabled={reordering === order._id}
                  >
                    {reordering === order._id ? 'Agregando...' : 'Reordenar'}
                  </button>
                  <button className="action-btn secondary">
                    Ver detalles
                  </button>
                  {order.shipping?.trackingUrl && (
                    <a
                      href={order.shipping.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn secondary"
                    >
                      Rastrear envío
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                Anterior
              </button>

              <span className="pagination-info">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistory;