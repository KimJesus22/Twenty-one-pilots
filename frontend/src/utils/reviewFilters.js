/**
 * Utilidades para filtrado y ordenamiento de reseñas de productos
 */

export class ReviewFilters {
  /**
   * Opciones de ordenamiento disponibles
   */
  static SORT_OPTIONS = {
    NEWEST: { value: 'createdAt', label: 'Más recientes', order: 'desc' },
    OLDEST: { value: 'createdAt', label: 'Más antiguas', order: 'asc' },
    HIGHEST_RATING: { value: 'rating', label: 'Mejor calificación', order: 'desc' },
    LOWEST_RATING: { value: 'rating', label: 'Peor calificación', order: 'asc' },
    MOST_HELPFUL: { value: 'helpful', label: 'Más útiles', order: 'desc' },
    VERIFIED_FIRST: { value: 'verified', label: 'Verificadas primero', order: 'desc' },
    WITH_IMAGES: { value: 'hasImages', label: 'Con imágenes', order: 'desc' },
    RELEVANCE: { value: 'relevance', label: 'Más relevantes', order: 'desc' }
  };

  /**
   * Opciones de filtro disponibles
   */
  static FILTER_OPTIONS = {
    ALL_RATINGS: { value: 'all', label: 'Todas las calificaciones' },
    FIVE_STARS: { value: '5', label: '5 estrellas' },
    FOUR_STARS: { value: '4', label: '4 estrellas' },
    THREE_STARS: { value: '3', label: '3 estrellas' },
    TWO_STARS: { value: '2', label: '2 estrellas' },
    ONE_STAR: { value: '1', label: '1 estrella' },

    ALL_VERIFIED: { value: 'all', label: 'Todas' },
    VERIFIED_ONLY: { value: 'true', label: 'Solo verificadas' },
    UNVERIFIED_ONLY: { value: 'false', label: 'Solo no verificadas' },

    ALL_IMAGES: { value: 'all', label: 'Todas' },
    WITH_IMAGES: { value: 'true', label: 'Con imágenes' },
    WITHOUT_IMAGES: { value: 'false', label: 'Sin imágenes' },

    ALL_TIME: { value: 'all', label: 'Todo el tiempo' },
    LAST_30_DAYS: { value: '30', label: 'Últimos 30 días' },
    LAST_90_DAYS: { value: '90', label: 'Últimos 90 días' },
    LAST_YEAR: { value: '365', label: 'Último año' }
  };

  /**
   * Aplica filtros y ordenamiento a una lista de reseñas
   * @param {Array} reviews - Lista de reseñas
   * @param {Object} filters - Filtros aplicados
   * @param {Object} sort - Ordenamiento aplicado
   * @returns {Array} Reseñas filtradas y ordenadas
   */
  static applyFiltersAndSort(reviews, filters = {}, sort = {}) {
    let filteredReviews = [...reviews];

    // Aplicar filtros
    filteredReviews = this.applyRatingFilter(filteredReviews, filters.rating);
    filteredReviews = this.applyVerifiedFilter(filteredReviews, filters.verified);
    filteredReviews = this.applyImagesFilter(filteredReviews, filters.hasImages);
    filteredReviews = this.applyDateFilter(filteredReviews, filters.dateRange);
    filteredReviews = this.applySearchFilter(filteredReviews, filters.search);

    // Aplicar ordenamiento
    filteredReviews = this.applySorting(filteredReviews, sort);

    return filteredReviews;
  }

  /**
   * Filtra por calificación
   */
  static applyRatingFilter(reviews, rating) {
    if (!rating || rating === 'all') return reviews;
    return reviews.filter(review => review.rating === parseInt(rating));
  }

  /**
   * Filtra por verificación de compra
   */
  static applyVerifiedFilter(reviews, verified) {
    if (!verified || verified === 'all') return reviews;
    const isVerified = verified === 'true';
    return reviews.filter(review => review.verified === isVerified);
  }

  /**
   * Filtra por reseñas con imágenes
   */
  static applyImagesFilter(reviews, hasImages) {
    if (!hasImages || hasImages === 'all') return reviews;
    const hasImagesBool = hasImages === 'true';
    return reviews.filter(review =>
      hasImagesBool
        ? (review.images && review.images.length > 0)
        : (!review.images || review.images.length === 0)
    );
  }

  /**
   * Filtra por rango de fechas
   */
  static applyDateFilter(reviews, dateRange) {
    if (!dateRange || dateRange === 'all') return reviews;

    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return reviews.filter(review => {
      const reviewDate = new Date(review.createdAt);
      return reviewDate >= cutoffDate;
    });
  }

  /**
   * Filtra por búsqueda de texto
   */
  static applySearchFilter(reviews, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return reviews;

    const term = searchTerm.toLowerCase().trim();
    return reviews.filter(review =>
      review.title.toLowerCase().includes(term) ||
      review.comment.toLowerCase().includes(term) ||
      (review.customer && review.customer.username &&
       review.customer.username.toLowerCase().includes(term))
    );
  }

  /**
   * Aplica ordenamiento a las reseñas
   */
  static applySorting(reviews, sort) {
    if (!sort || !sort.value) return reviews;

    const { value, order } = sort;

    return [...reviews].sort((a, b) => {
      let aValue, bValue;

      switch (value) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;

        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;

        case 'helpful':
          aValue = a.helpful ? a.helpful.length : 0;
          bValue = b.helpful ? b.helpful.length : 0;
          break;

        case 'verified':
          aValue = a.verified ? 1 : 0;
          bValue = b.verified ? 1 : 0;
          break;

        case 'hasImages':
          aValue = (a.images && a.images.length > 0) ? 1 : 0;
          bValue = (b.images && b.images.length > 0) ? 1 : 0;
          break;

        case 'relevance':
          // Puntuación de relevancia basada en múltiples factores
          aValue = this.calculateRelevanceScore(a);
          bValue = this.calculateRelevanceScore(b);
          break;

        default:
          return 0;
      }

      if (order === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }

  /**
   * Calcula puntuación de relevancia para una reseña
   */
  static calculateRelevanceScore(review) {
    let score = 0;

    // Verificada = +10
    if (review.verified) score += 10;

    // Con imágenes = +5
    if (review.images && review.images.length > 0) score += 5;

    // Calificación extrema (1 o 5 estrellas) = +3
    if (review.rating === 1 || review.rating === 5) score += 3;

    // Votos útiles = +2 por voto
    const helpfulVotes = review.helpful ? review.helpful.length : 0;
    score += helpfulVotes * 2;

    // Respuesta del vendedor = +5
    if (review.response) score += 5;

    // Longitud del comentario (más largo = más relevante)
    const commentLength = review.comment ? review.comment.length : 0;
    if (commentLength > 100) score += 3;
    else if (commentLength > 50) score += 2;
    else if (commentLength > 20) score += 1;

    return score;
  }

  /**
   * Obtiene estadísticas de reseñas filtradas
   * @param {Array} reviews - Lista completa de reseñas
   * @param {Object} filters - Filtros aplicados
   * @returns {Object} Estadísticas
   */
  static getFilteredStats(reviews, filters = {}) {
    const filteredReviews = this.applyFiltersAndSort(reviews, filters);

    const stats = {
      totalFiltered: filteredReviews.length,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedCount: 0,
      withImagesCount: 0,
      helpfulVotes: 0
    };

    if (filteredReviews.length > 0) {
      // Calcular promedio
      stats.averageRating = filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length;

      // Distribución de calificaciones
      filteredReviews.forEach(review => {
        stats.ratingDistribution[review.rating]++;
      });

      // Otras estadísticas
      stats.verifiedCount = filteredReviews.filter(r => r.verified).length;
      stats.withImagesCount = filteredReviews.filter(r => r.images && r.images.length > 0).length;
      stats.helpfulVotes = filteredReviews.reduce((sum, r) => sum + (r.helpful ? r.helpful.length : 0), 0);
    }

    // Redondear promedio
    stats.averageRating = Math.round(stats.averageRating * 10) / 10;

    return stats;
  }

  /**
   * Obtiene reseñas destacadas (top reseñas por relevancia)
   * @param {Array} reviews - Lista de reseñas
   * @param {number} limit - Número máximo de reseñas destacadas
   * @returns {Array} Reseñas destacadas
   */
  static getFeaturedReviews(reviews, limit = 3) {
    return [...reviews]
      .map(review => ({
        ...review,
        relevanceScore: this.calculateRelevanceScore(review)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Formatea opciones de filtro para UI
   * @returns {Object} Opciones formateadas
   */
  static getFormattedOptions() {
    return {
      sortOptions: Object.entries(this.SORT_OPTIONS).map(([key, option]) => ({
        value: key,
        label: option.label,
        sortValue: option.value,
        sortOrder: option.order
      })),
      ratingFilters: Object.entries(this.FILTER_OPTIONS)
        .filter(([key]) => key.includes('STAR'))
        .map(([key, option]) => ({
          value: option.value,
          label: option.label
        })),
      verifiedFilters: Object.entries(this.FILTER_OPTIONS)
        .filter(([key]) => key.includes('VERIFIED'))
        .map(([key, option]) => ({
          value: option.value,
          label: option.label
        })),
      imageFilters: Object.entries(this.FILTER_OPTIONS)
        .filter(([key]) => key.includes('IMAGE'))
        .map(([key, option]) => ({
          value: option.value,
          label: option.label
        })),
      dateFilters: Object.entries(this.FILTER_OPTIONS)
        .filter(([key]) => key.includes('DAY') || key.includes('YEAR') || key === 'ALL_TIME')
        .map(([key, option]) => ({
          value: option.value,
          label: option.label
        }))
    };
  }
}

export default ReviewFilters;