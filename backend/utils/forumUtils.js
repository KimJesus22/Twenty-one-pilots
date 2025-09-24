/**
 * Utilidades para el procesamiento de menciones y etiquetas en el foro
 */

class ForumUtils {
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
   * Valida si un username existe
   * @param {string} username - Username a validar
   * @param {Model} User - Modelo de Usuario de Mongoose
   * @returns {Promise<boolean>} True si el usuario existe
   */
  static async validateMentions(mentions, User) {
    if (!mentions.length) return { valid: [], invalid: [] };

    try {
      const validMentions = [];
      const invalidMentions = [];

      for (const username of mentions) {
        const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        if (user) {
          validMentions.push({
            username: user.username,
            userId: user._id
          });
        } else {
          invalidMentions.push(username);
        }
      }

      return { valid: validMentions, invalid: invalidMentions };
    } catch (error) {
      console.error('Error validating mentions:', error);
      return { valid: [], invalid: mentions };
    }
  }

  /**
   * Obtiene estadísticas de tags populares
   * @param {Model} Thread - Modelo de Thread de Mongoose
   * @param {number} limit - Número máximo de tags a retornar
   * @returns {Promise<Array>} Array de tags con conteo
   */
  static async getPopularTags(Thread, limit = 20) {
    try {
      const result = await Thread.aggregate([
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
            lastUsed: { $max: '$createdAt' }
          }
        },
        { $sort: { count: -1, lastUsed: -1 } },
        { $limit: limit }
      ]);

      return result.map(item => ({
        tag: item._id,
        count: item.count,
        lastUsed: item.lastUsed
      }));
    } catch (error) {
      console.error('Error getting popular tags:', error);
      return [];
    }
  }

  /**
   * Busca threads por tags
   * @param {Model} Thread - Modelo de Thread de Mongoose
   * @param {Array} tags - Array de tags a buscar
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Object>} Resultados paginados
   */
  static async searchByTags(Thread, tags, options = {}) {
    try {
      const query = {
        tags: { $in: tags.map(tag => tag.toLowerCase()) }
      };

      const result = await Thread.paginate(query, {
        page: options.page || 1,
        limit: Math.min(options.limit || 20, 50),
        sort: options.sort || { lastActivity: -1 },
        populate: [
          { path: 'author', select: 'username' },
          { path: 'comments', select: 'author createdAt', populate: { path: 'author', select: 'username' } }
        ]
      });

      return result;
    } catch (error) {
      console.error('Error searching by tags:', error);
      throw error;
    }
  }

  /**
   * Obtiene sugerencias de tags basado en texto parcial
   * @param {Model} Thread - Modelo de Thread de Mongoose
   * @param {string} partialTag - Texto parcial del tag
   * @param {number} limit - Número máximo de sugerencias
   * @returns {Promise<Array>} Array de tags sugeridos
   */
  static async getTagSuggestions(Thread, partialTag, limit = 10) {
    try {
      if (!partialTag || partialTag.length < 2) return [];

      const result = await Thread.aggregate([
        { $unwind: '$tags' },
        {
          $match: {
            tags: {
              $regex: `^${partialTag}`,
              $options: 'i'
            }
          }
        },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return result.map(item => ({
        tag: item._id,
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting tag suggestions:', error);
      return [];
    }
  }

  /**
   * Obtiene sugerencias de menciones basado en texto parcial
   * @param {Model} User - Modelo de User de Mongoose
   * @param {string} partialUsername - Texto parcial del username
   * @param {number} limit - Número máximo de sugerencias
   * @returns {Promise<Array>} Array de usuarios sugeridos
   */
  static async getMentionSuggestions(User, partialUsername, limit = 10) {
    try {
      if (!partialUsername || partialUsername.length < 2) return [];

      const users = await User.find({
        username: {
          $regex: `^${partialUsername}`,
          $options: 'i'
        }
      })
      .select('username')
      .limit(limit)
      .sort({ username: 1 });

      return users.map(user => ({
        username: user.username,
        displayName: user.username
      }));
    } catch (error) {
      console.error('Error getting mention suggestions:', error);
      return [];
    }
  }
}

module.exports = ForumUtils;