import { useState, useEffect, useCallback } from 'react';
import ForumUtils from '../utils/forumUtils';

/**
 * Hook personalizado para gestionar estadísticas de usuario y reputación
 * @param {Object} initialStats - Estadísticas iniciales del usuario
 * @returns {Object} Estado y funciones para gestionar estadísticas
 */
export const useUserStats = (initialStats = {}) => {
  const [userStats, setUserStats] = useState({
    threadsCreated: 0,
    commentsCreated: 0,
    likesReceived: 0,
    dislikesReceived: 0,
    threadViews: 0,
    commentViews: 0,
    helpfulComments: 0,
    firstThread: false,
    isModerator: false,
    accountAge: 0, // en días
    ...initialStats
  });

  // Calcular reputación automáticamente
  const reputation = ForumUtils.calculateReputation(userStats);
  const badges = ForumUtils.getUserBadges(userStats);
  const primaryBadge = ForumUtils.getPrimaryBadge(userStats);
  const nextBadge = ForumUtils.getNextBadge(userStats);

  /**
   * Actualiza las estadísticas después de una acción
   * @param {string} action - Tipo de acción realizada
   * @param {Object} data - Datos adicionales
   */
  const updateStats = useCallback((action, data = {}) => {
    setUserStats(prevStats => {
      const newStats = ForumUtils.updateUserStats(prevStats, action, data);

      // Persistir en localStorage para usuarios no autenticados
      try {
        localStorage.setItem('userForumStats', JSON.stringify(newStats));
      } catch (error) {
        console.warn('No se pudieron guardar las estadísticas en localStorage:', error);
      }

      return newStats;
    });
  }, []);

  /**
   * Carga estadísticas desde localStorage al inicializar
   */
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('userForumStats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setUserStats(prevStats => ({ ...prevStats, ...parsedStats }));
      }
    } catch (error) {
      console.warn('Error al cargar estadísticas desde localStorage:', error);
    }
  }, []);

  /**
   * Resetea las estadísticas (útil para testing)
   */
  const resetStats = useCallback(() => {
    const defaultStats = {
      threadsCreated: 0,
      commentsCreated: 0,
      likesReceived: 0,
      dislikesReceived: 0,
      threadViews: 0,
      commentViews: 0,
      helpfulComments: 0,
      firstThread: false,
      isModerator: false,
      accountAge: 0
    };
    setUserStats(defaultStats);
    localStorage.removeItem('userForumStats');
  }, []);

  /**
   * Actualiza estadísticas desde el servidor (para usuarios autenticados)
   * @param {Object} serverStats - Estadísticas desde el backend
   */
  const syncWithServer = useCallback((serverStats) => {
    setUserStats(prevStats => ({
      ...prevStats,
      ...serverStats,
      // Mantener algunas propiedades locales que no vienen del servidor
      accountAge: prevStats.accountAge,
      isModerator: prevStats.isModerator
    }));
  }, []);

  return {
    // Estado actual
    userStats,
    reputation,
    badges,
    primaryBadge,
    nextBadge,

    // Funciones
    updateStats,
    resetStats,
    syncWithServer,

    // Utilidades
    hasBadge: (badgeKey) => badges.some(badge => badge.key === badgeKey && badge.unlocked),
    getBadgeProgress: (badgeKey) => {
      const badge = ForumUtils.BADGES[badgeKey];
      if (!badge || badge.special) return null;

      const progress = Math.min(100, (reputation / badge.minPoints) * 100);
      return {
        current: reputation,
        target: badge.minPoints,
        progress,
        remaining: Math.max(0, badge.minPoints - reputation)
      };
    }
  };
};

export default useUserStats;