import React, { useEffect, useState } from 'react';
import './Forum.css';

const Forum = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Simular datos por ahora
      const mockPosts = [
        {
          _id: '1',
          title: '¿Cuál es tu canción favorita de Twenty One Pilots?',
          content: 'Me gustaría saber cuál es la canción que más les gusta de la banda. La mía es "Stressed Out".',
          category: 'general',
          author: { username: 'fan123' },
          createdAt: new Date().toISOString(),
          replies: 5,
          lastReply: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Nuevo álbum - ¿Qué opinan?',
          content: 'Acabo de escuchar el nuevo álbum y me parece increíble. ¿Qué les parece a ustedes?',
          category: 'music',
          author: { username: 'musiclover' },
          createdAt: new Date().toISOString(),
          replies: 12,
          lastReply: new Date().toISOString()
        }
      ];
      setPosts(mockPosts);
      setError(null);
    } catch (err) {
      console.error('Error cargando posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      // Aquí iría la llamada al backend
      const newPostData = {
        ...newPost,
        _id: Date.now().toString(),
        author: { username: 'fan123' },
        createdAt: new Date().toISOString(),
        replies: 0,
        lastReply: new Date().toISOString()
      };

      setPosts(prev => [newPostData, ...prev]);
      setNewPost({ title: '', content: '', category: 'general' });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creando post:', err);
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryBadge = (category) => {
    const categories = {
      general: { text: 'General', color: '#ff0000' },
      music: { text: 'Música', color: '#ff6600' },
      concerts: { text: 'Conciertos', color: '#ffcc00' },
      merch: { text: 'Merchandise', color: '#66ff00' }
    };
    return categories[category] || categories.general;
  };

  if (loading) {
    return (
      <div className="forum">
        <div className="loading">Cargando foro...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forum">
        <div className="error">
          <h2>Error al cargar el foro</h2>
          <p>{error}</p>
          <button onClick={fetchPosts} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forum">
      <div className="forum-header">
        <div className="forum-title">
          <h1>Foro de Fans</h1>
          <p>Conecta con otros fans de Twenty One Pilots</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary create-thread-btn"
        >
          Nuevo Post
        </button>
      </div>

      <div className="forum-stats">
        <div className="stat-item">
          <div className="stat-number">{posts.length}</div>
          <div className="stat-label">Posts</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">
            {posts.reduce((total, post) => total + post.replies, 0)}
          </div>
          <div className="stat-label">Respuestas</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">
            {new Set(posts.map(p => p.author.username)).size}
          </div>
          <div className="stat-label">Miembros</div>
        </div>
      </div>

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">
            <h3>No hay posts aún</h3>
            <p>Sé el primero en crear un post en el foro.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Crear Primer Post
            </button>
          </div>
        ) : (
          posts.map(post => {
            const categoryInfo = getCategoryBadge(post.category);
            return (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <div className="post-category">
                    <span
                      className="category-badge"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.text}
                    </span>
                  </div>
                </div>

                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-text">{post.content}</p>
                </div>

                <div className="post-meta">
                  <span className="post-author">Por: {post.author.username}</span>
                  <span className="post-date">{formatDate(post.createdAt)}</span>
                </div>

                <div className="post-footer">
                  <div className="post-stats">
                    <span className="replies-count">{post.replies} respuestas</span>
                    <span className="last-reply">
                      Última respuesta: {formatDate(post.lastReply)}
                    </span>
                  </div>
                  <button className="btn btn-secondary">Ver Post</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <div className="create-post-modal">
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Crear Nuevo Post</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="create-post-form">
              <div className="form-group">
                <label htmlFor="title">Título</label>
                <input
                  type="text"
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Escribe un título descriptivo..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoría</label>
                <select
                  id="category"
                  value={newPost.category}
                  onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="general">General</option>
                  <option value="music">Música</option>
                  <option value="concerts">Conciertos</option>
                  <option value="merch">Merchandise</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="content">Contenido</label>
                <textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  required
                  placeholder="Escribe tu mensaje..."
                  rows="6"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Publicar Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;