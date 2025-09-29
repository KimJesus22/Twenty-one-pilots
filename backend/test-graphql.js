console.log('Testing GraphQL module loading...');

try {
  const typeDefs = require('./graphql/types');
  console.log('✅ typeDefs loaded successfully');
  console.log('typeDefs type:', typeof typeDefs);
} catch (error) {
  console.error('❌ Error loading typeDefs:', error.message);
  console.error('Stack:', error.stack);
}

try {
  const resolvers = require('./graphql/resolvers');
  console.log('✅ resolvers loaded successfully');
  console.log('resolvers type:', typeof resolvers);
} catch (error) {
  console.error('❌ Error loading resolvers:', error.message);
  console.error('Stack:', error.stack);
}

try {
  const { ApolloServer } = require('@apollo/server');
  console.log('✅ ApolloServer loaded successfully');
} catch (error) {
  console.error('❌ Error loading ApolloServer:', error.message);
}

try {
  const expressMiddleware = require('@apollo/server/express4').expressMiddleware;
  console.log('✅ expressMiddleware loaded successfully');
} catch (error) {
  console.error('❌ Error loading expressMiddleware:', error.message);
}

console.log('Test completed.');