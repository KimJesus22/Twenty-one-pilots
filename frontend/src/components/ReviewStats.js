import React from 'react';
import './ReviewStats.css';

const ReviewStats = ({ stats, onRatingClick }) => {
  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="review-stats">
        <div className="no-reviews">
          <h3>Reseñas del producto</h3>
          <p>Este producto aún no tiene reseñas. ¡Sé el primero en opinar!</p>
        </div>
      </div>
    );
  }

  const { avgRating, totalReviews, ratingDistribution, ratingPercentages } = stats;

  // Renderizar estrellas
  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      const partial = i === Math.ceil(rating) && rating % 1 !== 0;
      const partialWidth = (rating % 1) * 100;

      stars.push(
        <span
          key={i}
          className={`star ${interactive ? 'interactive' : ''} ${filled ? 'filled' : ''}`}
          onClick={interactive ? () => onRatingClick && onRatingClick(i) : undefined}
        >
          {partial ? (
            <span className="star-partial" style={{ width: `${partialWidth}%` }}>
              ★
            </span>
          ) : (
            filled ? '★' : '☆'
          )}
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="review-stats">
      <div className="stats-header">
        <h3>Opiniones de clientes</h3>
        <div className="overall-rating">
          <div className="rating-number">{avgRating.toFixed(1)}</div>
          <div className="stars-container">
            {renderStars(Math.round(avgRating))}
          </div>
          <div className="total-reviews">
            {totalReviews} reseña{totalReviews !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="rating-breakdown">
        {[5, 4, 3, 2, 1].map(stars => (
          <div
            key={stars}
            className="rating-row"
            onClick={() => onRatingClick && onRatingClick(stars)}
          >
            <div className="rating-label">
              <span className="star-count">{stars}</span>
              <span className="star-icon">★</span>
            </div>
            <div className="rating-bar">
              <div
                className="rating-fill"
                style={{ width: `${ratingPercentages[stars]}%` }}
              />
            </div>
            <div className="rating-percentage">
              {ratingPercentages[stars]}%
            </div>
            <div className="rating-count">
              ({ratingDistribution[stars]})
            </div>
          </div>
        ))}
      </div>

      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Compras verificadas:</span>
          <span className="stat-value">{stats.verifiedReviews || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Con fotos:</span>
          <span className="stat-value">{stats.reviewsWithImages || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Recomendaciones:</span>
          <span className="stat-value">{stats.recommendedCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewStats;