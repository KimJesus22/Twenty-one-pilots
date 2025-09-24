/**
 * Utilidades para el procesamiento de menciones, etiquetas y sistema de reputación en el frontend
 */

export class ForumUtils {
  // Sistema de reputación y badges
  static BADGES = {
    // Badges por hitos de reputación
    'newbie': { name: 'forum.badges.newbie', icon: '🌱', minPoints: 0, description: 'forum.badges.newbieDesc' },
    'contributor': { name: 'forum.badges.contributor', icon: '📝', minPoints: 10, description: 'forum.badges.contributorDesc' },
    'active': { name: 'forum.badges.active', icon: '⚡', minPoints: 50, description: 'forum.badges.activeDesc' },
    'expert': { name: 'forum.badges.expert', icon: '🧠', minPoints: 100, description: 'forum.badges.expertDesc' },
    'guru': { name: 'forum.badges.guru', icon: '🎓', minPoints: 250, description: 'forum.badges.guruDesc' },
    'legend': { name: 'forum.badges.legend', icon: '👑', minPoints: 500, description: 'forum.badges.legendDesc' },

    // Badges especiales por acciones
    'firstThread': { name: 'forum.badges.firstThread', icon: '🎯', special: true, description: 'forum.badges.firstThreadDesc' },
    'helpful': { name: 'forum.badges.helpful', icon: '🤝', special: true, description: 'forum.badges.helpfulDesc' },
    'moderator': { name: 'forum.badges.moderator', icon: '🛡️', special: true, description: 'forum.badges.moderatorDesc' },
    'veteran': { name: 'forum.badges.veteran', icon: '🏆', special: true, description: 'forum.badges.veteranDesc' }
  };

  // Puntos por acciones
  static ACTION_POINTS = {
    CREATE_THREAD: 5,
    CREATE_COMMENT: 2,
    RECEIVE_LIKE: 1,
    RECEIVE_DISLIKE: -1,
    THREAD_VIEWED: 0.1, // Puntos fraccionales por vistas
    COMMENT_VIEWED: 0.05,
    FIRST_THREAD: 10, // Bonus por primer hilo
    HELPFUL_COMMENT: 3 // Bonus por comentario marcado como útil
  };

  /**
   * Calcula los puntos de reputación de un usuario basado en sus acciones
   * @param {Object} userStats - Estadísticas del usuario
   * @returns {number} Puntos totales de reputación
   */
  static calculateReputation(userStats) {
    if (!userStats) return 0;

    let points = 0;

    // Puntos por contenido creado
    points += (userStats.threadsCreated || 0) * this.ACTION_POINTS.CREATE_THREAD;
    points += (userStats.commentsCreated || 0) * this.ACTION_POINTS.CREATE_COMMENT;

    // Puntos por interacciones
    points += (userStats.likesReceived || 0) * this.ACTION_POINTS.RECEIVE_LIKE;
    points += (userStats.dislikesReceived || 0) * this.ACTION_POINTS.RECEIVE_DISLIKE;

    // Puntos por vistas (fraccionales)
    points += (userStats.threadViews || 0) * this.ACTION_POINTS.THREAD_VIEWED;
    points += (userStats.commentViews || 0) * this.ACTION_POINTS.COMMENT_VIEWED;

    // Bonus especiales
    if (userStats.firstThread) points += this.ACTION_POINTS.FIRST_THREAD;
    if (userStats.helpfulComments) points += userStats.helpfulComments * this.ACTION_POINTS.HELPFUL_COMMENT;

    return Math.max(0, Math.round(points)); // No permitir puntos negativos
  }

  /**
   * Obtiene los badges que un usuario ha desbloqueado
   * @param {Object} userStats - Estadísticas del usuario
   * @returns {Array} Array de badges desbloqueados
   */
  static getUserBadges(userStats) {
    if (!userStats) return [];

    const reputation = this.calculateReputation(userStats);
    const badges = [];

    // Badges por reputación
    Object.entries(this.BADGES).forEach(([key, badge]) => {
      if (!badge.special) {
        if (reputation >= badge.minPoints) {
          badges.push({ ...badge, key, unlocked: true });
        }
      }
    });

    // Badges especiales
    if (userStats.firstThread) {
      badges.push({ ...this.BADGES.firstThread, key: 'firstThread', unlocked: true });
    }
    if (userStats.helpfulComments && userStats.helpfulComments > 0) {
      badges.push({ ...this.BADGES.helpful, key: 'helpful', unlocked: true });
    }
    if (userStats.isModerator) {
      badges.push({ ...this.BADGES.moderator, key: 'moderator', unlocked: true });
    }
    if (userStats.accountAge && userStats.accountAge > 365) { // Más de 1 año
      badges.push({ ...this.BADGES.veteran, key: 'veteran', unlocked: true });
    }

    return badges;
  }

  /**
   * Obtiene el badge principal (el más alto desbloqueado)
   * @param {Object} userStats - Estadísticas del usuario
   * @returns {Object|null} Badge principal o null
   */
  static getPrimaryBadge(userStats) {
    const badges = this.getUserBadges(userStats);
    if (badges.length === 0) return null;

    // Priorizar badges especiales sobre los de reputación
    const specialBadges = badges.filter(badge => badge.special);
    if (specialBadges.length > 0) {
      return specialBadges[0]; // Retornar el primero especial
    }

    // Si no hay especiales, retornar el de mayor reputación
    return badges.sort((a, b) => (b.minPoints || 0) - (a.minPoints || 0))[0];
  }

  /**
   * Obtiene el siguiente badge que el usuario puede desbloquear
   * @param {Object} userStats - Estadísticas del usuario
   * @returns {Object|null} Próximo badge o null si ya tiene todos
   */
  static getNextBadge(userStats) {
    const reputation = this.calculateReputation(userStats);

    let nextBadge = null;
    let minDifference = Infinity;

    Object.entries(this.BADGES).forEach(([key, badge]) => {
      if (!badge.special && reputation < badge.minPoints) {
        const difference = badge.minPoints - reputation;
        if (difference < minDifference) {
          minDifference = difference;
          nextBadge = { ...badge, key };
        }
      }
    });

    return nextBadge;
  }

  /**
   * Actualiza las estadísticas del usuario después de una acción
   * @param {Object} userStats - Estadísticas actuales
   * @param {string} action - Tipo de acción realizada
   * @param {Object} data - Datos adicionales de la acción
   * @returns {Object} Nuevas estadísticas
   */
  static updateUserStats(userStats, action, data = {}) {
    const newStats = { ...userStats };

    switch (action) {
      case 'CREATE_THREAD':
        newStats.threadsCreated = (newStats.threadsCreated || 0) + 1;
        if (!newStats.firstThread && newStats.threadsCreated === 1) {
          newStats.firstThread = true;
        }
        break;

      case 'CREATE_COMMENT':
        newStats.commentsCreated = (newStats.commentsCreated || 0) + 1;
        break;

      case 'RECEIVE_LIKE':
        newStats.likesReceived = (newStats.likesReceived || 0) + 1;
        break;

      case 'RECEIVE_DISLIKE':
        newStats.dislikesReceived = (newStats.dislikesReceived || 0) + 1;
        break;

      case 'THREAD_VIEWED':
        newStats.threadViews = (newStats.threadViews || 0) + 1;
        break;

      case 'COMMENT_VIEWED':
        newStats.commentViews = (newStats.commentViews || 0) + 1;
        break;

      case 'HELPFUL_COMMENT':
        newStats.helpfulComments = (newStats.helpfulComments || 0) + 1;
        break;

      default:
        break;
    }

    // Recalcular reputación
    newStats.reputation = this.calculateReputation(newStats);
    newStats.badges = this.getUserBadges(newStats);

    return newStats;
  }

  /**
   * Extrae menciones (@username) de un texto
   * @param {string} text - Texto a procesar
   * @returns {Array} Array de usernames mencionados (sin @)
   */
  static extractMentions(text) {
    if (!text) return [];

    // Regex para encontrar @username (letras, números, guiones, puntos)
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      if (!mentions.includes(username)) {
        mentions.push(username);
      }
    }

    return mentions;
  }

  /**
   * Extrae etiquetas (#tag) de un texto
   * @param {string} text - Texto a procesar
   * @returns {Array} Array de tags (sin #)
   */
  static extractTags(text) {
    if (!text) return [];

    // Regex para encontrar #tag (letras, números, guiones, puntos)
    const tagRegex = /#([a-zA-Z0-9._-]+)/g;
    const tags = [];
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      const tag = match[1].toLowerCase();
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Procesa el contenido para resaltar menciones y etiquetas
   * @param {string} text - Texto a procesar
   * @returns {string} HTML con menciones y etiquetas resaltadas
   */
  static processContent(text) {
    if (!text) return '';

    let processedText = text;

    // Resaltar menciones
    processedText = processedText.replace(
      /@([a-zA-Z0-9._-]+)/g,
      '<span class="mention">@$1</span>'
    );

    // Resaltar etiquetas
    processedText = processedText.replace(
      /#([a-zA-Z0-9._-]+)/g,
      '<span class="hashtag">#$1</span>'
    );

    return processedText;
  }

  /**
   * Convierte texto plano con menciones/tags a HTML
   * @param {string} text - Texto a procesar
   * @returns {string} HTML procesado
   */
  static textToHtml(text) {
    if (!text) return '';

    // Escapar HTML primero
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Convertir saltos de línea a <br>
    html = html.replace(/\n/g, '<br>');

    // Resaltar menciones
    html = html.replace(
      /@([a-zA-Z0-9._-]+)/g,
      '<span class="mention">@$1</span>'
    );

    // Resaltar etiquetas
    html = html.replace(
      /#([a-zA-Z0-9._-]+)/g,
      '<span class="hashtag">#$1</span>'
    );

    return html;
  }

  /**
   * Obtiene el cursor position en un textarea
   * @param {HTMLTextAreaElement} textarea
   * @returns {number} Posición del cursor
   */
  static getCursorPosition(textarea) {
    return textarea.selectionStart;
  }

  /**
   * Inserta texto en una posición específica del textarea
   * @param {HTMLTextAreaElement} textarea
   * @param {string} text - Texto a insertar
   * @param {number} position - Posición donde insertar
   */
  static insertAtCursor(textarea, text, position = null) {
    const start = position !== null ? position : textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    textarea.value = before + text + after;
    textarea.focus();
    textarea.setSelectionRange(start + text.length, start + text.length);
  }

  /**
   * Busca la palabra actual en el cursor (para autocompletado)
   * @param {HTMLTextAreaElement} textarea
   * @returns {Object} Información de la palabra actual
   */
  static getCurrentWord(textarea) {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    // Encontrar el inicio de la palabra (espacio, salto de línea, o inicio)
    let wordStart = cursorPos;
    while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) {
      wordStart--;
    }

    // Encontrar el fin de la palabra
    let wordEnd = cursorPos;
    while (wordEnd < text.length && !/\s/.test(text[wordEnd])) {
      wordEnd++;
    }

    const currentWord = text.substring(wordStart, wordEnd);
    const beforeCursor = text.substring(wordStart, cursorPos);

    return {
      word: currentWord,
      beforeCursor,
      start: wordStart,
      end: wordEnd,
      isMention: beforeCursor.startsWith('@'),
      isTag: beforeCursor.startsWith('#')
    };
  }

  // ============ SISTEMA DE MODERACIÓN ============

  /**
   * Tipos de contenido reportable
   */
  static CONTENT_TYPES = {
    THREAD: 'thread',
    COMMENT: 'comment',
    USER: 'user'
  };

  /**
   * Razones de reporte
   */
  static REPORT_REASONS = {
    SPAM: 'spam',
    HARASSMENT: 'harassment',
    HATE_SPEECH: 'hate_speech',
    INAPPROPRIATE: 'inappropriate',
    VIOLENCE: 'violence',
    MISINFORMATION: 'misinformation',
    OTHER: 'other'
  };

  /**
   * Estados de moderación
   */
  static MODERATION_STATUS = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed'
  };

  /**
   * Tipos de acciones de moderación
   */
  static MODERATION_ACTIONS = {
    WARN: 'warn',
    DELETE_CONTENT: 'delete_content',
    BAN_USER: 'ban_user',
    SUSPEND_USER: 'suspend_user',
    RESTRICT_USER: 'restrict_user'
  };

  /**
   * Filtra contenido con lenguaje ofensivo
   * @param {string} text - Texto a filtrar
   * @param {Object} options - Opciones de filtrado
   * @returns {Object} Resultado del filtrado
   */
  static filterProfanity(text, options = {}) {
    try {
      // Importar dinámicamente para evitar problemas en SSR
      const Filter = require('bad-words');

      const filter = new Filter();

      // Configurar opciones personalizadas
      if (options.customWords && Array.isArray(options.customWords)) {
        filter.addWords(...options.customWords);
      }

      // Verificar si contiene lenguaje ofensivo
      const hasProfanity = filter.isProfane(text);

      // Censurar el texto si es necesario
      const censoredText = hasProfanity ? filter.clean(text) : text;

      // Extraer palabras ofensivas encontradas
      const badWords = [];
      if (hasProfanity) {
        const words = text.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (filter.isProfane(word)) {
            badWords.push(word);
          }
        });
      }

      return {
        originalText: text,
        censoredText,
        hasProfanity,
        badWords: [...new Set(badWords)], // Eliminar duplicados
        severity: badWords.length > 2 ? 'high' : badWords.length > 0 ? 'medium' : 'low'
      };
    } catch (error) {
      console.warn('Error en filtrado de profanity:', error);
      return {
        originalText: text,
        censoredText: text,
        hasProfanity: false,
        badWords: [],
        severity: 'low',
        error: error.message
      };
    }
  }

  /**
   * Valida si un usuario puede moderar contenido
   * @param {Object} user - Usuario que intenta moderar
   * @param {Object} targetUser - Usuario objetivo (opcional)
   * @returns {Object} Resultado de validación
   */
  static canModerate(user, targetUser = null) {
    if (!user) {
      return { canModerate: false, reason: 'Usuario no autenticado' };
    }

    // Verificar si es moderador o admin
    const isModerator = user.role === 'moderator' || user.role === 'admin';
    const isAdmin = user.role === 'admin';

    if (!isModerator && !isAdmin) {
      return { canModerate: false, reason: 'Usuario sin permisos de moderación' };
    }

    // Verificar jerarquía (admins pueden moderar a todos, moderadores no pueden moderar a otros moderadores/admins)
    if (targetUser && !isAdmin) {
      const targetIsModerator = targetUser.role === 'moderator' || targetUser.role === 'admin';
      if (targetIsModerator) {
        return { canModerate: false, reason: 'No puedes moderar a otros moderadores' };
      }
    }

    return { canModerate: true };
  }

  /**
   * Determina la acción de moderación automática basada en el contenido
   * @param {Object} contentAnalysis - Análisis del contenido
   * @param {Object} userHistory - Historial del usuario
   * @returns {Object} Acción recomendada
   */
  static getAutoModerationAction(contentAnalysis, userHistory = {}) {
    const { hasProfanity, severity, badWords } = contentAnalysis;
    const { previousViolations = 0, accountAge = 0 } = userHistory;

    // No hay ofensivas
    if (!hasProfanity) {
      return { action: null, reason: 'Contenido aprobado' };
    }

    // Primera ofensiva de usuario nuevo (< 30 días)
    if (previousViolations === 0 && accountAge < 30) {
      return {
        action: this.MODERATION_ACTIONS.WARN,
        reason: 'Primera violación - usuario nuevo',
        severity: 'low'
      };
    }

    // Múltiples ofensivas o usuario reincidente
    if (severity === 'high' || previousViolations > 0) {
      return {
        action: this.MODERATION_ACTIONS.DELETE_CONTENT,
        reason: 'Contenido ofensivo - eliminación automática',
        severity: 'high'
      };
    }

    // Ofensiva moderada
    return {
      action: this.MODERATION_ACTIONS.WARN,
      reason: 'Lenguaje inapropiado - advertencia',
      severity: 'medium'
    };
  }

  /**
   * Calcula la duración de suspensión basada en historial
   * @param {Object} userHistory - Historial del usuario
   * @returns {Object} Duración de suspensión
   */
  static calculateSuspensionDuration(userHistory) {
    const { previousViolations = 0, lastViolation } = userHistory;

    // Calcular tiempo desde última violación
    const daysSinceLastViolation = lastViolation
      ? Math.floor((Date.now() - new Date(lastViolation).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Duraciones base por número de violaciones
    const baseDurations = {
      1: 1,    // 1 día
      2: 3,    // 3 días
      3: 7,    // 1 semana
      4: 30,   // 1 mes
      5: 365   // 1 año
    };

    let duration = baseDurations[previousViolations + 1] || 365;

    // Reducir duración si ha pasado tiempo desde la última violación
    if (daysSinceLastViolation !== Infinity && daysSinceLastViolation > 90) {
      duration = Math.floor(duration / 2);
    }

    return {
      duration,
      unit: 'days',
      reason: `Suspensión por violación #${previousViolations + 1}`
    };
  }

  /**
   * Genera log de moderación
   * @param {Object} moderationData - Datos de la moderación
   * @returns {Object} Log formateado
   */
  static generateModerationLog(moderationData) {
    const {
      moderator,
      action,
      targetType,
      targetId,
      reason,
      details = {},
      severity = 'medium'
    } = moderationData;

    return {
      timestamp: new Date().toISOString(),
      moderator: {
        id: moderator.id,
        username: moderator.username,
        role: moderator.role
      },
      action,
      target: {
        type: targetType,
        id: targetId
      },
      reason,
      details,
      severity,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };
  }

  /**
   * Verifica si un usuario está bloqueado
   * @param {Object} user - Usuario a verificar
   * @param {Array} activeBlocks - Lista de bloqueos activos
   * @returns {Object} Estado de bloqueo
   */
  static checkUserBlockStatus(user, activeBlocks = []) {
    if (!user) return { isBlocked: false };

    const userBlocks = activeBlocks.filter(block =>
      block.userId === user.id || block.userId === user._id
    );

    if (userBlocks.length === 0) {
      return { isBlocked: false };
    }

    // Encontrar el bloqueo más restrictivo activo
    const activeBlock = userBlocks
      .filter(block => !block.expiresAt || new Date(block.expiresAt) > new Date())
      .sort((a, b) => {
        // Priorizar bloqueos permanentes
        if (a.isPermanent && !b.isPermanent) return -1;
        if (!a.isPermanent && b.isPermanent) return 1;
        return 0;
      })[0];

    if (!activeBlock) {
      return { isBlocked: false };
    }

    return {
      isBlocked: true,
      blockType: activeBlock.isPermanent ? 'permanent' : 'temporary',
      reason: activeBlock.reason,
      expiresAt: activeBlock.expiresAt,
      moderator: activeBlock.moderator,
      remainingTime: activeBlock.isPermanent ? null :
        Math.max(0, new Date(activeBlock.expiresAt) - new Date())
    };
  }

  /**
   * Valida la intensidad de un reporte
   * @param {Object} report - Reporte a validar
   * @param {Array} existingReports - Reportes existentes para el mismo contenido
   * @returns {Object} Validación del reporte
   */
  static validateReportIntensity(report, existingReports = []) {
    const similarReports = existingReports.filter(r =>
      r.targetType === report.targetType &&
      r.targetId === report.targetId &&
      r.reason === report.reason
    );

    const intensity = similarReports.length + 1; // +1 por el reporte actual

    // Determinar prioridad basada en intensidad
    let priority = 'low';
    if (intensity >= 5) priority = 'high';
    else if (intensity >= 3) priority = 'medium';

    return {
      intensity,
      priority,
      requiresImmediateAction: intensity >= 3,
      similarReportsCount: similarReports.length
    };
  }
}