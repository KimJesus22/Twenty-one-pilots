import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authAPI from '../api/auth';
import { setEncryptedItem } from '../utils/encryption';

const AuthContext = createContext();

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Verificar token al iniciar la aplicación
  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      setLoading(false);
      return;
    }

    try {
      setCheckingAuth(true);

      // Intentar verificar token con el backend
      try {
        const response = await authAPI.verifyToken();

        if (response.success) {
          const userData = JSON.parse(savedUser);
          setUser(userData);

          // Verificar si el token está próximo a expirar
          if (isTokenExpiringSoon(token)) {
            console.log('Token próximo a expirar, renovando...');
            refreshToken();
          }
        } else {
          // Token inválido, intentar refrescar
          const newToken = await refreshToken();
          if (!newToken) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (backendError) {
        console.warn('Backend no disponible para verificación de token, usando datos guardados:', backendError.message);

        // Fallback: usar datos guardados si el backend no está disponible
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (parseError) {
          console.error('Error parsing saved user data:', parseError);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Limpiar storage en caso de error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
      setCheckingAuth(false);
    }
  }, []);

  // Función para verificar si el token está expirado
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error verificando token:', error);
      return true;
    }
  }, []);

  // Función para verificar si el token está próximo a expirar (menos de 5 minutos)
  const isTokenExpiringSoon = useCallback((token) => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const fiveMinutes = 5 * 60; // 5 minutos en segundos
      return (payload.exp - currentTime) < fiveMinutes;
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
      return true;
    }
  }, []);

  // Función para refrescar el token automáticamente
  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const { token: newToken, user: userData } = data.data;

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return newToken;
      } else {
        // Token de refresh inválido, logout forzado
        logout();
        return null;
      }
    } catch (error) {
      console.error('Error refrescando token:', error);
      logout();
      return null;
    }
  }, []);

  // Función para hacer requests con renovación automática de token
  const authenticatedRequest = useCallback(async (url, options = {}) => {
    let token = localStorage.getItem('token');

    // Si no hay token o está expirado, intentar refrescar
    if (!token || isTokenExpired(token)) {
      token = await refreshToken();
      if (!token) {
        throw new Error('No se pudo renovar la autenticación');
      }
    }

    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    };

    let response = await fetch(url, config);

    // Si el token expiró durante la request, intentar refrescar y reintentar
    if (response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, config);
      }
    }

    return response;
  }, [isTokenExpired, refreshToken]);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Configurar renovación automática de token
  useEffect(() => {
    if (!user) return;

    // Verificar cada minuto si el token necesita renovación
    const interval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpiringSoon(token)) {
        console.log('Token próximo a expirar, renovando automáticamente...');
        await refreshToken();
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [user, isTokenExpiringSoon, refreshToken]);

  // Login con backend real y fallback
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      try {
        // Intentar con backend real
        const response = await authAPI.login(credentials);

        if (response.success) {
          const { user: userData, token } = response.data;

          // Guardar en localStorage cifrado
          await setEncryptedItem('token', token);
          await setEncryptedItem('user', userData);

          setUser(userData);
          return { success: true };
        } else {
          throw new Error(response.message || 'Error en el inicio de sesión');
        }
      } catch (backendError) {
        console.warn('Backend no disponible para login, usando simulación:', backendError.message);

        // Fallback a simulación si el backend no está disponible
        if (credentials.email === 'admin@top.com' && credentials.password === 'admin123') {
          const userData = {
            _id: 'admin123',
            email: 'admin@top.com',
            username: 'admin',
            role: 'admin'
          };
          const token = 'fake-jwt-token-admin';

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);

          return { success: true };
        } else if (credentials.email === 'user@top.com' && credentials.password === 'user123') {
          const userData = {
            _id: 'user123',
            email: 'user@top.com',
            username: 'fan123',
            role: 'user'
          };
          const token = 'fake-jwt-token-user';

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);

          return { success: true };
        } else {
          throw new Error('Credenciales inválidas');
        }
      }
    } catch (err) {
      const errorMessage = err.message || 'Error en el inicio de sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Registro con backend real y fallback
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      try {
        // Intentar con backend real
        const response = await authAPI.register(userData);

        if (response.success) {
          const { user: newUser, token } = response.data;

          // Guardar en localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(newUser));

          setUser(newUser);
          return { success: true };
        } else {
          throw new Error(response.message || 'Error en el registro');
        }
      } catch (backendError) {
        console.warn('Backend no disponible para registro, usando simulación:', backendError.message);

        // Fallback a simulación si el backend no está disponible
        const newUser = {
          _id: Date.now().toString(),
          email: userData.email,
          username: userData.username,
          role: 'user'
        };
        const token = 'fake-jwt-token-' + newUser._id;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);

        return { success: true };
      }
    } catch (err) {
      const errorMessage = err.message || 'Error en el registro';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);

      // Llamar al backend para invalidar el token
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout API call failed:', err);
    } finally {
      // Siempre limpiar el estado local, incluso si la API falla
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  // Verificar si es admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Verificar si tiene un rol específico
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Actualizar datos del usuario
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Actualizar perfil
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.updateProfile(userData);

      if (response.success) {
        updateUser(response.data.user);
        return { success: true };
      } else {
        throw new Error(response.message || 'Error al actualizar perfil');
      }
    } catch (err) {
      const errorMessage = err.message || 'Error al actualizar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.changePassword(passwordData);

      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.message || 'Error al cambiar contraseña');
      }
    } catch (err) {
      const errorMessage = err.message || 'Error al cambiar contraseña';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    checkingAuth,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    hasRole,
    updateUser,
    updateProfile,
    changePassword,
    authenticatedRequest,
    refreshToken,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}