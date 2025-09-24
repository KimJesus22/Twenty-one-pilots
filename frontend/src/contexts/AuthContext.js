import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// Provider simplificado
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Funciones básicas simplificadas
  const login = async (credentials) => {
    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const apiUrl = `${baseUrl}/api/auth/login`;
      console.log('🔗 Intentando login a URL:', apiUrl, 'desde origen:', window.location.origin);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        const userData = {
          _id: data.data.user.id,
          email: data.data.user.email,
          username: data.data.user.username,
          role: data.data.user.role
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.data.token);
        setUser(userData);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: data.message || 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const apiUrl = `${baseUrl}/api/auth/register`;
      console.log('🔗 Intentando register a URL:', apiUrl, 'desde origen:', window.location.origin);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        const userData = {
          _id: data.data.user.id,
          email: data.data.user.email,
          username: data.data.user.username,
          role: data.data.user.role
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.data.token);
        setUser(userData);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: data.message || 'Error en registro' };
      }
    } catch (error) {
      console.error('Register error:', error);
      setLoading(false);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAuthenticated = !!user;

  const isAdmin = user?.role === 'admin';

  // Verificar si hay usuario guardado al iniciar
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Limpiar datos inválidos
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      // Limpiar cualquier dato inconsistente
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}