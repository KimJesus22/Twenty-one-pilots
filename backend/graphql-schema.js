console.log('Loading graphql-schema.js...');
const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLID, GraphQLFloat, GraphQLBoolean, GraphQLInputObjectType } = require('graphql');

// Tipos simples
const AlbumType = new GraphQLObjectType({
  name: 'Album',
  fields: {
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    releaseYear: { type: GraphQLInt },
    coverImage: { type: GraphQLString },
    artist: { type: GraphQLString },
    genre: { type: GraphQLString },
    type: { type: GraphQLString },
    rating: { type: GraphQLFloat },
    ratingCount: { type: GraphQLInt },
    commentCount: { type: GraphQLInt },
    views: { type: GraphQLInt },
    likes: { type: GraphQLInt },
    isAvailable: { type: GraphQLBoolean }
  }
});

const PaginationType = new GraphQLObjectType({
  name: 'Pagination',
  fields: {
    page: { type: GraphQLInt },
    pages: { type: GraphQLInt },
    total: { type: GraphQLInt },
    limit: { type: GraphQLInt }
  }
});

const AlbumFiltersType = new GraphQLInputObjectType({
  name: 'AlbumFilters',
  fields: {
    page: { type: GraphQLInt },
    limit: { type: GraphQLInt },
    sort: { type: GraphQLString },
    order: { type: GraphQLString },
    search: { type: GraphQLString },
    genre: { type: GraphQLString },
    type: { type: GraphQLString },
    minYear: { type: GraphQLInt },
    maxYear: { type: GraphQLInt },
    minPopularity: { type: GraphQLInt },
    maxPopularity: { type: GraphQLInt },
    artist: { type: GraphQLString }
  }
});

const AlbumsResponseType = new GraphQLObjectType({
  name: 'AlbumsResponse',
  fields: {
    albums: { type: new GraphQLList(AlbumType) },
    pagination: { type: PaginationType }
  }
});

// Root Query Type
const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    albums: {
      type: AlbumsResponseType,
      args: {
        filters: { type: AlbumFiltersType }
      },
      resolve: async (_parent, args) => {
        const discographyResolvers = require('./graphql/resolvers/discography');
        return await discographyResolvers.Query.albums(_parent, args);
      }
    },
    album: {
      type: AlbumType,
      args: { id: { type: GraphQLID } },
      resolve: async (_parent, args) => {
        const discographyResolvers = require('./graphql/resolvers/discography');
        return await discographyResolvers.Query.album(_parent, args);
      }
    }
  }
});

// Crear el esquema
const schema = new GraphQLSchema({
  query: RootQueryType
});

console.log('Schema created successfully');
module.exports = schema;
