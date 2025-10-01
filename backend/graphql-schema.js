console.log('Loading graphql-schema.js...');
const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLID, GraphQLFloat, GraphQLBoolean } = require('graphql');

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

const { GraphQLInputObjectType } = require('graphql');

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
      resolve: () => {
        console.log('Resolving albums query');
        const result = {
          albums: [
            { id: '1', title: 'Blurryface', releaseYear: 2015, coverImage: null, artist: 'Twenty One Pilots', genre: 'alternative', type: 'album', rating: 4.5, ratingCount: 100, commentCount: 50, views: 1000, likes: 500, isAvailable: true },
            { id: '2', title: 'Trench', releaseYear: 2018, coverImage: null, artist: 'Twenty One Pilots', genre: 'alternative', type: 'album', rating: 4.7, ratingCount: 150, commentCount: 75, views: 1500, likes: 750, isAvailable: true }
          ],
          pagination: {
            page: 1,
            pages: 1,
            total: 2,
            limit: 12
          }
        };
        console.log('Albums resolve result:', JSON.stringify(result, null, 2));
        return result;
      }
    },
    album: {
      type: AlbumType,
      args: { id: { type: GraphQLID } },
      resolve: (parent, args) => {
        // Datos de ejemplo
        return { id: args.id, title: 'Blurryface', releaseYear: 2015 };
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