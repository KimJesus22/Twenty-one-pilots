const { gql } = require('graphql-tag');

const storeTypeDefs = gql`
  # Tipos básicos para productos
  type ProductVariant {
    name: String!
    values: [String!]!
  }

  type ProductInventory {
    variantCombination: String
    sku: String
    stock: Int!
    price: Float
    weight: Float
    dimensions: Dimensions
  }

  type Dimensions {
    length: Float
    width: Float
    height: Float
  }

  type DownloadableFile {
    name: String!
    url: String!
    fileType: String!
  }

  # Tipo principal de Product optimizado
  type Product {
    id: ID!
    name: String!
    description: String!
    shortDescription: String
    price: Float!
    compareAtPrice: Float
    images: [String!]!
    image: String
    category: String!
    subcategory: String
    brand: String!
    sku: String
    barcode: String
    variants: [ProductVariant!]!
    inventory: [ProductInventory!]!
    stock: Int!
    isAvailable: Boolean!
    isDigital: Boolean!
    downloadableFiles: [DownloadableFile!]!
    weight: Float
    dimensions: Dimensions
    shippingClass: String
    seoTitle: String
    seoDescription: String
    tags: [String!]!
    featured: Boolean!
    onSale: Boolean!
    saleStart: String
    saleEnd: String
    views: Int!
    purchases: Int!
    rating: Float!
    reviewCount: Int!
    likes: [ID!]!
    relatedProducts: [Product!]!
    relatedEvents: [Event!]!
    relatedAlbums: [Album!]!
    careInstructions: String
    materials: [String!]!
    warranty: String
    returnPolicy: String
    createdBy: User
    updatedBy: User
    createdAt: String!
    updatedAt: String!
  }

  # Tipo ligero para listas de productos (reduce overfetching)
  type ProductListItem {
    id: ID!
    name: String!
    price: Float!
    compareAtPrice: Float
    image: String!
    category: String!
    brand: String!
    rating: Float!
    reviewCount: Int!
    isAvailable: Boolean!
    onSale: Boolean!
    featured: Boolean!
  }

  # Tipos de input para filtros de productos
  input ProductFilters {
    page: Int
    limit: Int
    sort: String
    order: String
    search: String
    category: String
    subcategory: String
    brand: String
    minPrice: Float
    maxPrice: Float
    inStock: Boolean
    onSale: Boolean
    featured: Boolean
    tags: [String]
    rating: Float
  }

  # Queries optimizadas para Store
  type Query {
    # Query principal para lista de productos
    products(filters: ProductFilters): ProductsResponse!

    # Query para producto individual con datos completos
    product(id: ID!): Product

    # Query optimizada para listas (sin datos pesados)
    productsList(filters: ProductFilters): ProductsListResponse!

    # Query para productos destacados
    featuredProducts(limit: Int): [Product!]!

    # Query para productos en oferta
    saleProducts(limit: Int): [Product!]!

    # Query para productos por categoría
    productsByCategory(category: String!, limit: Int): [Product!]!

    # Query para productos relacionados
    relatedProducts(productId: ID!, limit: Int): [Product!]!

    # Query para productos de álbum específico
    albumProducts(albumId: ID!): [Product!]!

    # Estadísticas de productos
    productStats: ProductStats!
  }

  # Respuestas optimizadas
  type ProductsResponse {
    products: [Product!]!
    pagination: Pagination!
  }

  type ProductsListResponse {
    products: [ProductListItem!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    pages: Int!
    total: Int!
    limit: Int!
  }

  type ProductStats {
    totalProducts: Int!
    totalCategories: Int!
    avgPrice: Float!
    totalSales: Int!
    featuredProducts: Int!
    outOfStock: Int!
    categoryDistribution: [CategoryCount!]!
  }

  type CategoryCount {
    category: String!
    count: Int!
  }

  # Mutations para carrito y compras
  type Mutation {
    # Agregar al carrito
    addToCart(productId: ID!, quantity: Int!, variant: String): CartResponse!

    # Actualizar cantidad en carrito
    updateCartItem(cartItemId: ID!, quantity: Int!): CartResponse!

    # Remover del carrito
    removeFromCart(cartItemId: ID!): CartResponse!

    # Agregar/quitar de wishlist
    toggleWishlist(productId: ID!): WishlistResponse!

    # Rate product
    rateProduct(productId: ID!, rating: Int!, review: String): RatingResponse!
  }

  type CartResponse {
    success: Boolean!
    message: String
    cart: Cart
  }

  type WishlistResponse {
    success: Boolean!
    message: String
    isInWishlist: Boolean!
  }

  type RatingResponse {
    success: Boolean!
    message: String
    product: Product
  }

  # Tipos relacionados
  type Cart {
    id: ID!
    items: [CartItem!]!
    total: Float!
    itemCount: Int!
  }

  type CartItem {
    id: ID!
    product: Product!
    quantity: Int!
    variant: String
    price: Float!
    total: Float!
  }

  type Event {
    id: ID!
    name: String!
    date: String!
    venue: String!
  }

  type Album {
    id: ID!
    title: String!
    coverImage: String
    artist: String!
  }

  type User {
    id: ID!
    username: String!
    avatar: String
  }
`;

module.exports = storeTypeDefs;