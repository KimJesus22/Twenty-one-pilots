import React, { useEffect, useState } from 'react';
import './Forum.css';

const Forum = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
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
      // Simular datos por ahora - en producción vendría de la API
      const mockPosts = [
        {
          id: 1,
          title: "Mi experiencia en el concierto de México",
          content: "Fue increíble ver a Twenty One Pilots en vivo...",
          author: "fan_mexico",
          category: "conciertos",
          replies: 12,
          createdAt: "2024-01-15T10:30:00Z",
          lastReply: "2024-01-16T14:20:00Z"
        },
        {
          id: 2,
          title: "¿Cuál es su canción favorita?",
          content: "Para mí es Heathens, ¿y para ustedes?",
          author: "music_lover",
          category: "general",
          replies: 8,
          createdAt: "2024-01-14T16:45:00Z",
          lastReply: "2024-01-15T09:15:00Z"
        },
        {
          id: 3,
          title: "Teoría sobre el significado de Blurryface",
          content: "He estado pensando mucho sobre el concepto...",
          author: "deep_thinker",
          category: "teorias",
          replies: 25,
          createdAt: "2024-01-13T20:10:00Z",
          lastReply: "2024-01-16T11:30:00Z"
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

    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      // Simular creación de post - en producción iría a la API
      const newPostData = {
        id: Date.now(),
        ...newPost,
        author: 'usuario_actual', // En producción vendría del contexto de autenticación
        replies: 0,
        createdAt: new Date().toISOString(),
        lastReply: new Date().toISOString()
      };

      setPosts(prevPosts => [newPostData, ...prevPosts]);
      setNewPost({ title: '', content: '', category: 'general' });
      setShowCreateForm(false);

      alert('¡Hilo creado exitosamente!');
    } catch (err) {
      console.error('Error creando post:', err);
      alert('Error al crear el hilo. Inténtalo de nuevo.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: '#ff0000',
      conciertos: '#28a745',
      teorias: '#007bff',
      musica: '#6f42c1',
      merch: '#fd7e14'
    };
    return colors[category] || '#6c757d';
  };

  const getCategoryName = (category) => {
    const names = {
      general: 'General',
      conciertos: 'Conciertos',
      teorias: 'Teorías',
      musica: 'Música',
      merch: 'Merchandise'
    };
    return names[category] || 'General';
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
          className="btn btn-primary btn-large create-thread-btn"
          onClick={() => setShowCreateForm(true)}
        >
          ✏️ Crear Nuevo Hilo
        </button>
      </div>

      {showCreateForm && (
        <div className="create-post-modal">
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Crear Nuevo Hilo</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="create-post-form">
              <div className="form-group">
                <label htmlFor="title">Título del Hilo</label>
                <input
                  type="text"
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  placeholder="Escribe un título atractivo..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoría</label>
                <select
                  id="category"
                  value={newPost.category}
                  onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                >
                  <option value="general">General</option>
                  <option value="conciertos">Conciertos</option>
                  <option value="teorias">Teorías</option>
                  <option value="musica">Música</option>
                  <option value="merch">Merchandise</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="content">Contenido</label>
                <textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="Comparte tus pensamientos, experiencias o preguntas..."
                  rows="6"
                  required
                ></textarea>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Publicar Hilo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="forum-stats">
        <div className="stat-item">
          <span className="stat-number">{posts.length}</span>
          <span className="stat-label">Hilos Activos</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{posts.reduce((sum, post) => sum + post.replies, 0)}</span>
          <span className="stat-label">Respuestas Totales</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">24</span>
          <span className="stat-label">Miembros Activos</span>
        </div>
      </div>

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">
            <h3>No hay hilos todavía</h3>
            <p>¡Sé el primero en crear un hilo!</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Crear Primer Hilo
            </button>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-category">
                  <span
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(post.category) }}
                  >
                    {getCategoryName(post.category)}
                  </span>
                </div>
                <h3 className="post-title">{post.title}</h3>
                <div className="post-meta">
                  <span className="post-author">👤 {post.author}</span>
                  <span className="post-date">📅 {formatDate(post.createdAt)}</span>
                </div>
              </div>

              <div className="post-content">
                <p>{post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}</p>
              </div>

              <div className="post-footer">
                <div className="post-stats">
                  <span className="replies-count">💬 {post.replies} respuestas</span>
                  <span className="last-reply">
                    Última respuesta: {formatDate(post.lastReply)}
                  </span>
                </div>
                <button className="btn btn-secondary btn-small">
                  Ver Hilo Completo
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Forum;