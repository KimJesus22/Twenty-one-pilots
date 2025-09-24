// Tipos base para GraphQL
export interface Pagination {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
  joinDate?: string;
  postCount?: number;
  reputation?: number;
}

// Tipos para Discography
export interface AlbumFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  search?: string;
  genre?: string;
  type?: string;
  minYear?: string;
  maxYear?: string;
  minPopularity?: string;
  maxPopularity?: string;
  artist?: string;
}

export interface Song {
  id: string;
  title: string;
  duration: string;
  trackNumber: number;
  spotifyId?: string;
  youtubeId?: string;
  previewUrl?: string;
  popularity: number;
  playCount: number;
  likes: string[];
  album?: Album;
}

export interface Album {
  id: string;
  title: string;
  releaseYear: number;
  coverImage?: string;
  artist: string;
  genre: string;
  type: string;
  totalDuration?: string;
  spotifyId?: string;
  youtubeId?: string;
  popularity?: number;
  views: number;
  likes: string[];
  rating: number;
  ratingCount: number;
  ratingDistribution?: { [key: string]: number };
  commentCount: number;
  avgCommentRating?: number;
  featuredComments?: any[];
  externalLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    youtubeMusic?: string;
    genius?: string;
  };
  credits?: {
    executiveProducer?: string;
    producers?: string[];
    engineers?: string[];
    mixingEngineers?: string[];
    masteringEngineers?: string[];
    artworkBy?: string;
    photographyBy?: string;
  };
  songs?: Song[];
  createdAt: string;
  updatedAt: string;
}

export interface AlbumsResponse {
  albums: Album[];
  pagination: Pagination;
}

export interface AlbumStats {
  totalAlbums: number;
  totalSongs: number;
  avgRating: number;
  totalViews: number;
  totalLikes: number;
  genreDistribution: Array<{
    genre: string;
    count: number;
  }>;
}

export interface RateAlbumResponse {
  success: boolean;
  message: string;
  album: Album;
}

export interface AddAlbumCommentResponse {
  success: boolean;
  message: string;
  comment: {
    id: string;
    content: string;
    title?: string;
    author: User;
    rating: number;
    pros?: string[];
    cons?: string[];
    recommendation: boolean;
    likes: string[];
    createdAt: string;
  };
}

// Tipos para Videos
export interface VideoFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  search?: string;
  genre?: string;
  artist?: string;
  year?: number;
  type?: string;
  channelId?: string;
  minViews?: number;
  maxViews?: number;
  publishedAfter?: string;
  publishedBefore?: string;
  isVerified?: boolean;
  minQualityScore?: number;
}

export interface VideoStatistics {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

export interface VideoListItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  statistics: VideoStatistics;
  type: string;
  isVerified: boolean;
}

export interface Video {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  channelId: string;
  channelTitle: string;
  url: string;
  embedUrl: string;
  thumbnail: string;
  publishedAt: string;
  statistics: VideoStatistics;
  duration: string;
  durationSeconds: number;
  tags: string[];
  categoryId: string;
  genre?: string;
  artist?: string;
  year?: number;
  type: string;
  privacyStatus: string;
  isAvailable: boolean;
  associatedSongs?: Song[];
  associatedAlbums?: Album[];
  isVerified: boolean;
  qualityScore: number;
  createdBy?: User;
  lastAccessed?: string;
  accessCount: number;
  createdAt: string;
}

export interface VideosResponse {
  videos: Video[];
  pagination: Pagination;
}

export interface VideosListResponse {
  videos: VideoListItem[];
  pagination: Pagination;
}

export interface VideoStats {
  totalVideos: number;
  totalViews: number;
  avgQualityScore: number;
  verifiedVideos: number;
  genreDistribution: Array<{
    genre: string;
    count: number;
  }>;
  typeDistribution: Array<{
    type: string;
    count: number;
  }>;
}

// Tipos para Store
export interface ProductFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  search?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  tags?: string[];
  rating?: number;
}

export interface ProductVariant {
  name: string;
  values: string[];
}

export interface ProductInventory {
  variantCombination?: string;
  sku?: string;
  stock: number;
  price?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

export interface DownloadableFile {
  name: string;
  url: string;
  fileType: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  image?: string;
  category: string;
  subcategory?: string;
  brand: string;
  sku?: string;
  barcode?: string;
  variants: ProductVariant[];
  inventory: ProductInventory[];
  stock: number;
  isAvailable: boolean;
  isDigital: boolean;
  downloadableFiles: DownloadableFile[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  shippingClass?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  featured: boolean;
  onSale: boolean;
  saleStart?: string;
  saleEnd?: string;
  views: number;
  purchases: number;
  rating: number;
  reviewCount: number;
  likes: string[];
  relatedProducts: Product[];
  relatedEvents?: any[];
  relatedAlbums?: Album[];
  careInstructions?: string;
  materials: string[];
  warranty?: string;
  returnPolicy?: string;
  createdBy?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  onSale: boolean;
  featured: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export interface ProductsListResponse {
  products: ProductListItem[];
  pagination: Pagination;
}

export interface ProductStats {
  totalProducts: number;
  totalCategories: number;
  avgPrice: number;
  totalSales: number;
  featuredProducts: number;
  outOfStock: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
}

// Tipos para Forum
export interface ThreadFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  search?: string;
  category?: string;
  author?: string;
  tags?: string[];
  isPinned?: boolean;
  minViews?: number;
  maxViews?: number;
  createdAfter?: string;
  createdBefore?: string;
}

export interface CommentFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  threadId?: string;
  author?: string;
  parentCommentId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface VoteCount {
  likes: number;
  dislikes: number;
}

export interface Vote {
  id: string;
  user: User;
  type: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  thread: Thread;
  parentComment?: Comment;
  replies: Comment[];
  mentions: User[];
  tags: string[];
  votes: Vote[];
  voteCount: VoteCount;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  author: User;
  category: string;
  tags: string[];
  mentions: User[];
  votes: Vote[];
  voteCount: VoteCount;
  viewCount: number;
  commentCount: number;
  comments: Comment[];
  isPinned: boolean;
  isLocked: boolean;
  isEdited: boolean;
  editedAt?: string;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadListItem {
  id: string;
  title: string;
  author: User;
  category: string;
  tags: string[];
  voteCount: VoteCount;
  viewCount: number;
  commentCount: number;
  isPinned: boolean;
  lastActivity: string;
  createdAt: string;
}

export interface ThreadsResponse {
  threads: Thread[];
  pagination: Pagination;
}

export interface ThreadsListResponse {
  threads: ThreadListItem[];
  pagination: Pagination;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: Pagination;
}

export interface ForumStats {
  totalThreads: number;
  totalComments: number;
  totalUsers: number;
  threadsToday: number;
  commentsToday: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
  topContributors: Array<{
    user: User;
    threadCount: number;
    commentCount: number;
  }>;
}

// Tipos de respuesta genéricos
export interface GenericResponse {
  success: boolean;
  message: string;
}

export interface DeleteResponse extends GenericResponse {}

export interface VoteResponse extends GenericResponse {
  voteCount: VoteCount;
}

export interface ReportResponse extends GenericResponse {}

// Tipos para Apollo Client
export interface ApolloQueryResult<T> {
  data?: T;
  loading: boolean;
  error?: any;
  refetch?: () => void;
}

export interface ApolloMutationResult<T> {
  data?: T;
  loading: boolean;
  error?: any;
}