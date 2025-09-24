// Re-export de todos los tipos
export * from './graphql';
export * from './components';

// Tipos adicionales para la aplicación
export interface AppConfig {
  apiUrl: string;
  graphqlUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  features: {
    graphql: boolean;
    pwa: boolean;
    analytics: boolean;
    notifications: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
  };
  profile: {
    bio?: string;
    location?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      youtube?: string;
      spotify?: string;
    };
  };
  stats: {
    albumsRated: number;
    videosWatched: number;
    commentsPosted: number;
    joinDate: string;
    lastActive: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
  variant?: string;
  addedAt: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
}

// Tipos para localStorage
export interface LocalStorageData {
  theme: 'light' | 'dark';
  language: string;
  authToken?: string;
  userPreferences: Record<string, any>;
  cartItems: CartItem[];
  favoriteAlbums: string[];
  favoriteVideos: string[];
  favoritePlaylists: string[];
  recentlyViewed: Array<{
    id: string;
    type: 'album' | 'video' | 'playlist';
    viewedAt: string;
  }>;
}

// Tipos para errores
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

// Tipos para eventos
export interface AppEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  userId?: string;
}

export type AppEventType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'ALBUM_RATED'
  | 'VIDEO_WATCHED'
  | 'COMMENT_ADDED'
  | 'PRODUCT_ADDED_TO_CART'
  | 'SEARCH_PERFORMED'
  | 'PAGE_VIEWED';

// Tipos para métricas y analytics
export interface PageViewEvent {
  page: string;
  referrer?: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface SearchEvent {
  query: string;
  filters: Record<string, any>;
  resultsCount: number;
  timestamp: number;
  userId?: string;
}

export interface InteractionEvent {
  type: 'click' | 'hover' | 'scroll' | 'form_submit';
  element: string;
  page: string;
  data?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

// Tipos para Web Workers (si se usan en el futuro)
export interface WorkerMessage<T = any> {
  type: string;
  payload: T;
  id?: string;
}

export interface WorkerResponse<T = any> extends WorkerMessage<T> {
  success: boolean;
  error?: string;
}

// Tipos para Service Workers
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Tipos para testing
export interface TestUser extends Partial<User> {
  id: string;
  username: string;
  email: string;
}

export interface TestData {
  users: TestUser[];
  albums: import('./graphql').Album[];
  videos: import('./graphql').Video[];
  products: import('./graphql').Product[];
  threads: import('./graphql').Thread[];
}

// Utilidades de tipos
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];

export type ValueOf<T> = T[keyof T];

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
