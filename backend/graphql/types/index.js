let discographyTypeDefs, videosTypeDefs, storeTypeDefs, forumTypeDefs;

try {
  discographyTypeDefs = require('./discography');
  console.log('discographyTypeDefs loaded');
} catch (error) {
  console.error('Error loading discographyTypeDefs:', error.message);
  discographyTypeDefs = '';
}

try {
  videosTypeDefs = require('./videos');
  console.log('videosTypeDefs loaded');
} catch (error) {
  console.error('Error loading videosTypeDefs:', error.message);
  videosTypeDefs = '';
}

try {
  storeTypeDefs = require('./store');
  console.log('storeTypeDefs loaded');
} catch (error) {
  console.error('Error loading storeTypeDefs:', error.message);
  storeTypeDefs = '';
}

try {
  forumTypeDefs = require('./forum');
  console.log('forumTypeDefs loaded');
} catch (error) {
  console.error('Error loading forumTypeDefs:', error.message);
  forumTypeDefs = '';
}

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