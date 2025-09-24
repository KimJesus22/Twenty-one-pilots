import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import OrderHistory from '../components/OrderHistory';
import OrderTracking from '../components/OrderTracking';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const { formatPrice } = useUserPreferences();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Formatear fecha de registro
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Renderizar información del perfil
  const renderProfileInfo = () => (
    <div className="profile-info">
      <div className="info-grid">
        <div className="info-item">
          <div className="info-label">Nombre de usuario</div>
          <div className="info-value">{user?.username || 'No disponible'}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Correo electrónico</div>
          <div className="info-value">{user?.email || 'No disponible'}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Rol</div>
          <div className="info-value">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Fecha de registro</div>
          <div className="info-value">
            {user?.createdAt ? formatDate(user.createdAt) : 'No disponible'}
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">Artistas favoritos</div>
          <div className="info-value">
            {user?.followedArtists?.length || 0} artistas
          </div>
        </div>

        <div className="info-item">
          <div className="info-label">Playlists creadas</div>
          <div className="info-value">
            {user?.playlists?.length || 0} playlists
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar historial de pedidos
  const renderOrderHistory = () => (
    <div className="orders-section">
      <OrderHistory />
    </div>
  );

  // Renderizar seguimiento de pedido
  const renderOrderTracking = () => {
    if (!selectedOrderId) {
      return (
        <div className="order-tracking-placeholder">
          <div className="placeholder-content">
            <h2>Seguimiento de pedidos</h2>
            <p>Selecciona un pedido de tu historial para ver el seguimiento en tiempo real.</p>
          </div>
        </div>
      );
    }

    return (
      <OrderTracking
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    );
  };

  // Renderizar contenido según la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileInfo();
      case 'orders':
        return renderOrderHistory();
      case 'tracking':
        return renderOrderTracking();
      default:
        return renderProfileInfo();
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">Mi Perfil</h1>
        <p className="profile-subtitle">Gestiona tu cuenta y pedidos</p>
      </div>

      {/* Navegación de pestañas */}
      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Información del perfil
        </button>
        <button
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Historial de pedidos
        </button>
        <button
          className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          Seguimiento de envíos
        </button>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Profile;