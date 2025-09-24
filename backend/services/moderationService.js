const logger = require('../utils/logger');

/**
 * Servicio de moderación automática de contenido
 * Detecta lenguaje inapropiado, spam y contenido potencialmente dañino
 */
class ModerationService {
  constructor() {
    // Palabras clave para moderación (en español e inglés)
    this.badWords = [
      // Español
      'mierda', 'puto', 'puta', 'joder', 'follar', 'coño', 'cabrón', 'gilipollas',
      'subnormal', 'imbécil', 'estúpido', 'idiota', 'tonto', 'pendejo', 'verga',
      'chingar', 'chingada', 'chingado', 'culero', 'mamón', 'maricón', 'marica',
      'faggot', 'nigger', 'cunt', 'fuck', 'shit', 'asshole', 'bitch', 'bastard',
      'dick', 'pussy', 'cock', 'whore', 'slut', 'rape', 'kill', 'die', 'suicide',
      'bomb', 'terrorist', 'hate', 'racist', 'sexist', 'homophobic', 'transphobic'
    ];

    // Patrones de spam
    this.spamPatterns = [
      /(\w)\1{4,}/gi, // Repetición de letras (aaaaa, bbbbb)
      /(.)\1{10,}/gi, // Repetición de caracteres
      /https?:\/\/[^\s]{10,}/gi, // URLs largas
      /\b\d{8,}\b/g, // Números largos
      /[A-Z]{5,}/g, // Texto en mayúsculas
    ];

    // Palabras permitidas en contexto (falsos positivos)
    this.allowedWords = [
      'putin', 'putnam', 'puting', 'putter', 'putty', // Nombres propios
      'assad', 'assam', 'assay', 'asset', // Otros nombres
      'class', 'glass', 'grass', 'mass', 'pass', // Palabras comunes
    ];
  }

  /**
   * Modera el contenido de un comentario
   * @param {string} content - Contenido a moderar
   * @param {string} title - Título opcional
   * @returns {Object} Resultado de la moderación
   */
  moderateContent(content, title = '') {
    const fullContent = `${title} ${content}`.toLowerCase();
    const result = {
      isApproved: true,
      flags: [],
      score: 0,
      reasons: []
    };

    // Verificar palabras prohibidas
    const badWordMatches = this.checkBadWords(fullContent);
    if (badWordMatches.length > 0) {
      result.flags.push('bad_words');
      result.reasons.push(`Contiene ${badWordMatches.length} palabra(s) inapropiada(s): ${badWordMatches.slice(0, 3).join(', ')}`);
      result.score += badWordMatches.length * 10;
    }

    // Verificar patrones de spam
    const spamMatches = this.checkSpamPatterns(fullContent);
    if (spamMatches.length > 0) {
      result.flags.push('spam');
      result.reasons.push('Detectado patrón de spam');
      result.score += spamMatches.length * 5;
    }

    // Verificar longitud excesiva
    if (content.length > 2000) {
      result.flags.push('too_long');
      result.reasons.push('Contenido demasiado largo');
      result.score += 2;
    }

    // Verificar contenido vacío o solo espacios
    if (!content.trim()) {
      result.flags.push('empty');
      result.reasons.push('Contenido vacío');
      result.score += 5;
    }

    // Verificar enlaces excesivos
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount > 3) {
      result.flags.push('too_many_links');
      result.reasons.push('Demasiados enlaces');
      result.score += linkCount;
    }

    // Verificar mayúsculas excesivas
    const uppercaseRatio = this.getUppercaseRatio(content);
    if (uppercaseRatio > 0.7 && content.length > 10) {
      result.flags.push('all_caps');
      result.reasons.push('Texto en mayúsculas excesivo');
      result.score += 3;
    }

    // Decidir si aprobar automáticamente
    result.isApproved = result.score < 5; // Umbral de aprobación automática

    // Logging para análisis
    if (result.score > 0) {
      logger.info('Contenido moderado', {
        score: result.score,
        flags: result.flags,
        reasons: result.reasons,
        contentLength: content.length
      });
    }

    return result;
  }

  /**
   * Verifica palabras prohibidas en el contenido
   */
  checkBadWords(content) {
    const matches = [];
    const words = content.toLowerCase().split(/\s+/);

    for (const word of words) {
      // Limpiar puntuación
      const cleanWord = word.replace(/[^\w]/g, '');

      // Verificar si es una palabra prohibida y no está en la lista de permitidas
      if (this.badWords.some(badWord => cleanWord.includes(badWord)) &&
          !this.allowedWords.some(allowed => cleanWord.includes(allowed))) {
        matches.push(cleanWord);
      }
    }

    return [...new Set(matches)]; // Remover duplicados
  }

  /**
   * Verifica patrones de spam
   */
  checkSpamPatterns(content) {
    const matches = [];

    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        matches.push(pattern.toString());
      }
    }

    return matches;
  }

  /**
   * Calcula la proporción de mayúsculas en el texto
   */
  getUppercaseRatio(text) {
    if (!text) return 0;

    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return 0;

    const uppercaseCount = (letters.match(/[A-Z]/g) || []).length;
    return uppercaseCount / letters.length;
  }

  /**
   * Modera un comentario basado en su historial de usuario
   * @param {Object} comment - Comentario a moderar
   * @param {Object} user - Usuario que hace el comentario
   * @returns {Object} Resultado de moderación mejorado
   */
  moderateWithUserHistory(comment, user) {
    const baseModeration = this.moderateContent(comment.content, comment.title);

    // Si el usuario tiene historial de contenido reportado, aumentar el score
    if (user.reportedComments && user.reportedComments > 0) {
      baseModeration.score += user.reportedComments * 2;
      baseModeration.reasons.push('Usuario con historial de reportes');
    }

    // Si el usuario es nuevo, ser más estricto
    const userAge = Date.now() - new Date(user.createdAt).getTime();
    const daysOld = userAge / (1000 * 60 * 60 * 24);

    if (daysOld < 7) {
      baseModeration.score += 2;
      baseModeration.reasons.push('Usuario nuevo (menos de 7 días)');
    }

    // Recalcular aprobación
    baseModeration.isApproved = baseModeration.score < 5;

    return baseModeration;
  }

  /**
   * Verifica si un comentario debe ser marcado como destacado
   * basado en engagement y calidad
   */
  shouldBeFeatured(comment, user) {
    let score = 0;

    // Longitud apropiada
    if (comment.content.length > 50 && comment.content.length < 500) {
      score += 1;
    }

    // Tiene rating (es una reseña)
    if (comment.rating && comment.rating >= 4) {
      score += 2;
    }

    // Usuario con buen historial
    if (user.totalComments > 5 && user.avgRating > 3.5) {
      score += 1;
    }

    // Contiene aspectos positivos/negativos (reseña detallada)
    if (comment.pros && comment.pros.length > 0) {
      score += 1;
    }

    return score >= 3; // Umbral para destacar
  }
}

module.exports = new ModerationService();