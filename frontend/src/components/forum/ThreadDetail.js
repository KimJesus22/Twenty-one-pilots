import React, { memo, useState } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

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
            {thread.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
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
                👍 {thread.voteCount.likes}
              </button>

              <button
                onClick={() => handleVoteThread('dislike')}
                className={`vote-btn dislike-btn ${userVote === 'dislike' ? 'active' : ''}`}
                disabled={voting}
                title={t('forum.dislike')}
              >
                👎 {thread.voteCount.dislikes}
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
          {thread.comments && thread.comments.length > 0 ? (
            thread.comments.map(comment => (
              <CommentItem
                key={comment._id}
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
              />
            ))
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