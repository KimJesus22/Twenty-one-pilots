import React, { useState } from 'react';
import './ReviewCard.css';

const ReviewCard = ({ review, onHelpfulClick, onReportClick, showResponse = true }) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState(false);
  const [reportClicked, setReportClicked] = useState(false);

  if (!review) return null;

  // Renderizar estrellas
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Manejar click en útil
  const handleHelpfulClick = async () => {
    if (helpfulClicked) return;

    setHelpfulClicked(true);
    try {
      await onHelpfulClick(review._id);
    } catch (error) {
      setHelpfulClicked(false);
      console.error('Error marcando como útil:', error);
    }
  };

  // Manejar reporte
  const handleReportClick = () => {
    if (reportClicked) return;

    setReportClicked(true);
    onReportClick(review._id);
  };

  // Truncar comentario si es muy largo
  const truncateComment = (text, maxLength = 300) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const commentText = showFullComment ? review.comment : truncateComment(review.comment);

  return (
    <div className={`review-card ${review.verified ? 'verified' : ''}`}>
      {/* Header con usuario y calificación */}
      <div className="review-header">
        <div className="user-info">
          <div className="user-avatar">
            {review.customer?.avatar ? (
              <img src={review.customer.avatar} alt={review.customer.username} />
            ) : (
              <div className="avatar-placeholder">
                {review.customer?.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="user-details">
            <div className="username">
              {review.customer?.username || 'Usuario anónimo'}
              {review.verified && (
                <span className="verified-badge" title="Compra verificada">
                  ✓
                </span>
              )}
            </div>
            <div className="review-date">
              {formatDate(review.createdAt)}
              {review.edited && <span className="edited-indicator">(editado)</span>}
            </div>
          </div>
        </div>

        <div className="rating-info">
          <div className="stars">
            {renderStars(review.rating)}
          </div>
          <div className="rating-text">
            {review.rating} de 5 estrellas
          </div>
        </div>
      </div>

      {/* Título de la reseña */}
      <div className="review-title">
        <h4>{review.title}</h4>
      </div>

      {/* Comentario */}
      <div className="review-comment">
        <p>{commentText}</p>
        {review.comment.length > 300 && (
          <button
            className="show-more-btn"
            onClick={() => setShowFullComment(!showFullComment)}
          >
            {showFullComment ? 'Mostrar menos' : 'Mostrar más'}
          </button>
        )}
      </div>

      {/* Aspectos positivos y negativos */}
      {(review.pros?.length > 0 || review.cons?.length > 0) && (
        <div className="review-aspects">
          {review.pros?.length > 0 && (
            <div className="aspect-section pros">
              <h5>👍 Aspectos positivos</h5>
              <ul>
                {review.pros.map((pro, index) => (
                  <li key={index}>{pro}</li>
                ))}
              </ul>
            </div>
          )}

          {review.cons?.length > 0 && (
            <div className="aspect-section cons">
              <h5>👎 Aspectos negativos</h5>
              <ul>
                {review.cons.map((con, index) => (
                  <li key={index}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Imágenes */}
      {review.images && review.images.length > 0 && (
        <div className="review-images">
          <div className="images-grid">
            {review.images.slice(0, 4).map((image, index) => (
              <div key={index} className="image-item">
                <img src={image} alt={`Imagen ${index + 1}`} />
              </div>
            ))}
            {review.images.length > 4 && (
              <div className="more-images">
                +{review.images.length - 4} más
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recomendación */}
      <div className="review-recommendation">
        <span className={`recommendation ${review.recommended ? 'positive' : 'negative'}`}>
          {review.recommended ? '✓ Recomiendo este producto' : '✗ No recomiendo este producto'}
        </span>
      </div>

      {/* Acciones */}
      <div className="review-actions">
        <button
          className={`action-btn helpful ${helpfulClicked ? 'clicked' : ''}`}
          onClick={handleHelpfulClick}
          disabled={helpfulClicked}
        >
          👍 Útil ({review.helpful?.length || 0})
        </button>

        <button
          className={`action-btn report ${reportClicked ? 'clicked' : ''}`}
          onClick={handleReportClick}
          disabled={reportClicked}
        >
          🚨 Reportar
        </button>
      </div>

      {/* Respuesta del vendedor/admin */}
      {showResponse && review.response && (
        <div className="review-response">
          <div className="response-header">
            <div className="response-avatar">
              {review.response.respondedBy?.avatar ? (
                <img src={review.response.respondedBy.avatar} alt="Vendedor" />
              ) : (
                <div className="avatar-placeholder">V</div>
              )}
            </div>
            <div className="response-info">
              <div className="responder-name">
                Respuesta de {review.response.respondedBy?.username || 'Vendedor'}
              </div>
              <div className="response-date">
                {formatDate(review.response.respondedAt)}
              </div>
            </div>
          </div>
          <div className="response-content">
            <p>{review.response.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;