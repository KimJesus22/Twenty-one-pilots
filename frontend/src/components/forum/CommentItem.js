import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CommentForm from './CommentForm';
import { ForumUtils } from '../../utils/forumUtils';

const CommentItem = memo(({
  comment,
  _threadId,
  onEdit,
  onDelete,
  onVote,
  currentUser,
  isEditing,
  onUpdate,
  onCancelEdit,
  t,
  isRealTime = false
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
    <div className={`comment-item ${isRealTime ? 'real-time' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <strong>{comment.author.username}</strong>
          {isRealTime && (
            <span className="real-time-indicator" title={t('forum.realTimeComment') || 'Comentario en tiempo real'}>
              ⚡
            </span>
          )}
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
          {isRealTime && (
            <span className="real-time-badge">
              {t('forum.live') || 'EN VIVO'}
            </span>
          )}
        </div>
      </div>

      <div className="comment-content">
        <div className="comment-text">
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

        {/* Mostrar tags del comentario */}
        {comment.tags && comment.tags.length > 0 && (
          <div className="comment-tags">
            {comment.tags.map(tag => (
              <span key={tag} className="comment-tag" onClick={() => window.location.href = `/forum?tags=${tag}`}>
                #{tag}
              </span>
            ))}
          </div>
        )}
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