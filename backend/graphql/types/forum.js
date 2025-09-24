const { gql } = require('graphql-tag');

const forumTypeDefs = gql`
  # Tipos básicos para forum
  type VoteCount {
    likes: Int!
    dislikes: Int!
  }

  type Vote {
    id: ID!
    user: User!
    type: String!
    createdAt: String!
  }

  # Tipo principal de Comment optimizado
  type Comment {
    id: ID!
    content: String!
    author: User!
    thread: Thread!
    parentComment: Comment
    replies: [Comment!]!
    mentions: [User!]!
    tags: [String!]!
    votes: [Vote!]!
    voteCount: VoteCount!
    isEdited: Boolean!
    editedAt: String
    createdAt: String!
    updatedAt: String!
  }

  # Tipo principal de Thread optimizado
  type Thread {
    id: ID!
    title: String!
    content: String!
    author: User!
    category: String!
    tags: [String!]!
    mentions: [User!]!
    votes: [Vote!]!
    voteCount: VoteCount!
    viewCount: Int!
    commentCount: Int!
    comments: [Comment!]!
    isPinned: Boolean!
    isLocked: Boolean!
    isEdited: Boolean!
    editedAt: String
    lastActivity: String!
    createdAt: String!
    updatedAt: String!
  }

  # Tipos ligeros para listas (reduce overfetching)
  type ThreadListItem {
    id: ID!
    title: String!
    author: User!
    category: String!
    tags: [String!]!
    voteCount: VoteCount!
    viewCount: Int!
    commentCount: Int!
    isPinned: Boolean!
    lastActivity: String!
    createdAt: String!
  }

  type CommentListItem {
    id: ID!
    content: String!
    author: User!
    parentComment: Comment
    voteCount: VoteCount!
    isEdited: Boolean!
    createdAt: String!
  }

  # Tipos de input para filtros
  input ThreadFilters {
    page: Int
    limit: Int
    sort: String
    order: String
    search: String
    category: String
    author: ID
    tags: [String]
    isPinned: Boolean
    minViews: Int
    maxViews: Int
    createdAfter: String
    createdBefore: String
  }

  input CommentFilters {
    page: Int
    limit: Int
    sort: String
    order: String
    threadId: ID
    author: ID
    parentCommentId: ID
    createdAfter: String
    createdBefore: String
  }

  # Queries optimizadas para Forum
  type Query {
    # Query principal para lista de threads
    threads(filters: ThreadFilters): ThreadsResponse!

    # Query para thread individual con comments
    thread(id: ID!): Thread

    # Query optimizada para lista de threads (sin contenido pesado)
    threadsList(filters: ThreadFilters): ThreadsListResponse!

    # Query para comments de un thread
    threadComments(threadId: ID!, filters: CommentFilters): CommentsResponse!

    # Query para threads populares
    popularThreads(limit: Int): [Thread!]!

    # Query para threads recientes
    recentThreads(limit: Int): [Thread!]!

    # Query para threads por categoría
    threadsByCategory(category: String!, limit: Int): [Thread!]!

    # Query para threads por usuario
    userThreads(userId: ID!, limit: Int): [Thread!]!

    # Estadísticas del forum
    forumStats: ForumStats!
  }

  # Respuestas optimizadas
  type ThreadsResponse {
    threads: [Thread!]!
    pagination: Pagination!
  }

  type ThreadsListResponse {
    threads: [ThreadListItem!]!
    pagination: Pagination!
  }

  type CommentsResponse {
    comments: [Comment!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    pages: Int!
    total: Int!
    limit: Int!
  }

  type ForumStats {
    totalThreads: Int!
    totalComments: Int!
    totalUsers: Int!
    threadsToday: Int!
    commentsToday: Int!
    categoryDistribution: [CategoryCount!]!
    topContributors: [UserStats!]!
  }

  type CategoryCount {
    category: String!
    count: Int!
  }

  type UserStats {
    user: User!
    threadCount: Int!
    commentCount: Int!
  }

  # Mutations para interacciones del forum
  type Mutation {
    # Crear thread
    createThread(title: String!, content: String!, category: String!, tags: [String!]): ThreadResponse!

    # Actualizar thread
    updateThread(id: ID!, title: String, content: String, tags: [String!]): ThreadResponse!

    # Eliminar thread
    deleteThread(id: ID!): DeleteResponse!

    # Crear comentario
    createComment(threadId: ID!, content: String!, parentCommentId: ID): CommentResponse!

    # Actualizar comentario
    updateComment(id: ID!, content: String!): CommentResponse!

    # Eliminar comentario
    deleteComment(id: ID!): DeleteResponse!

    # Votar en thread/comentario
    vote(targetId: ID!, targetType: String!, voteType: String!): VoteResponse!

    # Reportar contenido
    reportContent(contentId: ID!, contentType: String!, reason: String!): ReportResponse!
  }

  type ThreadResponse {
    success: Boolean!
    message: String
    thread: Thread
  }

  type CommentResponse {
    success: Boolean!
    message: String
    comment: Comment
  }

  type VoteResponse {
    success: Boolean!
    message: String
    voteCount: VoteCount
  }

  type ReportResponse {
    success: Boolean!
    message: String
  }

  type DeleteResponse {
    success: Boolean!
    message: String
  }

  # Tipos relacionados
  type User {
    id: ID!
    username: String!
    avatar: String
    joinDate: String!
    postCount: Int!
    reputation: Int!
  }
`;

module.exports = forumTypeDefs;