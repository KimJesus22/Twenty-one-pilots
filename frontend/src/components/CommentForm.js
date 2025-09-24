import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StarRating from './StarRating';
import MarkdownEditor from './MarkdownEditor';
import './CommentForm.css';

const CommentForm = ({
  targetType,
  _targetId,
  onCommentSubmit,
  onCancel,
  initialData = null,
  isReply = false,
  _parentCommentId = null,
  loading = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 0,
    pros: [],
    cons: [],
    recommended: true
  });
  const [currentPro, setCurrentPro] = useState('');
  const [currentCon, setCurrentCon] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        rating: initialData.rating || 0,
        pros: initialData.pros || [],
        cons: initialData.cons || [],
        recommended: initialData.recommended !== false
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.content.trim()) {
      newErrors.content = 'El contenido es obligatorio';
    }

    if (formData.content.length < 10) {
      newErrors.content = 'El contenido debe tener al menos 10 caracteres';
    }

    if (formData.content.length > 2000) {
      newErrors.content = 'El contenido no puede exceder 2000 caracteres';
    }

    if (!isReply && formData.title.length > 100) {
      newErrors.title = 'El título no puede exceder 100 caracteres';
    }

    if (!isReply && formData.rating < 1 && formData.rating > 5) {
      newErrors.rating = 'La valoración debe estar entre 1 y 5 estrellas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = {
        ...formData,
        pros: formData.pros.filter(pro => pro.trim()),
        cons: formData.cons.filter(con => con.trim())
      };

      if (isReply) {
        // Para replies, solo necesitamos content
        submitData.content = formData.content;
        delete submitData.title;
        delete submitData.rating;
        delete submitData.pros;
        delete submitData.cons;
        delete submitData.recommended;
      }

      await onCommentSubmit(submitData);
    } catch (error) {
      console.error('Error submitting comment:', error);
      setErrors({
        submit: error.response?.data?.message || 'Error al enviar el comentario'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: null }));
    }
  };

  const addPro = () => {
    if (currentPro.trim() && formData.pros.length < 5) {
      setFormData(prev => ({
        ...prev,
        pros: [...prev.pros, currentPro.trim()]
      }));
      setCurrentPro('');
    }
  };

  const removePro = (index) => {
    setFormData(prev => ({
      ...prev,
      pros: prev.pros.filter((_, i) => i !== index)
    }));
  };

  const addCon = () => {
    if (currentCon.trim() && formData.cons.length < 5) {
      setFormData(prev => ({
        ...prev,
        cons: [...prev.cons, currentCon.trim()]
      }));
      setCurrentCon('');
    }
  };

  const removeCon = (index) => {
    setFormData(prev => ({
      ...prev,
      cons: prev.cons.filter((_, i) => i !== index)
    }));
  };

  if (!user) {
    return (
      <div className="comment-form-login-required">
        <p>Debes iniciar sesión para {isReply ? 'responder' : 'comentar'}.</p>
        <button onClick={() => window.location.href = '/login'} className="btn btn-primary">
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`comment-form ${isReply ? 'reply-form' : ''}`}>
      <div className="comment-form-header">
        <h3>
          {initialData ? 'Editar' : isReply ? 'Responder' : 'Escribir reseña'}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-btn">
            ✕
          </button>
        )}
      </div>

      {!isReply && (
        <div className="comment-form-rating">
          <label>Tu valoración:</label>
          <StarRating
            initialRating={formData.rating}
            onRatingChange={handleRatingChange}
            size="large"
            interactive={!loading && !isSubmitting}
          />
          {errors.rating && <span className="error-text">{errors.rating}</span>}
        </div>
      )}

      {!isReply && (
        <div className="comment-form-field">
          <label htmlFor="comment-title">Título (opcional):</label>
          <input
            type="text"
            id="comment-title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Resumen de tu reseña..."
            maxLength={100}
            disabled={loading || isSubmitting}
          />
          <div className="char-count">{formData.title.length}/100</div>
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>
      )}

      <div className="comment-form-field">
        <label htmlFor="comment-content">
          {isReply ? 'Tu respuesta:' : 'Tu reseña:'}
        </label>
        <MarkdownEditor
          value={formData.content}
          onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
          placeholder={isReply ? 'Escribe tu respuesta...' : 'Comparte tu opinión detallada...'}
          className="comment-markdown-editor"
        />
        <div className="char-count">{formData.content.length}/2000</div>
        {errors.content && <span className="error-text">{errors.content}</span>}
      </div>

      {!isReply && (
        <>
          <div className="comment-form-pros-cons">
            <div className="pros-section">
              <label>Aspectos positivos:</label>
              <div className="add-item">
                <input
                  type="text"
                  value={currentPro}
                  onChange={(e) => setCurrentPro(e.target.value)}
                  placeholder="Ej: Excelente producción..."
                  maxLength={100}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPro())}
                  disabled={loading || isSubmitting}
                />
                <button
                  type="button"
                  onClick={addPro}
                  disabled={!currentPro.trim() || formData.pros.length >= 5 || loading || isSubmitting}
                  className="add-btn"
                >
                  +
                </button>
              </div>
              <ul className="items-list">
                {formData.pros.map((pro, index) => (
                  <li key={index}>
                    {pro}
                    <button
                      type="button"
                      onClick={() => removePro(index)}
                      disabled={loading || isSubmitting}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cons-section">
              <label>Aspectos negativos:</label>
              <div className="add-item">
                <input
                  type="text"
                  value={currentCon}
                  onChange={(e) => setCurrentCon(e.target.value)}
                  placeholder="Ej: Podría mejorar el ritmo..."
                  maxLength={100}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCon())}
                  disabled={loading || isSubmitting}
                />
                <button
                  type="button"
                  onClick={addCon}
                  disabled={!currentCon.trim() || formData.cons.length >= 5 || loading || isSubmitting}
                  className="add-btn"
                >
                  +
                </button>
              </div>
              <ul className="items-list">
                {formData.cons.map((con, index) => (
                  <li key={index}>
                    {con}
                    <button
                      type="button"
                      onClick={() => removeCon(index)}
                      disabled={loading || isSubmitting}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="comment-form-recommendation">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.recommended}
                onChange={(e) => setFormData(prev => ({ ...prev, recommended: e.target.checked }))}
                disabled={loading || isSubmitting}
              />
              Recomiendo este {targetType === 'album' ? 'álbum' : 'canción'}
            </label>
          </div>
        </>
      )}

      {errors.submit && (
        <div className="error-message">
          {errors.submit}
        </div>
      )}

      <div className="comment-form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || isSubmitting || !formData.content.trim()}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Enviando...' : initialData ? 'Actualizar' : isReply ? 'Responder' : 'Publicar reseña'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;