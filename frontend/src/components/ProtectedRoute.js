import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requiredRole = null,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, hasRole, loading, checkingAuth } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading || checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '18px',
        color: '#666'
      }}>
        Verificando autenticación...
      </div>
    );
  }

  // Si requiere autenticación y no está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Si no requiere autenticación pero está autenticado (ej: páginas de login)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si requiere un rol específico y el usuario no lo tiene
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#666'
      }}>
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta página.</p>
        <p>Se requiere el rol: <strong>{requiredRole}</strong></p>
      </div>
    );
  }

  return children;
};

// Componente HOC para proteger componentes individuales
export const withAuth = (WrappedComponent, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// Componente para proteger acciones específicas (botones, etc.)
export const ProtectedAction = ({
  children,
  requiredRole = null,
  fallback = null,
  showMessage = true
}) => {
  const { isAuthenticated, hasRole } = useAuth();

  // Si requiere autenticación y no está autenticado
  if (!isAuthenticated) {
    if (showMessage) {
      return (
        <div style={{ color: '#666', fontSize: '14px' }}>
          Debes iniciar sesión para realizar esta acción
        </div>
      );
    }
    return fallback;
  }

  // Si requiere un rol específico y el usuario no lo tiene
  if (requiredRole && !hasRole(requiredRole)) {
    if (showMessage) {
      return (
        <div style={{ color: '#d32f2f', fontSize: '14px' }}>
          No tienes permisos para realizar esta acción
        </div>
      );
    }
    return fallback;
  }

  return children;
};

export default ProtectedRoute;