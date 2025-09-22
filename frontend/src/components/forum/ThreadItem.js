import React, { memo, useState } from 'react';

const ThreadItem = memo(({ thread, onView, onVote, onDelete, currentUser, t }) => {
  const [voting, setVoting] = useState(false);

  const handleVote = async (voteType) => {
    if (voting || !currentUser) return;

    setVoting(true);
    try {
      await onVote(thread._id, voteType);
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = () => {
    onDelete(thread._id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const canEdit = currentUser && thread.author._id === currentUser._id;
  const userVote = thread.userVote;

  return (
    <div className={`thread-item ${thread.isPinned ? 'pinned' : ''}`}>
      <div className="thread-header">
        <div className="thread-meta">
          {thread.isPinned && (
            <span className="thread-badge pinned">{t('forum.pinned')}</span>
          )}
          {thread.isLocked && (
            <span className="thread-badge locked">{t('forum.locked')}</span>
          )}
          <span className="thread-category">
            {t(`forum.categories.${thread.category}`)}
          </span>
        </div>

        <h3 className="thread-title" onClick={() => onView(thread)}>
          {thread.title}
        </h3>

        <div className="thread-author">
          {t('forum.by')} {thread.author.username} {t('forum.at')} {formatDate(thread.createdAt)}
        </div>
      </div>

      <div className="thread-content-preview">
        <p>{thread.content.substring(0, 200)}{thread.content.length > 200 ? '...' : ''}</p>
      </div>

      <div className="thread-tags">
        {thread.tags && thread.tags.map(tag => (
          <span key={tag} className="tag">#{tag}</span>
        ))}
      </div>

      <div className="thread-stats">
        <span className="stat-item">
          <span className="stat-icon">👁️</span>
          {thread.viewCount} {t('forum.views')}
        </span>
        <span className="stat-item">
          <span className="stat-icon">💬</span>
          {thread.commentCount} {t('forum.replies')}
        </span>
        <span className="stat-item">
          <span className="stat-icon">👍</span>
          {thread.voteCount.likes}
        </span>
        <span className="stat-item">
          <span className="stat-icon">👎</span>
          {thread.voteCount.dislikes}
        </span>
      </div>

      <div className="thread-actions">
        <button
          onClick={() => onView(thread)}
          className="btn btn-secondary"
        >
          {t('common.view')}
        </button>

        {currentUser && (
          <>
            <button
              onClick={() => handleVote('like')}
              className={`vote-btn like-btn ${userVote === 'like' ? 'active' : ''}`}
              disabled={voting}
              title={t('forum.like')}
            >
              👍 {thread.voteCount.likes}
            </button>

            <button
              onClick={() => handleVote('dislike')}
              className={`vote-btn dislike-btn ${userVote === 'dislike' ? 'active' : ''}`}
              disabled={voting}
              title={t('forum.dislike')}
            >
              👎 {thread.voteCount.dislikes}
            </button>
          </>
        )}

        {canEdit && (
          <button
            onClick={handleDelete}
            className="btn btn-danger"
            title={t('forum.delete')}
          >
            🗑️
          </button>
        )}
      </div>

      {thread.lastActivity && thread.lastActivity !== thread.createdAt && (
        <div className="thread-last-activity">
          {t('forum.lastReply')} {formatDate(thread.lastActivity)}
        </div>
      )}
    </div>
  );
});

ThreadItem.displayName = 'ThreadItem';

export default ThreadItem;