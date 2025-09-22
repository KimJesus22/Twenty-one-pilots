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
    // Simulación básica para desarrollo
    if (credentials.email === 'admin@top.com' && credentials.password === 'admin123') {
      const userData = {
        _id: 'admin123',
        email: 'admin@top.com',
        username: 'admin',
        role: 'admin'
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: 'Credenciales inválidas' };
  };

  const register = async (userData) => {
    setLoading(true);
    // Simulación básica
    const newUser = {
      _id: Date.now().toString(),
      email: userData.email,
      username: userData.username,
      role: 'user'
    };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setLoading(false);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Verificar si hay usuario guardado al iniciar
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
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