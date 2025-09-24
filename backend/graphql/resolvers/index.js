const discographyResolvers = require('./discography');
const videosResolvers = require('./videos');
const storeResolvers = require('./store');
const forumResolvers = require('./forum');

// Combinar todos los resolvers
const resolvers = {
  Query: {
    ...discographyResolvers.Query,
    ...videosResolvers.Query,
    ...storeResolvers.Query,
    ...forumResolvers.Query
  },
  Mutation: {
    ...discographyResolvers.Mutation,
    ...videosResolvers.Mutation,
    ...storeResolvers.Mutation,
    ...forumResolvers.Mutation
  },
  // Resolvers para tipos relacionados
  ...discographyResolvers,
  ...videosResolvers,
  ...storeResolvers,
  ...forumResolvers
};

module.exports = resolvers;