import React, { useState, useEffect, useRef } from 'react';
import EventReminderManager from './EventReminderManager';
import MusicPlayer from './MusicPlayer';
import MerchStore from './MerchStore';
import './EventSocialHub.css';

const EventSocialHub = ({
  event,
  user,
  userLocation,
  compact = false,
  onAttendanceChange,
  onGroupJoin,
  onPostCreate
}) => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendance, setAttendance] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [posts, setPosts] = useState([]);
  const [music, setMusic] = useState([]);
  const [merch, setMerch] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Estados para formularios
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    maxMembers: 20,
    isPrivate: false,
    meetingPoint: { type: 'venue' },
    transportation: { type: 'mixed' }
  });

  const [postForm, setPostForm] = useState({
    type: 'text',
    title: '',
    content: '',
    rating: 0,
    tags: [],
    media: []
  });

  const [newComment, setNewComment] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (event?._id) {
      loadAttendanceData();
      loadGroups();
      loadPosts();
      loadMusic();
      loadMerch();
    }
  }, [event]);

  // API calls
  const loadAttendanceData = async () => {
    try {
      // Cargar asistencia del usuario
      const attendanceResponse = await fetch(`/api/social/attendance/user/${user?.id}?event=${event._id}`);
      const attendanceData = await attendanceResponse.json();
      if (attendanceData.success) {
        const userAttendance = attendanceData.data.find(a => a.event === event._id);
        setAttendance(userAttendance || null);
      }

      // Cargar estadísticas
      const statsResponse = await fetch(`/api/social/attendance/event/${event._id}/stats`);
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setAttendanceStats(statsData.data);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await fetch(`/api/social/groups/event/${event._id}`);
      const data = await response.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`/api/social/posts/event/${event._id}?limit=20`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadMusic = async () => {
    try {
      const response = await fetch(`/api/musicMerch/music/event/${event._id}?limit=20`);
      const data = await response.json();
      if (data.success) {
        setMusic(data.data);
      }
    } catch (error) {
      console.error('Error loading music:', error);
    }
  };

  const loadMerch = async () => {
    try {
      const response = await fetch(`/api/musicMerch/merch/event/${event._id}?limit=20`);
      const data = await response.json();
      if (data.success) {
        setMerch(data.data);
      }
    } catch (error) {
      console.error('Error loading merch:', error);
    }
  };

  // Manejar asistencia
  const handleAttendanceChange = async (status) => {
    setLoading(true);
    try {
      const response = await fetch('/api/social/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event._id,
          status
        })
      });

      const data = await response.json();
      if (data.success) {
        setAttendance(data.data);
        onAttendanceChange && onAttendanceChange(data.data);
        loadAttendanceData(); // Recargar estadísticas
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar creación de grupo
  const handleCreateGroup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/social/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...groupForm,
          eventId: event._id
        })
      });

      const data = await response.json();
      if (data.success) {
        setGroups(prev => [data.data, ...prev]);
        setShowCreateGroup(false);
        setGroupForm({
          name: '',
          description: '',
          maxMembers: 20,
          isPrivate: false,
          meetingPoint: { type: 'venue' },
          transportation: { type: 'mixed' }
        });
        onGroupJoin && onGroupJoin(data.data);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar unión a grupo
  const handleJoinGroup = async (groupId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.success) {
        loadGroups(); // Recargar grupos
        onGroupJoin && onGroupJoin(data.data);
      }
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar creación de publicación
  const handleCreatePost = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...postForm,
          eventId: event._id
        })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(prev => [data.data, ...prev]);
        setShowCreatePost(false);
        setPostForm({
          type: 'text',
          title: '',
          content: '',
          rating: 0,
          tags: [],
          media: []
        });
        onPostCreate && onPostCreate(data.data);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar reacciones
  const handleReaction = async (postId, reactionType) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reactionType })
      });

      if (response.ok) {
        loadPosts(); // Recargar posts
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Manejar comentarios
  const handleComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        setNewComment('');
        setSelectedPost(null);
        loadPosts(); // Recargar posts
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (compact) {
    return (
      <div className="event-social-compact">
        <div className="social-actions">
          <button
            className={`action-btn attendance ${attendance?.status || 'none'}`}
            onClick={() => setActiveTab('attendance')}
          >
            {attendance?.status === 'going' ? '✅' : attendance?.status === 'interested' ? '🤔' : '🎫'}
          </button>

          <button
            className="action-btn groups"
            onClick={() => setActiveTab('groups')}
          >
            👥 {groups.length}
          </button>

          <button
            className="action-btn posts"
            onClick={() => setActiveTab('posts')}
          >
            📸 {posts.length}
          </button>

          <button
            className="action-btn music"
            onClick={() => setActiveTab('music')}
          >
            🎵 {music.length + merch.length}
          </button>

          <EventReminderManager
            event={event}
            userLocation={userLocation}
            compact={true}
          />
        </div>

        {/* Modal compacto */}
        {activeTab && (
          <div className="social-modal">
            <div className="modal-header">
              <h3>
                {activeTab === 'attendance' && 'Asistencia'}
                {activeTab === 'groups' && 'Grupos'}
                {activeTab === 'posts' && 'Publicaciones'}
                {activeTab === 'music' && 'Música y Merch'}
              </h3>
              <button onClick={() => setActiveTab(null)}>×</button>
            </div>

            <div className="modal-content">
              {activeTab === 'attendance' && (
                <div className="attendance-section">
                  <div className="attendance-buttons">
                    <button
                      className={attendance?.status === 'going' ? 'active' : ''}
                      onClick={() => handleAttendanceChange('going')}
                      disabled={loading}
                    >
                      ✅ Voy a ir
                    </button>
                    <button
                      className={attendance?.status === 'interested' ? 'active' : ''}
                      onClick={() => handleAttendanceChange('interested')}
                      disabled={loading}
                    >
                      🤔 Me interesa
                    </button>
                    <button
                      className={attendance?.status === 'not_going' ? 'active' : ''}
                      onClick={() => handleAttendanceChange('not_going')}
                      disabled={loading}
                    >
                      ❌ No voy
                    </button>
                  </div>

                  {attendanceStats && (
                    <div className="attendance-stats">
                      <div className="stat">
                        <span className="number">{attendanceStats.going.totalAttendees}</span>
                        <span className="label">van a ir</span>
                      </div>
                      <div className="stat">
                        <span className="number">{attendanceStats.interested.totalAttendees}</span>
                        <span className="label">interesados</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="groups-section">
                  <button
                    className="create-btn"
                    onClick={() => setShowCreateGroup(true)}
                  >
                    ➕ Crear grupo
                  </button>

                  <div className="groups-list">
                    {groups.slice(0, 3).map(group => (
                      <div key={group._id} className="group-item">
                        <h4>{group.name}</h4>
                        <p>{group.members.length}/{group.maxMembers} miembros</p>
                        <button
                          onClick={() => handleJoinGroup(group._id)}
                          disabled={loading}
                        >
                          Unirse
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="posts-section">
                  <button
                    className="create-btn"
                    onClick={() => setShowCreatePost(true)}
                  >
                    📝 Crear publicación
                  </button>

                  <div className="posts-list">
                    {posts.slice(0, 3).map(post => (
                      <div key={post._id} className="post-item">
                        <div className="post-header">
                          <span className="author">{post.author.username}</span>
                          <span className="type">{post.type}</span>
                        </div>
                        <p className="content">{post.content}</p>
                        <div className="post-stats">
                          <span>❤️ {post.reactions.length}</span>
                          <span>💬 {post.comments.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'music' && (
                <div className="music-section">
                  <div className="compact-music">
                    <h4>Música ({music.length})</h4>
                    <MusicPlayer
                      music={music.slice(0, 5)}
                      compact={true}
                      showControls={true}
                    />
                  </div>

                  <div className="compact-merch">
                    <h4>Merch ({merch.length})</h4>
                    <MerchStore
                      eventId={event._id}
                      compact={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="event-social-hub">
      <div className="social-header">
        <h2>🌟 Comunidad del Evento</h2>
        <p>Conecta con otros fans, forma grupos y comparte experiencias</p>
      </div>

      <div className="social-tabs">
        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          🎫 Asistencia ({attendanceStats?.going.totalAttendees || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          👥 Grupos ({groups.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📸 Publicaciones ({posts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'music' ? 'active' : ''}`}
          onClick={() => setActiveTab('music')}
        >
          🎵 Música y Merch ({music.length + merch.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          🔔 Recordatorios
        </button>
      </div>

      <div className="social-content">
        {activeTab === 'attendance' && (
          <div className="attendance-section">
            <div className="attendance-actions">
              <h3>¿Vas a asistir?</h3>
              <div className="attendance-buttons">
                <button
                  className={`attendance-btn going ${attendance?.status === 'going' ? 'active' : ''}`}
                  onClick={() => handleAttendanceChange('going')}
                  disabled={loading}
                >
                  ✅ Voy a ir
                </button>
                <button
                  className={`attendance-btn interested ${attendance?.status === 'interested' ? 'active' : ''}`}
                  onClick={() => handleAttendanceChange('interested')}
                  disabled={loading}
                >
                  🤔 Me interesa
                </button>
                <button
                  className={`attendance-btn not-going ${attendance?.status === 'not_going' ? 'active' : ''}`}
                  onClick={() => handleAttendanceChange('not_going')}
                  disabled={loading}
                >
                  ❌ No voy
                </button>
              </div>
            </div>

            {attendanceStats && (
              <div className="attendance-stats">
                <h3>Estadísticas</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{attendanceStats.going.totalAttendees}</div>
                    <div className="stat-label">Van a ir</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{attendanceStats.interested.totalAttendees}</div>
                    <div className="stat-label">Interesados</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{attendanceStats.not_going.totalAttendees}</div>
                    <div className="stat-label">No van</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="groups-section">
            <div className="groups-header">
              <h3>Grupos para ir juntos</h3>
              <button
                className="create-group-btn"
                onClick={() => setShowCreateGroup(true)}
              >
                ➕ Crear Grupo
              </button>
            </div>

            <div className="groups-grid">
              {groups.map(group => (
                <div key={group._id} className="group-card">
                  <div className="group-header">
                    <h4>{group.name}</h4>
                    <span className={`privacy ${group.isPrivate ? 'private' : 'public'}`}>
                      {group.isPrivate ? '🔒' : '🌍'}
                    </span>
                  </div>

                  <p className="group-description">{group.description}</p>

                  <div className="group-stats">
                    <span>👥 {group.members.length}/{group.maxMembers}</span>
                    <span>🚗 {group.transportation.type}</span>
                  </div>

                  <button
                    className="join-group-btn"
                    onClick={() => handleJoinGroup(group._id)}
                    disabled={loading || group.members.some(m => m.user === user?.id)}
                  >
                    {group.members.some(m => m.user === user?.id) ? 'Miembro' : 'Unirse'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="posts-section">
            <div className="posts-header">
              <h3>Publicaciones y Experiencias</h3>
              <button
                className="create-post-btn"
                onClick={() => setShowCreatePost(true)}
              >
                📝 Crear Publicación
              </button>
            </div>

            <div className="posts-feed">
              {posts.map(post => (
                <div key={post._id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <span className="author-name">{post.author.username}</span>
                      <span className="post-type">{post.type}</span>
                    </div>
                    <span className="post-date">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {post.title && <h4 className="post-title">{post.title}</h4>}

                  <div className="post-content">
                    {post.content && <p>{post.content}</p>}

                    {post.media && post.media.length > 0 && (
                      <div className="post-media">
                        {post.media.map((media, index) => (
                          <img key={index} src={media.url} alt={media.caption || ''} />
                        ))}
                      </div>
                    )}

                    {post.rating > 0 && (
                      <div className="post-rating">
                        {'⭐'.repeat(post.rating)}
                      </div>
                    )}
                  </div>

                  <div className="post-actions">
                    <div className="reactions">
                      {['like', 'love', 'laugh', 'wow', 'sad', 'angry'].map(reaction => (
                        <button
                          key={reaction}
                          className={`reaction-btn ${post.reactions.some(r => r.type === reaction) ? 'active' : ''}`}
                          onClick={() => handleReaction(post._id, reaction)}
                        >
                          {reaction === 'like' ? '👍' :
                           reaction === 'love' ? '❤️' :
                           reaction === 'laugh' ? '😂' :
                           reaction === 'wow' ? '😮' :
                           reaction === 'sad' ? '😢' : '😠'}
                        </button>
                      ))}
                    </div>

                    <button
                      className="comment-btn"
                      onClick={() => setSelectedPost(selectedPost === post._id ? null : post._id)}
                    >
                      💬 {post.comments.length}
                    </button>
                  </div>

                  {selectedPost === post._id && (
                    <div className="comments-section">
                      <div className="comments-list">
                        {post.comments.map((comment, index) => (
                          <div key={index} className="comment">
                            <span className="comment-author">{comment.author.username}:</span>
                            <span className="comment-content">{comment.content}</span>
                          </div>
                        ))}
                      </div>

                      <div className="add-comment">
                        <input
                          type="text"
                          placeholder="Escribe un comentario..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                        />
                        <button onClick={() => handleComment(post._id)}>Enviar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'music' && (
          <div className="music-merch-section">
            <div className="section-header">
              <h3>🎵 Música y Merchandising Exclusivo</h3>
              <p>Descubre la música del evento y productos oficiales exclusivos</p>
            </div>

            {/* Music Player */}
            <div className="music-section">
              <h4>Música del Evento</h4>
              <MusicPlayer
                music={music}
                autoPlay={false}
                showControls={true}
                compact={false}
                onPlay={(track) => console.log('Playing:', track)}
                onPause={(track) => console.log('Paused:', track)}
                onTrackChange={(track) => console.log('Track changed:', track)}
              />
            </div>

            {/* Merch Store */}
            <div className="merch-section">
              <h4>Merchandising Exclusivo</h4>
              <MerchStore
                eventId={event._id}
                compact={false}
                onPurchase={(item) => console.log('Purchase:', item)}
                onAddToWishlist={(itemId) => console.log('Added to wishlist:', itemId)}
                onViewDetails={(item) => console.log('View details:', item)}
              />
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <EventReminderManager
            event={event}
            userLocation={userLocation}
            onReminderCreated={(reminder) => console.log('Reminder created:', reminder)}
            onCalendarExported={(exportData) => console.log('Calendar exported:', exportData)}
          />
        )}
      </div>

      {/* Modal para crear grupo */}
      {showCreateGroup && (
        <div className="modal-overlay" onClick={() => setShowCreateGroup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Grupo</h3>
              <button onClick={() => setShowCreateGroup(false)}>×</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }}>
              <div className="form-group">
                <label>Nombre del grupo</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Máximo de miembros</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={groupForm.maxMembers}
                  onChange={(e) => setGroupForm({...groupForm, maxMembers: parseInt(e.target.value)})}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={groupForm.isPrivate}
                    onChange={(e) => setGroupForm({...groupForm, isPrivate: e.target.checked})}
                  />
                  Grupo privado
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateGroup(false)}>Cancelar</button>
                <button type="submit" disabled={loading}>Crear Grupo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear publicación */}
      {showCreatePost && (
        <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Publicación</h3>
              <button onClick={() => setShowCreatePost(false)}>×</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreatePost(); }}>
              <div className="form-group">
                <label>Tipo de publicación</label>
                <select
                  value={postForm.type}
                  onChange={(e) => setPostForm({...postForm, type: e.target.value})}
                >
                  <option value="text">Texto</option>
                  <option value="image">Imagen</option>
                  <option value="video">Video</option>
                  <option value="review">Reseña</option>
                </select>
              </div>

              <div className="form-group">
                <label>Título (opcional)</label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Contenido</label>
                <textarea
                  value={postForm.content}
                  onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              {postForm.type === 'review' && (
                <div className="form-group">
                  <label>Calificación</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star ${postForm.rating >= star ? 'active' : ''}`}
                        onClick={() => setPostForm({...postForm, rating: star})}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreatePost(false)}>Cancelar</button>
                <button type="submit" disabled={loading}>Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSocialHub;