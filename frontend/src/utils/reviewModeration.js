/**
 * Utilidades de moderación para reseñas de productos
 * Extiende el sistema de moderación del foro para contenido de reseñas
 */

import ForumUtils from './forumUtils';

export class ReviewModerationUtils {
  /**
   * Aplica moderación automática a una reseña
   * @param {Object} reviewData - Datos de la reseña
   * @param {Object} userHistory - Historial del usuario
   * @returns {Object} Resultado de la moderación
   */
  static applyAutoModeration(reviewData, userHistory = {}) {
    try {
      const { title, comment } = reviewData;

      // Combinar título y comentario para análisis
      const fullContent = `${title} ${comment}`;

      // Usar el sistema de moderación del foro
      const contentAnalysis = ForumUtils.filterProfanity(fullContent);

      // Determinar acción basada en análisis y historial
      const moderationAction = ForumUtils.getAutoModerationAction(contentAnalysis, userHistory);

      return {
        shouldApprove: moderationAction.action === null,
        shouldHide: moderationAction.action === ForumUtils.MODERATION_ACTIONS.DELETE_CONTENT,
        shouldWarn: moderationAction.action === ForumUtils.MODERATION_ACTIONS.WARN,
        moderationReason: moderationAction.reason,
        severity: contentAnalysis.severity,
        hasProfanity: contentAnalysis.hasProfanity,
        badWords: contentAnalysis.badWords,
        censoredContent: contentAnalysis.hasProfanity ? contentAnalysis.censoredText : fullContent
      };
    } catch (error) {
      console.warn('Error en moderación automática de reseñas:', error);
      return {
        shouldApprove: false, // Marcar como pendiente para revisión manual
        shouldHide: false,
        shouldWarn: false,
        moderationReason: 'Error en moderación automática',
        severity: 'unknown',
        hasProfanity: false,
        badWords: [],
        censoredContent: reviewData.comment
      };
    }
  }

  /**
   * Calcula la duración de suspensión para reseñas ofensivas
   * @param {Object} userHistory - Historial del usuario
   * @returns {Object} Duración de suspensión
   */
  static calculateReviewSuspensionDuration(userHistory) {
    return ForumUtils.calculateSuspensionDuration(userHistory);
  }

  /**
   * Verifica si un usuario puede dejar reseñas
   * @param {Object} user - Usuario
   * @param {Array} activeBlocks - Bloqueos activos
   * @returns {Object} Estado de permisos
   */
  static canLeaveReview(user, activeBlocks = []) {
    // Verificar bloqueos generales
    const blockStatus = ForumUtils.checkUserBlockStatus(user, activeBlocks);

    if (blockStatus.isBlocked) {
      return {
        canLeave: false,
        reason: blockStatus.reason,
        blockType: blockStatus.blockType,
        expiresAt: blockStatus.expiresAt
      };
    }

    // Verificar permisos específicos para reseñas
    // Aquí se podrían agregar reglas específicas para reseñas

    return {
      canLeave: true,
      reason: null
    };
  }

  /**
   * Genera log de moderación para reseñas
   * @param {Object} moderationData - Datos de moderación
   * @returns {Object} Log formateado
   */
  static generateReviewModerationLog(moderationData) {
    return ForumUtils.generateModerationLog({
      ...moderationData,
      targetType: 'review'
    });
  }

  /**
   * Valida la intensidad de reportes en reseñas
   * @param {Object} report - Reporte a validar
   * @param {Array} existingReports - Reportes existentes
   * @returns {Object} Validación del reporte
   */
  static validateReviewReportIntensity(report, existingReports = []) {
    return ForumUtils.validateReportIntensity(report, existingReports);
  }

  /**
   * Verifica si una reseña puede ser moderada por un usuario
   * @param {Object} user - Usuario que intenta moderar
   * @param {Object} review - Reseña a moderar
   * @returns {Object} Resultado de validación
   */
  static canModerateReview(user, review) {
    return ForumUtils.canModerate(user, review.customer);
  }

  /**
   * Constantes específicas para moderación de reseñas
   */
  static REVIEW_MODERATION_ACTIONS = {
    APPROVE: 'approve',
    HIDE: 'hide',
    DELETE: 'delete',
    WARN_USER: 'warn_user',
    SUSPEND_USER: 'suspend_user'
  };

  static REVIEW_REPORT_REASONS = {
    SPAM: 'spam',
    OFFENSIVE: 'offensive',
    INAPPROPRIATE: 'inappropriate',
    FALSE_INFO: 'false_information',
    HARASSMENT: 'harassment',
    HATE_SPEECH: 'hate_speech',
    OTHER: 'other'
  };

  /**
   * Aplica reglas específicas de reseñas
   * @param {Object} reviewData - Datos de la reseña
   * @returns {Object} Validación de reglas
   */
  static validateReviewRules(reviewData) {
    const { rating, title, comment } = reviewData;
    const errors = [];

    // Validar calificación
    if (!rating || rating < 1 || rating > 5) {
      errors.push('La calificación debe estar entre 1 y 5 estrellas');
    }

    // Validar título
    if (!title || title.trim().length < 5) {
      errors.push('El título debe tener al menos 5 caracteres');
    }

    if (title && title.length > 100) {
      errors.push('El título no puede exceder 100 caracteres');
    }

    // Validar comentario
    if (!comment || comment.trim().length < 10) {
      errors.push('El comentario debe tener al menos 10 caracteres');
    }

    if (comment && comment.length > 1000) {
      errors.push('El comentario no puede exceder 1000 caracteres');
    }

    // Verificar contenido duplicado (simplificado)
    // En producción, esto requeriría comparación con reseñas existentes

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calcula puntuación de calidad para reseñas
   * @param {Object} reviewData - Datos de la reseña
   * @returns {number} Puntuación de calidad (0-100)
   */
  static calculateReviewQualityScore(reviewData) {
    let score = 50; // Puntuación base

    const { title, comment, images, verified } = reviewData;

    // Longitud del título (ideal: 20-60 caracteres)
    if (title) {
      const titleLength = title.length;
      if (titleLength >= 20 && titleLength <= 60) {
        score += 10;
      } else if (titleLength < 10 || titleLength > 80) {
        score -= 5;
      }
    }

    // Longitud del comentario (más largo = mejor)
    if (comment) {
      const commentLength = comment.length;
      if (commentLength > 100) {
        score += 15;
      } else if (commentLength > 50) {
        score += 10;
      } else if (commentLength < 20) {
        score -= 10;
      }
    }

    // Imágenes adjuntas
    if (images && images.length > 0) {
      score += 10;
    }

    // Compra verificada
    if (verified) {
      score += 15;
    }

    // Limitar entre 0 y 100
    return Math.max(0, Math.min(100, score));
  }
}

export default ReviewModerationUtils;