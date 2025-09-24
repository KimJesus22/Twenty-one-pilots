import ReviewFilters from '../utils/reviewFilters';
import ReviewModerationUtils from '../utils/reviewModeration';

// Mock de bad-words
jest.mock('bad-words', () => {
  return jest.fn().mockImplementation(() => ({
    isProfane: jest.fn(),
    clean: jest.fn()
  }));
});

// Mock de ForumUtils
jest.mock('../utils/forumUtils', () => ({
  filterProfanity: jest.fn(),
  getAutoModerationAction: jest.fn(),
  calculateSuspensionDuration: jest.fn(),
  checkUserBlockStatus: jest.fn(),
  validateReportIntensity: jest.fn(),
  canModerate: jest.fn(),
  generateModerationLog: jest.fn(),
  MODERATION_ACTIONS: {
    DELETE_CONTENT: 'delete_content',
    WARN: 'warn',
    NONE: null
  }
}));

describe('Review System Utils', () => {
  describe('ReviewFilters', () => {
    const mockReviews = [
      {
        _id: '1',
        rating: 5,
        verified: true,
        images: ['img1.jpg'],
        createdAt: '2024-01-01T00:00:00Z',
        helpful: ['user1', 'user2'],
        customer: { username: 'user1' }
      },
      {
        _id: '2',
        rating: 3,
        verified: false,
        images: [],
        createdAt: '2024-01-02T00:00:00Z',
        helpful: [],
        customer: { username: 'user2' }
      },
      {
        _id: '3',
        rating: 4,
        verified: true,
        images: ['img2.jpg', 'img3.jpg'],
        createdAt: '2024-01-03T00:00:00Z',
        helpful: ['user1'],
        customer: { username: 'user3' }
      }
    ];

    describe('applyRatingFilter', () => {
      test('debe filtrar por calificación específica', () => {
        const result = ReviewFilters.applyRatingFilter(mockReviews, '5');
        expect(result).toHaveLength(1);
        expect(result[0].rating).toBe(5);
      });

      test('debe retornar todas las reseñas cuando no hay filtro', () => {
        const result = ReviewFilters.applyRatingFilter(mockReviews, 'all');
        expect(result).toHaveLength(3);
      });
    });

    describe('applyVerifiedFilter', () => {
      test('debe filtrar solo reseñas verificadas', () => {
        const result = ReviewFilters.applyVerifiedFilter(mockReviews, 'true');
        expect(result).toHaveLength(2);
        expect(result.every(r => r.verified)).toBe(true);
      });

      test('debe filtrar solo reseñas no verificadas', () => {
        const result = ReviewFilters.applyVerifiedFilter(mockReviews, 'false');
        expect(result).toHaveLength(1);
        expect(result[0].verified).toBe(false);
      });
    });

    describe('applyImagesFilter', () => {
      test('debe filtrar reseñas con imágenes', () => {
        const result = ReviewFilters.applyImagesFilter(mockReviews, 'true');
        expect(result).toHaveLength(2);
        expect(result.every(r => r.images && r.images.length > 0)).toBe(true);
      });
    });

    describe('applyDateFilter', () => {
      test('debe filtrar por rango de fechas', () => {
        // Crear reseñas con fechas específicas
        const oldReview = { ...mockReviews[0], createdAt: '2020-01-01T00:00:00Z' };
        const newReviews = [oldReview, ...mockReviews.slice(1)];

        const result = ReviewFilters.applyDateFilter(newReviews, '30');
        // Solo las reseñas recientes deberían pasar (las que no tienen fecha antigua)
        expect(result.length).toBe(2); // Las reseñas sin fecha antigua
      });
    });

    describe('applySearchFilter', () => {
      test('debe buscar en título y comentario', () => {
        const reviewsWithContent = [
          {
            _id: '4',
            rating: 4,
            comment: 'Este producto es excelente',
            title: 'Gran producto',
            customer: { username: 'user4' }
          },
          {
            _id: '5',
            rating: 3,
            comment: 'Producto regular',
            title: 'Normal',
            customer: { username: 'user5' }
          }
        ];

        const result = ReviewFilters.applySearchFilter(reviewsWithContent, 'excelente');
        expect(result).toHaveLength(1);
        expect(result[0].comment).toContain('excelente');
      });
    });

    describe('applySorting', () => {
      test('debe ordenar por calificación descendente', () => {
        const result = ReviewFilters.applySorting(mockReviews, { value: 'rating', order: 'desc' });
        expect(result[0].rating).toBe(5);
        expect(result[1].rating).toBe(4);
        expect(result[2].rating).toBe(3);
      });

      test('debe ordenar por fecha más reciente', () => {
        const result = ReviewFilters.applySorting(mockReviews, { value: 'createdAt', order: 'desc' });
        expect(result[0]._id).toBe('3');
        expect(result[1]._id).toBe('2');
        expect(result[2]._id).toBe('1');
      });

      test('debe ordenar por más útiles', () => {
        const result = ReviewFilters.applySorting(mockReviews, { value: 'helpful', order: 'desc' });
        expect(result[0]._id).toBe('1'); // 2 votos útiles
        expect(result[1]._id).toBe('3'); // 1 voto útil
        expect(result[2]._id).toBe('2'); // 0 votos útiles
      });
    });

    describe('calculateRelevanceScore', () => {
      test('debe calcular puntuación de relevancia correctamente', () => {
        const review = {
          verified: true,
          images: ['img.jpg'],
          rating: 5,
          helpful: ['user1', 'user2']
        };

        const score = ReviewFilters.calculateRelevanceScore(review);
        expect(score).toBeGreaterThan(0);
        // verified (10) + images (5) + rating 5 (3) + helpful (4) = 22
        expect(score).toBe(22);
      });
    });

    describe('getFilteredStats', () => {
      test('debe calcular estadísticas correctas', () => {
        const stats = ReviewFilters.getFilteredStats(mockReviews);
        expect(stats.totalFiltered).toBe(3);
        expect(stats.averageRating).toBeCloseTo(4.0, 1);
        expect(stats.ratingDistribution['5']).toBe(1);
        expect(stats.ratingDistribution['4']).toBe(1);
        expect(stats.ratingDistribution['3']).toBe(1);
        expect(stats.verifiedCount).toBe(2);
        expect(stats.reviewsWithImagesCount).toBe(2);
      });
    });

    describe('getFeaturedReviews', () => {
      test('debe retornar reseñas destacadas', () => {
        const featured = ReviewFilters.getFeaturedReviews(mockReviews, 2);
        expect(featured).toHaveLength(2);
        // La primera debería ser la más relevante
        expect(featured[0].verified).toBe(true);
      });
    });
  });

  describe('ReviewModerationUtils', () => {
    describe('validateReviewRules', () => {
      test('debe validar reseñas correctas', () => {
        const reviewData = {
          rating: 4,
          title: 'Buen producto',
          comment: 'Este producto funciona muy bien y lo recomiendo.'
        };
  
        const result = ReviewModerationUtils.validateReviewRules(reviewData);
  
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
  
      test('debe rechazar reseñas con datos inválidos', () => {
        const reviewData = {
          rating: 6, // Inválido
          title: 'Hi', // Demasiado corto
          comment: 'Ok' // Demasiado corto
        };
  
        const result = ReviewModerationUtils.validateReviewRules(reviewData);
  
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
      });
    });


    describe('validateReviewRules', () => {
      test('debe validar reseñas correctas', () => {
        const reviewData = {
          rating: 4,
          title: 'Buen producto',
          comment: 'Este producto funciona muy bien y lo recomiendo.'
        };

        const result = ReviewModerationUtils.validateReviewRules(reviewData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('debe rechazar reseñas con datos inválidos', () => {
        const reviewData = {
          rating: 6, // Inválido
          title: 'Hi', // Demasiado corto
          comment: 'Ok' // Demasiado corto
        };

        const result = ReviewModerationUtils.validateReviewRules(reviewData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
      });
    });

    describe('calculateReviewQualityScore', () => {
      test('debe calcular puntuación de calidad', () => {
        const reviewData = {
          title: 'Excelente producto de calidad',
          comment: 'He usado este producto por varios meses y estoy muy satisfecho con su rendimiento y durabilidad.',
          images: ['img1.jpg'],
          verified: true
        };

        const score = ReviewModerationUtils.calculateReviewQualityScore(reviewData);

        expect(score).toBeGreaterThan(50);
        expect(score).toBeLessThanOrEqual(100);
      });

      test('debe dar baja puntuación a reseñas pobres', () => {
        const reviewData = {
          title: 'Ok',
          comment: 'Bien',
          images: [],
          verified: false
        };

        const score = ReviewModerationUtils.calculateReviewQualityScore(reviewData);

        expect(score).toBeLessThan(50);
      });
    });
  });

  describe('Integration Tests', () => {
    test('debe funcionar el flujo completo de moderación y filtrado', () => {
      const reviews = [
        {
          _id: '1',
          rating: 5,
          verified: true,
          title: 'Excelente producto',
          comment: 'Muy buen producto, lo recomiendo',
          images: ['img1.jpg'],
          createdAt: '2024-01-01T00:00:00Z',
          helpful: ['user1', 'user2']
        },
        {
          _id: '2',
          rating: 1,
          verified: false,
          title: 'Producto malo',
          comment: 'Este producto es una mierda',
          images: [],
          createdAt: '2024-01-02T00:00:00Z',
          helpful: []
        }
      ];

      // Aplicar filtros
      const filters = { rating: '5', verified: 'true' };
      const sort = { value: 'rating', order: 'desc' };
      const filtered = ReviewFilters.applyFiltersAndSort(reviews, filters, sort);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].rating).toBe(5);
      expect(filtered[0].verified).toBe(true);

      // Calcular estadísticas
      const stats = ReviewFilters.getFilteredStats(reviews, filters);
      expect(stats.totalFiltered).toBe(1);
      expect(stats.averageRating).toBe(5.0);
    });
  });
});