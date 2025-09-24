import React, { memo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import socketService from '../../services/socketService';

const ThreadDetail = memo(({
  thread,
  onBack,
  onVoteThread,
  onDeleteThread,
  onCommentCreated,
  onCommentUpdated,
  onCommentDeleted,
  onVoteComment,
  currentUser,
  t
}) => {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [voting, setVoting] = useState(false);
  const [realTimeComments, setRealTimeComments] = useState([]);
  const [realTimeVotes, setRealTimeVotes] = useState({});

  const handleVoteThread = async (voteType) => {
    if (voting) return;

    setVoting(true);
    try {
      await onVoteThread(thread._id, voteType);
    } finally {
      setVoting(false);
    }
  };

  const handleDeleteThread = () => {
    onDeleteThread(thread._id);
  };

  const handleCommentSubmit = async (commentData) => {
    await onCommentCreated(thread._id, commentData);
    setShowCommentForm(false);
  };

  const handleCommentEdit = (comment) => {
    setEditingComment(comment);
  };

  const handleCommentUpdate = async (commentData) => {
    await onCommentUpdated(editingComment._id, commentData);
    setEditingComment(null);
  };

  const handleCommentDelete = (commentId) => {
    onCommentDeleted(commentId);
  };

  const handleVoteComment = async (commentId, voteType) => {
    await onVoteComment(commentId, voteType);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const canEditThread = currentUser && thread.author._id === currentUser._id;
  const userVote = thread.userVote;

  // Inicializar listeners de Socket.io para este hilo
  useEffect(() => {
    if (!thread?._id) return;

    // Unirse a la sala del hilo
    socketService.joinThread(thread._id);

    // Listeners para eventos en tiempo real
    const handleNewComment = (data) => {
      if (data.threadId === thread._id) {
        console.log('Nuevo comentario recibido:', data);
        setRealTimeComments(prev => [...prev, data.comment]);
      }
    };

    const handleCommentUpdate = (data) => {
      if (data.threadId === thread._id) {
        console.log('Comentario actualizado:', data);
        // Aquí podríamos actualizar el comentario específico
      }
    };

    const handleCommentDelete = (data) => {
      if (data.threadId === thread._id) {
        console.log('Comentario eliminado:', data);
        // Aquí podríamos remover el comentario de la lista
      }
    };

    const handleThreadVote = (data) => {
      if (data.threadId === thread._id) {
        console.log('Voto en hilo recibido:', data);
        setRealTimeVotes(prev => ({
          ...prev,
          thread: data.voteCount
        }));
      }
    };

    const handleCommentVote = (data) => {
      if (data.threadId === thread._id) {
        console.log('Voto en comentario recibido:', data);
        setRealTimeVotes(prev => ({
          ...prev,
          [`comment-${data.commentId}`]: data.voteCount
        }));
      }
    };

    // Registrar listeners
    socketService.onNewComment(handleNewComment);
    socketService.onCommentUpdate(handleCommentUpdate);
    socketService.onCommentDelete(handleCommentDelete);
    socketService.onThreadVote(handleThreadVote);
    socketService.onCommentVote(handleCommentVote);

    // Cleanup
    return () => {
      socketService.leaveThread(thread._id);
      socketService.off('new-comment', handleNewComment);
      socketService.off('comment-update', handleCommentUpdate);
      socketService.off('comment-delete', handleCommentDelete);
      socketService.off('thread-vote', handleThreadVote);
      socketService.off('comment-vote', handleCommentVote);
    };
  }, [thread?._id]);

  return (
    <div className="thread-detail">
      <div className="thread-detail-header">
        <button onClick={onBack} className="back-btn">
          ← {t('common.previous')}
        </button>
        <div className="thread-badges">
          {thread.isPinned && (
            <span className="badge pinned">{t('forum.pinned')}</span>
          )}
          {thread.isLocked && (
            <span className="badge locked">{t('forum.locked')}</span>
          )}
          <span className="badge category">
            {t(`forum.categories.${thread.category}`)}
          </span>
        </div>
      </div>

      <div className="thread-content">
        <div className="thread-title-section">
          <h1>{thread.title}</h1>
          <div className="thread-meta">
            <span className="author">
              {t('forum.by')} {thread.author.username}
            </span>
            <span className="date">
              {t('forum.at')} {formatDate(thread.createdAt)}
            </span>
            {thread.isEdited && (
              <span className="edited">
                ({t('forum.edited')})
              </span>
            )}
          </div>
        </div>

        <div className="thread-body">
          <div className="thread-text">
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
              {thread.content || ''}
            </ReactMarkdown>
          </div>

          {thread.tags && thread.tags.length > 0 && (
            <div className="thread-tags">
              {thread.tags.map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="thread-stats">
          <div className="stat-item">
            <span className="stat-icon">👁️</span>
            {thread.viewCount} {t('forum.views')}
          </div>
          <div className="stat-item">
            <span className="stat-icon">💬</span>
            {thread.commentCount} {t('forum.replies')}
          </div>
        </div>

        <div className="thread-actions">
          {currentUser && (
            <div className="vote-actions">
              <button
                onClick={() => handleVoteThread('like')}
                className={`vote-btn like-btn ${userVote === 'like' ? 'active' : ''}`}
                disabled={voting}
                title={t('forum.like')}
              >
                👍 {(realTimeVotes.thread?.likes ?? thread.voteCount.likes)}
              </button>

              <button
                onClick={() => handleVoteThread('dislike')}
                className={`vote-btn dislike-btn ${userVote === 'dislike' ? 'active' : ''}`}
                disabled={voting}
                title={t('forum.dislike')}
              >
                👎 {(realTimeVotes.thread?.dislikes ?? thread.voteCount.dislikes)}
              </button>
            </div>
          )}

          {canEditThread && (
            <div className="mod-actions">
              <button
                onClick={handleDeleteThread}
                className="btn btn-danger"
                title={t('forum.delete')}
              >
                🗑️ {t('forum.delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="comments-section">
        <div className="comments-header">
          <h2>{t('forum.replies')} ({thread.comments?.length || 0})</h2>

          {currentUser && !thread.isLocked && (
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="btn btn-primary"
            >
              {showCommentForm ? t('forum.cancel') : t('forum.reply')}
            </button>
          )}

          {thread.isLocked && (
            <span className="locked-notice">{t('forum.threadLocked')}</span>
          )}
        </div>

        {showCommentForm && (
          <CommentForm
            onSubmit={handleCommentSubmit}
            onCancel={() => setShowCommentForm(false)}
            placeholder={t('forum.commentContent')}
            submitText={t('forum.postComment')}
            t={t}
          />
        )}

        <div className="comments-list">
          {((thread.comments && thread.comments.length > 0) || realTimeComments.length > 0) ? (
            <>
              {/* Comentarios originales */}
              {thread.comments && thread.comments.map(comment => (
                <CommentItem
                  key={comment._id}
                  comment={{
                    ...comment,
                    voteCount: realTimeVotes[`comment-${comment._id}`] || comment.voteCount
                  }}
                  threadId={thread._id}
                  onEdit={handleCommentEdit}
                  onDelete={handleCommentDelete}
                  onVote={handleVoteComment}
                  currentUser={currentUser}
                  isEditing={editingComment?._id === comment._id}
                  onUpdate={handleCommentUpdate}
                  onCancelEdit={() => setEditingComment(null)}
                  t={t}
                />
              ))}

              {/* Comentarios en tiempo real */}
              {realTimeComments.map(comment => (
                <CommentItem
                  key={`rt-${comment._id}`}
                  comment={comment}
                  threadId={thread._id}
                  onEdit={handleCommentEdit}
                  onDelete={handleCommentDelete}
                  onVote={handleVoteComment}
                  currentUser={currentUser}
                  isEditing={editingComment?._id === comment._id}
                  onUpdate={handleCommentUpdate}
                  onCancelEdit={() => setEditingComment(null)}
                  t={t}
                  isRealTime={true}
                />
              ))}
            </>
          ) : (
            <div className="no-comments">
              <h3>{t('forum.noComments')}</h3>
              <p>{t('forum.noCommentsDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ThreadDetail.displayName = 'ThreadDetail';

export default ThreadDetail;