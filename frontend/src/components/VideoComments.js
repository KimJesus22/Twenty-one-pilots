import React, { useState, useEffect, useCallback } from 'react';
import CommentItem from './forum/CommentItem';
import CommentForm from './forum/CommentForm';
import './VideoComments.css';

const VideoComments = ({ videoId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [editingComment, setEditingComment] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Cargar comentarios al montar o cambiar de video
  useEffect(() => {
    if (videoId) {
      loadComments(true);
    }
  }, [videoId]);

  const loadComments = useCallback(async (reset = false) => {
    if (loading || (loadingMore && !reset)) return;

    try {
      if (reset) {
        setLoading(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      const response = await fetch(`/api/videos/comments/${videoId}?page=${reset ? 1 : page}&limit=10`);
      const result = await response.json();

      if (result.success) {
        if (reset) {
          setComments(result.data);
        } else {
          setComments(prev => [...prev, ...result.data]);
          setPage(prev => prev + 1);
        }

        // Simular que no hay más después de 3 páginas
        if (page >= 3) {
          setHasMore(false);
        }
      } else {
        setError(result.message || 'Error al cargar comentarios');
      }
    } catch (err) {
      setError('Error de conexión al cargar comentarios');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [videoId, page, loading, loadingMore]);

  const handleCreateComment = async (commentData) => {
    try {
      const response = await fetch(`/api/videos/comments/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Agregar token de autenticación si es necesario
        },
        body: JSON.stringify(commentData)
      });

      const result = await response.json();

      if (result.success) {
        setComments(prev => [result.data, ...prev]);
        setShowCommentForm(false);
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  const handleUpdateComment = async (commentData) => {
    if (!editingComment) return;

    try {
      const response = await fetch(`/api/videos/comments/${editingComment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Agregar token de autenticación si es necesario
        },
        body: JSON.stringify(commentData)
      });

      const result = await response.json();

      if (result.success) {
        setComments(prev => prev.map(comment =>
          comment._id === editingComment._id ? result.data : comment
        ));
        setEditingComment(null);
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      const response = await fetch(`/api/videos/comments/${commentId}`, {
        method: 'DELETE',
        // Agregar token de autenticación si es necesario
      });

      const result = await response.json();

      if (result.success) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
      } else {
        alert(result.message || 'Error al eliminar comentario');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error de conexión al eliminar comentario');
    }
  };

  const handleVoteComment = async (commentId, voteType) => {
    try {
      const response = await fetch(`/api/videos/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Agregar token de autenticación si es necesario
        },
        body: JSON.stringify({ voteType })
      });

      const result = await response.json();

      if (result.success) {
        setComments(prev => prev.map(comment =>
          comment._id === commentId ? result.data : comment
        ));
      } else {
        alert(result.message || 'Error al votar');
      }
    } catch (error) {
      console.error('Error voting comment:', error);
      alert('Error de conexión al votar');
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
  };

  if (!videoId) {
    return null;
  }

  return (
    <div className="video-comments">
      <div className="comments-header">
        <h3>Comentarios ({comments.length})</h3>
        {currentUser && (
          <button
            className="add-comment-btn"
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            {showCommentForm ? 'Cancelar' : 'Agregar comentario'}
          </button>
        )}
      </div>

      {error && (
        <div className="comments-error">
          <p>{error}</p>
          <button onClick={() => loadComments(true)}>Reintentar</button>
        </div>
      )}

      {currentUser && showCommentForm && (
        <div className="comment-form-container">
          <CommentForm
            onSubmit={handleCreateComment}
            onCancel={() => setShowCommentForm(false)}
            placeholder="Escribe tu comentario..."
            submitText="Publicar comentario"
            t={(key) => key} // Función de traducción simple
          />
        </div>
      )}

      <div className="comments-list">
        {loading && comments.length === 0 && (
          <div className="comments-loading">
            <div className="loading-spinner"></div>
            <span>Cargando comentarios...</span>
          </div>
        )}

        {comments.map(comment => (
          <CommentItem
            key={comment._id}
            comment={comment}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
            onVote={handleVoteComment}
            currentUser={currentUser}
            isEditing={editingComment?._id === comment._id}
            onUpdate={handleUpdateComment}
            onCancelEdit={handleCancelEdit}
            t={(key) => key} // Función de traducción simple
          />
        ))}

        {loadingMore && (
          <div className="comments-loading-more">
            <div className="loading-spinner"></div>
            <span>Cargando más comentarios...</span>
          </div>
        )}

        {!loadingMore && hasMore && comments.length > 0 && (
          <div className="load-more-comments">
            <button
              className="load-more-btn"
              onClick={() => loadComments(false)}
            >
              Cargar más comentarios
            </button>
          </div>
        )}

        {!hasMore && comments.length > 0 && (
          <div className="no-more-comments">
            <span>No hay más comentarios</span>
          </div>
        )}

        {comments.length === 0 && !loading && (
          <div className="no-comments">
            <p>Se el primero en comentar este video</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoComments;