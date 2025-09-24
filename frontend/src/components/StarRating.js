import React, { useState, useEffect } from 'react';
import './StarRating.css';

const StarRating = ({
  initialRating = 0,
  maxRating = 5,
  size = 'medium',
  interactive = true,
  showValue = true,
  onRatingChange,
  onRatingSubmit,
  loading = false,
  disabled = false,
  className = ''
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleStarClick = (starValue) => {
    if (!interactive || disabled || loading) return;

    setRating(starValue);
    setHasSubmitted(true);

    if (onRatingChange) {
      onRatingChange(starValue);
    }

    if (onRatingSubmit) {
      onRatingSubmit(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (!interactive || disabled || loading) return;
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    if (!interactive || disabled || loading) return;
    setHoverRating(0);
  };

  const getStarClass = (starValue) => {
    const currentRating = hoverRating || rating;
    const baseClass = `star-rating-star ${size}`;

    if (currentRating >= starValue) {
      return `${baseClass} filled`;
    } else if (currentRating >= starValue - 0.5) {
      return `${baseClass} half-filled`;
    }

    return baseClass;
  };

  const renderStars = () => {
    const stars = [];

    for (let i = 1; i <= maxRating; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={getStarClass(i)}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleMouseLeave}
          disabled={!interactive || disabled || loading}
          aria-label={`Valorar con ${i} estrella${i !== 1 ? 's' : ''}`}
          title={`Valorar con ${i} estrella${i !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      );
    }

    return stars;
  };

  const getRatingText = () => {
    const currentRating = hoverRating || rating;

    if (currentRating === 0) return 'Sin valoración';
    if (currentRating === 1) return 'Muy malo';
    if (currentRating === 2) return 'Malo';
    if (currentRating === 3) return 'Regular';
    if (currentRating === 4) return 'Bueno';
    if (currentRating === 5) return 'Excelente';

    return '';
  };

  return (
    <div className={`star-rating ${className} ${disabled ? 'disabled' : ''} ${loading ? 'loading' : ''}`}>
      <div className="star-rating-stars">
        {renderStars()}
      </div>

      {showValue && (
        <div className="star-rating-info">
          <span className="star-rating-value">
            {rating > 0 ? `${rating}/${maxRating}` : 'Sin valorar'}
          </span>
          {interactive && !disabled && !loading && (
            <span className="star-rating-text">
              {hoverRating > 0 ? getRatingText() : hasSubmitted ? '¡Gracias por tu valoración!' : 'Haz clic para valorar'}
            </span>
          )}
        </div>
      )}

      {loading && (
        <div className="star-rating-loading">
          <div className="loading-spinner"></div>
          <span>Enviando valoración...</span>
        </div>
      )}
    </div>
  );
};

export default StarRating;