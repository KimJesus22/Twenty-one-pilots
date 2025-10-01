console.log('Loading graphql-schema.js...');
const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLID } = require('graphql');

// Tipos simples
const AlbumType = new GraphQLObjectType({
  name: 'Album',
  fields: {
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    releaseYear: { type: GraphQLInt }
  }
});

// Root Query Type
const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    albums: {
      type: new GraphQLList(AlbumType),
      resolve: () => {
        // Datos de ejemplo
        return [
          { id: '1', title: 'Blurryface', releaseYear: 2015 },
          { id: '2', title: 'Trench', releaseYear: 2018 }
        ];
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