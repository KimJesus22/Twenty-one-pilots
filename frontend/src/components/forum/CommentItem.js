import React, { memo, useState } from 'react';
import CommentForm from './CommentForm';

const CommentItem = memo(({
  comment,
  threadId,
  onEdit,
  onDelete,
  onVote,
  currentUser,
  isEditing,
  onUpdate,
  onCancelEdit,
  t
}) => {
  const [voting, setVoting] = useState(false);

  const handleVote = async (voteType) => {
    if (voting) return;

    setVoting(true);
    try {
      await onVote(comment._id, voteType);
    } finally {
      setVoting(false);
    }
  };

  const handleEdit = () => {
    onEdit(comment);
  };

  const handleDelete = () => {
    onDelete(comment._id);
  };

  const handleUpdate = async (commentData) => {
    await onUpdate(commentData);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const canEdit = currentUser && comment.author._id === currentUser._id;
  const userVote = comment.userVote;

  if (isEditing) {
    return (
      <div className="comment-item editing">
        <CommentForm
          initialContent={comment.content}
          onSubmit={handleUpdate}
          onCancel={onCancelEdit}
          placeholder={t('forum.commentContent')}
          submitText={t('forum.updateComment')}
          t={t}
        />
      </div>
    );
  }

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div className="comment-author">
          <strong>{comment.author.username}</strong>
        </div>
        <div className="comment-meta">
          <span className="comment-date">
            {formatDate(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="edited-indicator">
              ({t('forum.edited')})
            </span>
          )}
        </div>
      </div>

      <div className="comment-content">
        <div className="comment-text">
          {comment.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="comment-actions">
        {currentUser && (
          <div className="vote-actions">
            <button
              onClick={() => handleVote('like')}
              className={`vote-btn like-btn ${userVote === 'like' ? 'active' : ''}`}
              disabled={voting}
              title={t('forum.like')}
            >
              👍 {comment.voteCount.likes}
            </button>

            <button
              onClick={() => handleVote('dislike')}
              className={`vote-btn dislike-btn ${userVote === 'dislike' ? 'active' : ''}`}
              disabled={voting}
              title={t('forum.dislike')}
            >
              👎 {comment.voteCount.dislikes}
            </button>
          </div>
        )}

        {canEdit && (
          <div className="comment-mod-actions">
            <button
              onClick={handleEdit}
              className="btn btn-secondary"
              title={t('forum.edit')}
            >
              ✏️ {t('forum.edit')}
            </button>

            <button
              onClick={handleDelete}
              className="btn btn-danger"
              title={t('forum.delete')}
            >
              🗑️ {t('forum.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

CommentItem.displayName = 'CommentItem';

export default CommentItem;