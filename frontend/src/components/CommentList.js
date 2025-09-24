import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CommentForm from './CommentForm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './CommentList.css';

const CommentItem = ({
  comment,
  targetType,
  targetId,
  onReply,
  onEdit,
  onDelete,
  onVote,
  onReport,
  showReplyForm,
  setShowReplyForm,
  replies = [],
  loadingReplies = false,
  onLoadMoreReplies
}) => {
  const { user } = useAuth();
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [voting, setVoting] = useState(false);

  const handleVote = async (voteType) => {
    if (!user || voting) return;

    setVoting(true);
    try {
      await onVote(comment._id, voteType);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const handleReport = async () => {
    if (!user || !window.confirm('¿Estás seguro de que quieres reportar este comentario?')) return;

    try {
      await onReport(comment._id, 'Contenido inapropiado');
      alert('Comentario reportado exitosamente');
    } catch (error) {
      console.error('Error reporting:', error);
      alert('Error al reportar el comentario');
    }
  };

  const isAuthor = user && comment.author._id === user._id;
  const userVote = comment.votes?.find(vote => vote.user === user?._id)?.type;

  const displayedReplies = showAllReplies ? replies : replies.slice(0, 3);

  return (
    <div className={`comment-item ${comment.isFeatured ? 'featured' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <img
            src={comment.author.avatar || '/default-avatar.png'}
            alt={comment.author.username}
            className="author-avatar"
          />
          <div className="author-info">
            <span className="author-name">{comment.author.username}</span>
            <span className="comment-date">
              {new Date(comment.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        <div className="comment-actions">
          {comment.isFeatured && (
            <span className="featured-badge">⭐ Destacado</span>
          )}

          {comment.rating && (
            <div className="comment-rating">
              {'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}
              <span className="rating-number">{comment.rating}/5</span>
            </div>
          )}
        </div>
      </div>

      {comment.title && (
        <h4 className="comment-title">{comment.title}</h4>
      )}

      <div className="comment-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom components for better styling
            p: ({ children }) => <p className="markdown-p">{children}</p>,
            blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
            code: ({ inline, children }) => inline ?
              <code className="markdown-inline-code">{children}</code> :
              <code className="markdown-code-block">{children}</code>,
            pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
            ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
            ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
            li: ({ children }) => <li className="markdown-li">{children}</li>,
            a: ({ href, children }) => <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">{children}</a>,
            img: ({ src, alt }) => <img src={src} alt={alt} className="markdown-img" />,
            strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
            em: ({ children }) => <em className="markdown-em">{children}</em>,
            del: ({ children }) => <del className="markdown-del">{children}</del>,
            h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
          }}
        >
          {comment.content || ''}
        </ReactMarkdown>
      </div>

      {(comment.pros?.length > 0 || comment.cons?.length > 0) && (
        <div className="comment-pros-cons">
          {comment.pros?.length > 0 && (
            <div className="pros">
              <strong>👍 Positivo:</strong>
              <ul>
                {comment.pros.map((pro, index) => (
                  <li key={index}>{pro}</li>
                ))}
              </ul>
            </div>
          )}

          {comment.cons?.length > 0 && (
            <div className="cons">
              <strong>👎 Negativo:</strong>
              <ul>
                {comment.cons.map((con, index) => (
                  <li key={index}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {comment.recommended !== undefined && (
        <div className={`recommendation ${comment.recommended ? 'positive' : 'negative'}`}>
          {comment.recommended ? '✅ Recomienda este contenido' : '❌ No recomienda este contenido'}
        </div>
      )}

      <div className="comment-footer">
        <div className="comment-stats">
          <button
            className={`vote-btn like ${userVote === 'like' ? 'active' : ''}`}
            onClick={() => handleVote('like')}
            disabled={!user || voting}
          >
            👍 {comment.voteCount?.likes || 0}
          </button>

          <button
            className={`vote-btn dislike ${userVote === 'dislike' ? 'active' : ''}`}
            onClick={() => handleVote('dislike')}
            disabled={!user || voting}
          >
            👎 {comment.voteCount?.dislikes || 0}
          </button>

          <span className="replies-count">
            💬 {comment.replyCount || 0} respuesta{comment.replyCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="comment-controls">
          {user && (
            <button
              className="control-btn"
              onClick={() => setShowReplyForm(comment._id)}
            >
              Responder
            </button>
          )}

          {isAuthor && (
            <>
              <button
                className="control-btn"
                onClick={() => onEdit(comment)}
              >
                Editar
              </button>

              <button
                className="control-btn danger"
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
                    onDelete(comment._id);
                  }
                }}
              >
                Eliminar
              </button>
            </>
          )}

          {user && !isAuthor && (
            <button
              className="control-btn warning"
              onClick={handleReport}
            >
              Reportar
            </button>
          )}
        </div>
      </div>

      {showReplyForm === comment._id && (
        <div className="reply-form-container">
          <CommentForm
            targetType={targetType}
            targetId={targetId}
            onCommentSubmit={async (data) => {
              await onReply(comment._id, data);
              setShowReplyForm(null);
            }}
            onCancel={() => setShowReplyForm(null)}
            isReply={true}
            parentCommentId={comment._id}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="comment-replies">
          {displayedReplies.map(reply => (
            <CommentItem
              key={reply._id}
              comment={reply}
              targetType={targetType}
              targetId={targetId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onVote={onVote}
              onReport={onReport}
              showReplyForm={showReplyForm}
              setShowReplyForm={setShowReplyForm}
            />
          ))}

          {replies.length > 3 && !showAllReplies && (
            <button
              className="load-more-replies"
              onClick={() => setShowAllReplies(true)}
            >
              Ver {replies.length - 3} respuesta{replies.length - 3 !== 1 ? 's' : ''} más
            </button>
          )}

          {loadingReplies && (
            <div className="loading-replies">
              <div className="loading-spinner"></div>
              <span>Cargando respuestas...</span>
            </div>
          )}

          {replies.length >= 10 && onLoadMoreReplies && (
            <button
              className="load-more-replies"
              onClick={onLoadMoreReplies}
            >
              Cargar más respuestas
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const CommentList = ({
  targetType,
  targetId,
  comments = [],
  pagination = null,
  loading = false,
  onLoadMore,
  onCommentSubmit,
  onReply,
  onEdit,
  onDelete,
  onVote,
  onReport
}) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingComment, setEditingComment] = useState(null);

  const handleReply = async (commentId, replyData) => {
    await onReply(commentId, replyData);
  };

  const handleEdit = (comment) => {
    setEditingComment(comment);
    setShowCommentForm(true);
  };

  const handleEditSubmit = async (data) => {
    await onEdit(editingComment._id, data);
    setEditingComment(null);
    setShowCommentForm(false);
  };

  const handleDelete = async (commentId) => {
    await onDelete(commentId);
  };

  const handleVote = async (commentId, voteType) => {
    await onVote(commentId, voteType);
  };

  const handleReport = async (commentId, reason) => {
    await onReport(commentId, reason);
  };

  return (
    <div className="comment-list">
      <div className="comment-list-header">
        <h3>Comentarios y reseñas</h3>
        <div className="comment-stats">
          <span>{comments.length} comentario{comments.length !== 1 ? 's' : ''}</span>
          {user && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCommentForm(true)}
            >
              ✏️ Escribir reseña
            </button>
          )}
        </div>
      </div>

      {showCommentForm && !editingComment && (
        <CommentForm
          targetType={targetType}
          targetId={targetId}
          onCommentSubmit={async (data) => {
            await onCommentSubmit(data);
            setShowCommentForm(false);
          }}
          onCancel={() => setShowCommentForm(false)}
        />
      )}

      {showCommentForm && editingComment && (
        <CommentForm
          targetType={targetType}
          targetId={targetId}
          initialData={editingComment}
          onCommentSubmit={handleEditSubmit}
          onCancel={() => {
            setEditingComment(null);
            setShowCommentForm(false);
          }}
        />
      )}

      <div className="comments-container">
        {loading && comments.length === 0 ? (
          <div className="loading-comments">
            <div className="loading-spinner"></div>
            <span>Cargando comentarios...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="no-comments">
            <p>¡Sé el primero en dejar una reseña!</p>
            {user && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCommentForm(true)}
              >
                Escribir reseña
              </button>
            )}
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentItem
                key={comment._id}
                comment={comment}
                targetType={targetType}
                targetId={targetId}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onVote={handleVote}
                onReport={handleReport}
                showReplyForm={showReplyForm}
                setShowReplyForm={setShowReplyForm}
                replies={comment.replies || []}
              />
            ))}

            {pagination && pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  onClick={onLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Cargando...' : 'Cargar más comentarios'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentList;