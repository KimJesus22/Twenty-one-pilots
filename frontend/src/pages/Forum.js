import React, { useEffect, useState, useCallback, memo, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import forumAPI from '../api/forum';
import './Forum.css';

// Lazy loading de componentes
const ThreadList = lazy(() => import('../components/forum/ThreadList'));
const ThreadDetail = lazy(() => import('../components/forum/ThreadDetail'));
const CreateThreadForm = lazy(() => import('../components/forum/CreateThreadForm'));
const ForumFilters = lazy(() => import('../components/forum/ForumFilters'));

// Componente de carga
const LoadingSpinner = () => (
  <div className="forum-loading">
    <div className="spinner"></div>
    <p>Cargando...</p>
  </div>
);

// Componente de estadísticas del foro
const ForumStats = memo(({ stats, t }) => (
  <div className="forum-stats">
    <h3>{t('forum.stats')}</h3>
    <div className="stats-grid">
      <div className="stat-item">
        <div className="stat-number">{stats.totalThreads}</div>
        <div className="stat-label">{t('forum.totalThreads')}</div>
      </div>
      <div className="stat-item">
        <div className="stat-number">{stats.totalComments}</div>
        <div className="stat-label">{t('forum.totalComments')}</div>
      </div>
      <div className="stat-item">
        <div className="stat-number">{stats.totalUsers}</div>
        <div className="stat-label">{t('forum.totalUsers')}</div>
      </div>
    </div>
  </div>
));

const Forum = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  // Estados principales
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'create'
  const [selectedThread, setSelectedThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtros
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    category: 'all',
    search: '',
    sort: 'lastActivity',
    order: 'desc',
    tags: [],
    author: '',
    minDate: '',
    maxDate: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar hilos cuando cambian los filtros
  useEffect(() => {
    if (currentView === 'list') {
      loadThreads();
    }
  }, [filters, currentView]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesResponse, statsResponse] = await Promise.all([
        forumAPI.getCategories(),
        forumAPI.getStats()
      ]);

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data.categories);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data.stats);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (params.category === 'all') delete params.category;
      if (params.tags.length === 0) delete params.tags;

      const response = await forumAPI.getThreads(params);

      if (response.success) {
        setThreads(response.data.threads);
        setPagination(response.data.pagination);
        setError(null);
      } else {
        throw new Error(response.message || 'Error loading threads');
      }
    } catch (err) {
      console.error('Error loading threads:', err);
      setError(err.message);
      // Fallback a datos mock
      setThreads([
        {
          _id: '1',
          title: 'Welcome to the Twenty One Pilots Forum!',
          content: 'This is the official community forum for Twenty One Pilots fans.',
          author: { username: 'admin' },
          category: 'announcements',
          tags: ['welcome', 'community'],
          voteCount: { likes: 15, dislikes: 0 },
          viewCount: 150,
          commentCount: 8,
          isPinned: true,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Funciones de navegación
  const handleViewThread = useCallback((thread) => {
    setSelectedThread(thread);
    setCurrentView('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedThread(null);
    setCurrentView('list');
  }, []);

  const handleCreateThread = useCallback(() => {
    setCurrentView('create');
  }, []);

  const handleCancelCreate = useCallback(() => {
    setCurrentView('list');
  }, []);

  // Funciones de filtros
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  // Funciones de acciones del foro
  const handleThreadCreated = useCallback(async (threadData) => {
    try {
      const response = await forumAPI.createThread(threadData);

      if (response.success) {
        showNotification(t('forum.threadCreated'), 'success');
        setCurrentView('list');
        loadThreads(); // Recargar lista
      } else {
        throw new Error(response.message || 'Error creating thread');
      }
    } catch (err) {
      console.error('Error creating thread:', err);
      showNotification(err.message, 'error');
    }
  }, [t, loadThreads]);

  const handleThreadUpdated = useCallback(async (threadId, threadData) => {
    try {
      const response = await forumAPI.updateThread(threadId, threadData);

      if (response.success) {
        showNotification(t('forum.threadUpdated'), 'success');
        // Actualizar el hilo en la lista
        setThreads(prev => prev.map(thread =>
          thread._id === threadId ? response.data.thread : thread
        ));
        if (selectedThread && selectedThread._id === threadId) {
          setSelectedThread(response.data.thread);
        }
      } else {
        throw new Error(response.message || 'Error updating thread');
      }
    } catch (err) {
      console.error('Error updating thread:', err);
      showNotification(err.message, 'error');
    }
  }, [t, selectedThread]);

  const handleThreadDeleted = useCallback(async (threadId) => {
    if (!window.confirm(t('forum.deleteThreadConfirm'))) return;

    try {
      const response = await forumAPI.deleteThread(threadId);

      if (response.success) {
        showNotification(t('forum.threadDeleted'), 'success');
        if (selectedThread && selectedThread._id === threadId) {
          handleBackToList();
        }
        loadThreads(); // Recargar lista
      } else {
        throw new Error(response.message || 'Error deleting thread');
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
      showNotification(err.message, 'error');
    }
  }, [t, selectedThread, handleBackToList, loadThreads]);

  const handleVoteThread = useCallback(async (threadId, voteType) => {
    try {
      const response = await forumAPI.voteThread(threadId, voteType);

      if (response.success) {
        // Actualizar votos en la lista
        setThreads(prev => prev.map(thread =>
          thread._id === threadId
            ? { ...thread, voteCount: response.data.voteCount, userVote: voteType }
            : thread
        ));

        if (selectedThread && selectedThread._id === threadId) {
          setSelectedThread(prev => ({
            ...prev,
            voteCount: response.data.voteCount,
            userVote: voteType
          }));
        }
      }
    } catch (err) {
      console.error('Error voting on thread:', err);
      showNotification(err.message, 'error');
    }
  }, [selectedThread]);

  const handleCommentCreated = useCallback(async (threadId, commentData) => {
    try {
      const response = await forumAPI.createComment(threadId, commentData);

      if (response.success) {
        showNotification(t('forum.commentCreated'), 'success');

        // Actualizar contador de comentarios
        setThreads(prev => prev.map(thread =>
          thread._id === threadId
            ? { ...thread, commentCount: thread.commentCount + 1, lastActivity: new Date().toISOString() }
            : thread
        ));

        if (selectedThread && selectedThread._id === threadId) {
          setSelectedThread(prev => ({
            ...prev,
            comments: [...prev.comments, response.data.comment],
            commentCount: prev.commentCount + 1,
            lastActivity: new Date().toISOString()
          }));
        }
      } else {
        throw new Error(response.message || 'Error creating comment');
      }
    } catch (err) {
      console.error('Error creating comment:', err);
      showNotification(err.message, 'error');
    }
  }, [t, selectedThread]);

  const handleCommentUpdated = useCallback(async (commentId, commentData) => {
    try {
      const response = await forumAPI.updateComment(commentId, commentData);

      if (response.success) {
        showNotification(t('forum.commentUpdated'), 'success');

        if (selectedThread) {
          setSelectedThread(prev => ({
            ...prev,
            comments: prev.comments.map(comment =>
              comment._id === commentId ? response.data.comment : comment
            )
          }));
        }
      } else {
        throw new Error(response.message || 'Error updating comment');
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      showNotification(err.message, 'error');
    }
  }, [t, selectedThread]);

  const handleCommentDeleted = useCallback(async (commentId) => {
    if (!window.confirm(t('forum.deleteCommentConfirm'))) return;

    try {
      const response = await forumAPI.deleteComment(commentId);

      if (response.success) {
        showNotification(t('forum.commentDeleted'), 'success');

        // Actualizar contador de comentarios
        setThreads(prev => prev.map(thread =>
          thread._id === selectedThread?._id
            ? { ...thread, commentCount: Math.max(0, thread.commentCount - 1) }
            : thread
        ));

        if (selectedThread) {
          setSelectedThread(prev => ({
            ...prev,
            comments: prev.comments.filter(comment => comment._id !== commentId),
            commentCount: Math.max(0, prev.commentCount - 1)
          }));
        }
      } else {
        throw new Error(response.message || 'Error deleting comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      showNotification(err.message, 'error');
    }
  }, [t, selectedThread]);

  const handleVoteComment = useCallback(async (commentId, voteType) => {
    try {
      const response = await forumAPI.voteComment(commentId, voteType);

      if (response.success && selectedThread) {
        setSelectedThread(prev => ({
          ...prev,
          comments: prev.comments.map(comment =>
            comment._id === commentId
              ? { ...comment, voteCount: response.data.voteCount, userVote: voteType }
              : comment
          )
        }));
      }
    } catch (err) {
      console.error('Error voting on comment:', err);
      showNotification(err.message, 'error');
    }
  }, [selectedThread]);

  // Función para mostrar notificaciones
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  if (loading && threads.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="forum">
      <div className="forum-header">
        <h1>{t('forum.title')}</h1>
        <p>{t('forum.subtitle')}</p>

        {currentView === 'list' && isAuthenticated() && (
          <button
            onClick={handleCreateThread}
            className="btn btn-primary create-thread-btn"
          >
            {t('forum.createThread')}
          </button>
        )}
      </div>

      {/* Notificaciones */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Estadísticas */}
      {stats && currentView === 'list' && (
        <ForumStats stats={stats} t={t} />
      )}

      {/* Contenido principal */}
      <div className="forum-content">
        <Suspense fallback={<LoadingSpinner />}>
          {currentView === 'list' && (
            <>
              <ForumFilters
                filters={filters}
                categories={categories}
                onFilterChange={handleFilterChange}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                t={t}
              />

              <ThreadList
                threads={threads}
                pagination={pagination}
                onViewThread={handleViewThread}
                onVoteThread={handleVoteThread}
                onDeleteThread={handleThreadDeleted}
                onPageChange={handlePageChange}
                currentUser={user}
                loading={loading}
                error={error}
                t={t}
              />
            </>
          )}

          {currentView === 'detail' && selectedThread && (
            <ThreadDetail
              thread={selectedThread}
              onBack={handleBackToList}
              onVoteThread={handleVoteThread}
              onDeleteThread={handleThreadDeleted}
              onCommentCreated={handleCommentCreated}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onVoteComment={handleVoteComment}
              currentUser={user}
              t={t}
            />
          )}

          {currentView === 'create' && (
            <CreateThreadForm
              categories={categories}
              onSubmit={handleThreadCreated}
              onCancel={handleCancelCreate}
              currentUser={user}
              t={t}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default Forum;