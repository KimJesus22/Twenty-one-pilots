const discographyTypeDefs = require('./discography');
const videosTypeDefs = require('./videos');
const storeTypeDefs = require('./store');
const forumTypeDefs = require('./forum');

const { gql } = require('graphql-tag');

// Combinar todos los esquemas
const typeDefs = gql`
  ${discographyTypeDefs}
  ${videosTypeDefs}
  ${storeTypeDefs}
  ${forumTypeDefs}

  # Tipos comunes reutilizados
  type User {
    id: ID!
    username: String!
    avatar: String
    joinDate: String
    postCount: Int
    reputation: Int
  }

  type Pagination {
    page: Int!
    pages: Int!
    total: Int!
    limit: Int!
  }
`;

module.exports = typeDefs;