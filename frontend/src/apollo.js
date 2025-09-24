import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// HTTP link para GraphQL
const httpLink = createHttpLink({
  uri: process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:5000/graphql',
});

// Link de autenticación
const authLink = setContext((_, { headers }) => {
  // Obtener token del localStorage o contexto de autenticación
  const token = localStorage.getItem('token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Configurar Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Configuración de caché para queries paginadas
          albums: {
            keyArgs: ['filters'],
            merge(existing = { albums: [], pagination: {} }, incoming) {
              return {
                ...incoming,
                albums: [...existing.albums, ...incoming.albums],
              };
            },
          },
          videos: {
            keyArgs: ['filters'],
            merge(existing = { videos: [], pagination: {} }, incoming) {
              return {
                ...incoming,
                videos: [...existing.videos, ...incoming.videos],
              };
            },
          },
          threads: {
            keyArgs: ['filters'],
            merge(existing = { threads: [], pagination: {} }, incoming) {
              return {
                ...incoming,
                threads: [...existing.threads, ...incoming.threads],
              };
            },
          },
        },
      },
      // Políticas de tipo para actualizar cache automáticamente
      Album: {
        fields: {
          rating: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          ratingCount: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Thread: {
        fields: {
          commentCount: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;