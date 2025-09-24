import React, { useState, useEffect, useCallback } from 'react';
import ReviewStats from './ReviewStats';
import ReviewFiltersComponent from './ReviewFilters';
import ReviewCard from './ReviewCard';
import ReviewFilters from '../utils/reviewFilters';
import './ReviewsSection.css';

const ReviewsSection = ({
  productId,
  reviews: initialReviews = [],
  stats: initialStats = {},
  onWriteReview,
  onHelpfulClick,
  onReportClick,
  loading = false
}) => {
  const [reviews, setReviews] = useState(initialReviews);
  const [filteredReviews, setFilteredReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ value: 'createdAt', order: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const reviewsPerPage = 10;

  // Aplicar filtros y ordenamiento cuando cambien
  useEffect(() => {
    const filtered = ReviewFilters.applyFiltersAndSort(reviews, filters, sort);
    setFilteredReviews(filtered);
    setCurrentPage(1);
  }, [reviews, filters, sort]);

  // Calcular estadísticas de reseñas filtradas
  useEffect(() => {
    const filteredStats = ReviewFilters.getFilteredStats(reviews, filters);
    setStats(prevStats => ({ ...prevStats, ...filteredStats }));
  }, [reviews, filters]);

  // Obtener reseñas paginadas
  const getPaginatedReviews = useCallback(() => {
    const startIndex = 0;
    const endIndex = currentPage * reviewsPerPage;
    return filteredReviews.slice(startIndex, endIndex);
  }, [filteredReviews, currentPage]);

  // Cargar más reseñas
  const loadMoreReviews = () => {
    if (loadingMore) return;

    setLoadingMore(true);
    // Simular carga (en producción, aquí iría la llamada a API)
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setLoadingMore(false);
    }, 500);
  };

  // Manejar cambios en filtros
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Manejar cambios en ordenamiento
  const handleSortChange = (newSort) => {
    setSort(newSort);
  };

  // Manejar click en calificación (filtrar por esa calificación)
  const handleRatingClick = (rating) => {
    setFilters(prev => ({ ...prev, rating: rating.toString() }));
  };

  // Obtener reseñas destacadas
  const featuredReviews = ReviewFilters.getFeaturedReviews(reviews, 3);

  const paginatedReviews = getPaginatedReviews();
  const hasMoreReviews = paginatedReviews.length < filteredReviews.length;

  if (loading && reviews.length === 0) {
    return (
      <div className="reviews-section">
        <div className="loading-reviews">
          <div className="spinner"></div>
          <p>Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-section">
      {/* Estadísticas principales */}
      <ReviewStats
        stats={stats}
        onRatingClick={handleRatingClick}
      />

      {/* Botón para escribir reseña */}
      {onWriteReview && (
        <div className="write-review-section">
          <button
            className="write-review-btn"
            onClick={onWriteReview}
          >
            ✍️ Escribir una reseña
          </button>
        </div>
      )}

      {/* Reseñas destacadas */}
      {featuredReviews.length > 0 && (
        <div className="featured-reviews">
          <h3>Reseñas destacadas</h3>
          <div className="featured-grid">
            {featuredReviews.map(review => (
              <ReviewCard
                key={`featured-${review._id}`}
                review={review}
                onHelpfulClick={onHelpfulClick}
                onReportClick={onReportClick}
                showResponse={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filtros y ordenamiento */}
      <ReviewFiltersComponent
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        currentFilters={filters}
        currentSort={sort}
      />

      {/* Lista de reseñas */}
      <div className="reviews-list">
        <div className="reviews-header">
          <h3>
            Todas las reseñas
            {filteredReviews.length !== reviews.length && (
              <span className="filtered-count">
                ({filteredReviews.length} de {reviews.length})
              </span>
            )}
          </h3>
        </div>

        {paginatedReviews.length === 0 ? (
          <div className="no-reviews">
            <p>No se encontraron reseñas con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="reviews-container">
            {paginatedReviews.map(review => (
              <ReviewCard
                key={review._id}
                review={review}
                onHelpfulClick={onHelpfulClick}
                onReportClick={onReportClick}
              />
            ))}

            {/* Botón cargar más */}
            {hasMoreReviews && (
              <div className="load-more-section">
                <button
                  className="load-more-btn"
                  onClick={loadMoreReviews}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <div className="spinner small"></div>
                      Cargando...
                    </>
                  ) : (
                    `Cargar más reseñas (${filteredReviews.length - paginatedReviews.length} restantes)`
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;