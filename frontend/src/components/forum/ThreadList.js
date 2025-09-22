import React, { memo } from 'react';
import ThreadItem from './ThreadItem';

const ThreadList = memo(({
  threads,
  pagination,
  onViewThread,
  onVoteThread,
  onDeleteThread,
  onPageChange,
  currentUser,
  loading,
  error,
  t
}) => {
  if (error) {
    return (
      <div className="forum-error">
        <h3>{t('common.error')}</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (threads.length === 0 && !loading) {
    return (
      <div className="no-threads">
        <h3>{t('forum.noThreads')}</h3>
        <p>{t('forum.noThreadsDesc')}</p>
      </div>
    );
  }

  return (
    <div className="thread-list">
      {threads.map(thread => (
        <ThreadItem
          key={thread._id}
          thread={thread}
          onView={onViewThread}
          onVote={onVoteThread}
          onDelete={onDeleteThread}
          currentUser={currentUser}
          t={t}
        />
      ))}

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="forum-pagination">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn btn-secondary"
          >
            {t('common.previous')}
          </button>

          <span className="pagination-info">
            {t('common.page')} {pagination.page} {t('common.of')} {pagination.pages}
            ({pagination.total} {t('forum.threads', 'threads')})
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="btn btn-secondary"
          >
            {t('common.next')}
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>{t('forum.loading')}</p>
        </div>
      )}
    </div>
  );
});

ThreadList.displayName = 'ThreadList';

export default ThreadList;