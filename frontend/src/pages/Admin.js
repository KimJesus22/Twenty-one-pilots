import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Usuarios', icon: '👥' },
    { id: 'products', label: 'Productos', icon: '📦' },
    { id: 'albums', label: 'Álbumes', icon: '🎵' },
    { id: 'orders', label: 'Pedidos', icon: '🛒' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'users':
        return <UsersTab />;
      case 'products':
        return <ProductsTab />;
      case 'albums':
        return <AlbumsTab />;
      case 'orders':
        return <OrdersTab />;
      case 'analytics':
        return <AnalyticsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="admin">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido, {user?.username} (Admin)</p>
      </div>

      <div className="admin-content">
        <div className="admin-sidebar">
          <nav className="admin-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="admin-main">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Componentes de las pestañas
const DashboardTab = () => (
  <div className="admin-tab">
    <h2>Dashboard</h2>
    <div className="dashboard-stats">
      <div className="stat-card">
        <h3>Total Usuarios</h3>
        <div className="stat-number">1,234</div>
      </div>
      <div className="stat-card">
        <h3>Productos Activos</h3>
        <div className="stat-number">89</div>
      </div>
      <div className="stat-card">
        <h3>Pedidos del Mes</h3>
        <div className="stat-number">156</div>
      </div>
      <div className="stat-card">
        <h3>Ingresos</h3>
        <div className="stat-number">$12,345</div>
      </div>
    </div>
  </div>
);

const UsersTab = () => (
  <div className="admin-tab">
    <h2>Gestión de Usuarios</h2>
    <p>Funcionalidad para gestionar usuarios del sistema.</p>
    <div className="coming-soon">
      <h3>Próximamente</h3>
      <p>Esta funcionalidad estará disponible en futuras actualizaciones.</p>
    </div>
  </div>
);

const ProductsTab = () => (
  <div className="admin-tab">
    <h2>Gestión de Productos</h2>
    <p>Funcionalidad para gestionar productos de la tienda.</p>
    <div className="coming-soon">
      <h3>Próximamente</h3>
      <p>Esta funcionalidad estará disponible en futuras actualizaciones.</p>
    </div>
  </div>
);

const AlbumsTab = () => (
  <div className="admin-tab">
    <h2>Gestión de Álbumes</h2>
    <p>Funcionalidad para gestionar álbumes y canciones.</p>
    <div className="coming-soon">
      <h3>Próximamente</h3>
      <p>Esta funcionalidad estará disponible en futuras actualizaciones.</p>
    </div>
  </div>
);

const OrdersTab = () => (
  <div className="admin-tab">
    <h2>Gestión de Pedidos</h2>
    <p>Funcionalidad para gestionar pedidos de la tienda.</p>
    <div className="coming-soon">
      <h3>Próximamente</h3>
      <p>Esta funcionalidad estará disponible en futuras actualizaciones.</p>
    </div>
  </div>
);

const AnalyticsTab = () => (
  <div className="admin-tab">
    <h2>Analytics</h2>
    <p>Estadísticas y análisis del sistema.</p>
    <div className="coming-soon">
      <h3>Próximamente</h3>
      <p>Esta funcionalidad estará disponible en futuras actualizaciones.</p>
    </div>
  </div>
);

export default Admin;