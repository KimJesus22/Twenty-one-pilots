import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrderTracking, formatShippingStatus } from '../api/orders';
import { useOrderPersistence } from '../hooks/useOrderPersistence';
import './OrderTracking.css';

const OrderTracking = ({ orderId, onClose }) => {
  const { user } = useAuth();
  const { saveTrackingData, loadTrackingData } = useOrderPersistence();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  // Pasos del proceso de envío
  const shippingSteps = [
    { key: 'pending', label: 'Pendiente', icon: '⏳' },
    { key: 'picked_up', label: 'Recogido', icon: '📦' },
    { key: 'in_transit', label: 'En tránsito', icon: '🚚' },
    { key: 'out_for_delivery', label: 'En reparto', icon: '🚚' },
    { key: 'delivered', label: 'Entregado', icon: '✅' }
  ];

  // Cargar datos de seguimiento
  const fetchTrackingData = useCallback(async () => {
    if (!orderId || !user?._id) return;

    try {
      setRefreshing(true);
      setError(null);

      const response = await getOrderTracking(orderId, user._id);
      setTrackingData(response.data);

      // Guardar en localStorage
      saveTrackingData(orderId, response.data);
    } catch (err) {
      console.error('Error loading tracking data:', err);

      // Intentar cargar desde cache
      const cachedData = loadTrackingData(orderId);
      if (cachedData) {
        setTrackingData(cachedData);
        setUsingCache(true);
        setError(null);
      } else {
        setError(err.message || 'Error al cargar el seguimiento');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, user?._id, saveTrackingData, loadTrackingData]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Auto-refresh cada 5 minutos si el pedido no está entregado
  useEffect(() => {
    if (!trackingData || trackingData.currentStatus === 'delivered') return;

    const interval = setInterval(() => {
      fetchTrackingData();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [trackingData, fetchTrackingData]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener el paso actual
  const getCurrentStepIndex = () => {
    if (!trackingData) return 0;
    return shippingSteps.findIndex(step => step.key === trackingData.currentStatus);
  };

  // Renderizar icono de estado
  const renderStatusIcon = (status) => {
    const statusMap = {
      pending: '⏳',
      picked_up: '📦',
      in_transit: '🚚',
      out_for_delivery: '🚚',
      delivered: '✅',
      failed: '❌',
      returned: '↩️'
    };
    return statusMap[status] || '❓';
  };

  // Renderizar barra de progreso
  const renderProgressBar = () => {
    if (!trackingData) return null;

    const progress = trackingData.progress || 0;
    const currentStepIndex = getCurrentStepIndex();

    return (
      <div className="progress-section">
        <h3 className="progress-title">Progreso del envío</h3>

        <div className="progress-visual">
          <div className="progress-steps">
            {shippingSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`progress-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="step-icon">
                    {step.icon}
                  </div>
                  <div className="step-label">{step.label}</div>
                </div>
              );
            })}
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className={`progress-text ${trackingData.isDelayed ? 'delayed' : ''}`}>
            {progress.toFixed(0)}% completado
            {trackingData.isDelayed && ' - Retrasado'}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar información de entrega
  const renderDeliveryInfo = () => {
    if (!trackingData) return null;

    return (
      <div className="delivery-info">
        <h3 className="delivery-title">Información de entrega</h3>

        <div className="delivery-grid">
          <div className="delivery-item">
            <div className="delivery-label">Número de seguimiento</div>
            <div className="delivery-value highlight">{trackingData.trackingNumber}</div>
          </div>

          <div className="delivery-item">
            <div className="delivery-label">Transportista</div>
            <div className="delivery-value">{trackingData.carrierName || trackingData.carrier.toUpperCase()}</div>
          </div>

          <div className="delivery-item">
            <div className="delivery-label">Estado actual</div>
            <div className="delivery-value">{formatShippingStatus(trackingData.currentStatus).label}</div>
          </div>

          <div className="delivery-item">
            <div className="delivery-label">Entrega estimada</div>
            <div className="delivery-value">
              {trackingData.estimatedDelivery ? formatDate(trackingData.estimatedDelivery) : 'No disponible'}
            </div>
          </div>

          {trackingData.actualDelivery && (
            <div className="delivery-item">
              <div className="delivery-label">Entregado el</div>
              <div className="delivery-value highlight">{formatDate(trackingData.actualDelivery)}</div>
            </div>
          )}

          {trackingData.timeRemaining && (
            <div className="delivery-item">
              <div className="delivery-label">Tiempo restante</div>
              <div className="delivery-value">{trackingData.timeRemaining}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar historial de actualizaciones
  const renderUpdatesHistory = () => {
    if (!trackingData?.updates || trackingData.updates.length === 0) return null;

    return (
      <div className="updates-section">
        <h3 className="updates-title">Historial de actualizaciones</h3>

        <div className="updates-list">
          {trackingData.updates.map((update, index) => (
            <div key={index} className={`update-item ${update.status}`}>
              <div className="update-icon">
                {renderStatusIcon(update.status)}
              </div>

              <div className="update-content">
                <div className="update-description">{update.description}</div>
                {update.location && (
                  <div className="update-location">
                    📍 {update.location.city}, {update.location.state}
                    {update.location.postalCode && ` ${update.location.postalCode}`}
                  </div>
                )}
                <div className="update-timestamp">{formatDate(update.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="order-tracking">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando información de seguimiento...</p>
          {usingCache && (
            <p className="cache-notice">Mostrando datos almacenados localmente</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="order-tracking">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchTrackingData} className="refresh-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // No tracking data
  if (!trackingData) {
    return (
      <div className="order-tracking">
        <div className="error-state">
          <p>No se encontró información de seguimiento para este pedido.</p>
        </div>
      </div>
    );
  }

  const statusInfo = formatShippingStatus(trackingData.currentStatus);

  return (
    <div className="order-tracking">
      {/* Header */}
      <div className="tracking-header">
        <h1 className="tracking-title">Seguimiento de pedido</h1>
        <p className="tracking-subtitle">Pedido #{trackingData.orderNumber}</p>
      </div>

      {/* Resumen del pedido */}
      <div className="order-summary">
        <div className="summary-row">
          <span className="summary-label">Pedido:</span>
          <span className="summary-value">#{trackingData.orderNumber}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Seguimiento:</span>
          <span className="summary-highlight">{trackingData.trackingNumber}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Última actualización:</span>
          <span className="summary-value">
            {trackingData.lastSync ? formatDate(trackingData.lastSync) : 'Nunca'}
          </span>
        </div>
      </div>

      {/* Estado actual */}
      <div className="current-status">
        <span className="status-icon">{renderStatusIcon(trackingData.currentStatus)}</span>
        <h2 className="status-title">{statusInfo.label}</h2>
        <p className="status-description">{trackingData.currentDescription}</p>
        {trackingData.currentLocation && (
          <p className="status-meta">
            📍 {trackingData.currentLocation.city}, {trackingData.currentLocation.state}
          </p>
        )}
      </div>

      {/* Barra de progreso */}
      {renderProgressBar()}

      {/* Información de entrega */}
      {renderDeliveryInfo()}

      {/* Historial de actualizaciones */}
      {renderUpdatesHistory()}

      {/* Acciones */}
      <div className="tracking-actions">
        <button
          className="action-btn primary"
          onClick={fetchTrackingData}
          disabled={refreshing}
        >
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>

        {trackingData.trackingUrl && (
          <a
            href={trackingData.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn secondary"
          >
            Ver en sitio del transportista
          </a>
        )}

        {onClose && (
          <button onClick={onClose} className="action-btn secondary">
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;