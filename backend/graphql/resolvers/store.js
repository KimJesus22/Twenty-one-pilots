const Product = require('../../models/Product');

const storeResolvers = {
  Query: {
    // Query principal para productos
    products: async (_, { filters = {} }) => {
      const {
        page = 1,
        limit = 12,
        sort = 'createdAt',
        order = 'desc',
        search,
        category,
        subcategory,
        brand,
        minPrice,
        maxPrice,
        inStock,
        onSale,
        featured,
        tags,
        rating
      } = filters;

      // Construir query
      const query = {};
      if (search) {
        query.$text = { $search: search };
      }
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;
      if (brand) query.brand = brand;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }
      if (inStock !== undefined) query.isAvailable = inStock;
      if (onSale !== undefined) query.onSale = onSale;
      if (featured !== undefined) query.featured = featured;
      if (tags && tags.length > 0) query.tags = { $in: tags };
      if (rating) query.rating = { $gte: rating };

      // Ejecutar query con paginación
      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        populate: [
          { path: 'relatedProducts', select: 'name price image' },
          { path: 'relatedEvents', select: 'name date venue' },
          { path: 'relatedAlbums', select: 'title artist coverImage' }
        ]
      };

      const result = await Product.paginate(query, options);

      return {
        products: result.docs,
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Query para producto individual
    product: async (_, { id }) => {
      return await Product.findById(id)
        .populate('relatedProducts')
        .populate('relatedEvents')
        .populate('relatedAlbums');
    },

    // Query optimizada para listas (productos ligeros)
    productsList: async (_, { filters = {} }) => {
      const {
        page = 1,
        limit = 20,
        sort = 'createdAt',
        order = 'desc',
        search,
        category,
        minPrice,
        maxPrice,
        onSale,
        featured
      } = filters;

      const query = {};
      if (search) query.$text = { $search: search };
      if (category) query.category = category;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }
      if (onSale !== undefined) query.onSale = onSale;
      if (featured !== undefined) query.featured = featured;

      const options = {
        page,
        limit,
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        select: 'name price compareAtPrice image category brand rating reviewCount isAvailable onSale featured' // Solo campos necesarios
      };

      const result = await Product.paginate(query, options);

      return {
        products: result.docs.map(product => ({
          id: product._id,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.image || product.images?.[0],
          category: product.category,
          brand: product.brand,
          rating: product.rating,
          reviewCount: product.reviewCount,
          isAvailable: product.isAvailable,
          onSale: product.onSale,
          featured: product.featured
        })),
        pagination: {
          page: result.page,
          pages: result.totalPages,
          total: result.totalDocs,
          limit: result.limit
        }
      };
    },

    // Productos destacados
    featuredProducts: async (_, { limit = 10 }) => {
      return await Product.find({ featured: true, isAvailable: true })
        .sort({ createdAt: -1 })
        .limit(limit);
    },

    // Productos en oferta
    saleProducts: async (_, { limit = 10 }) => {
      return await Product.find({ onSale: true, isAvailable: true })
        .sort({ createdAt: -1 })
        .limit(limit);
    },

    // Productos por categoría
    productsByCategory: async (_, { category, limit = 20 }) => {
      return await Product.find({ category, isAvailable: true })
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit);
    },

    // Productos relacionados
    relatedProducts: async (_, { productId, limit = 6 }) => {
      const product = await Product.findById(productId);
      if (!product) return [];

      return await Product.find({
        _id: { $ne: productId },
        category: product.category,
        isAvailable: true
      })
      .sort({ rating: -1 })
      .limit(limit);
    },

    // Productos de álbum específico
    albumProducts: async (_, { albumId }) => {
      return await Product.find({
        relatedAlbums: albumId,
        isAvailable: true
      })
      .sort({ rating: -1 });
    },

    // Estadísticas de productos
    productStats: async () => {
      const [
        totalProducts,
        categories,
        avgPrice,
        totalSales,
        featuredCount,
        outOfStockCount
      ] = await Promise.all([
        Product.countDocuments(),
        Product.distinct('category'),
        Product.aggregate([
          { $match: { isAvailable: true } },
          { $group: { _id: null, avg: { $avg: '$price' } } }
        ]),
        Product.aggregate([
          { $match: { isAvailable: true } },
          { $group: { _id: null, total: { $sum: '$purchases' } } }
        ]),
        Product.countDocuments({ featured: true }),
        Product.countDocuments({ isAvailable: false })
      ]);

      // Distribución por categorías
      const categoryStats = await Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);

      return {
        totalProducts,
        totalCategories: categories.length,
        avgPrice: avgPrice[0]?.avg || 0,
        totalSales: totalSales[0]?.total || 0,
        featuredProducts: featuredCount,
        outOfStock: outOfStockCount,
        categoryDistribution: categoryStats.map(stat => ({
          category: stat._id,
          count: stat.count
        }))
      };
    }
  },

  Mutation: {
    // Agregar al carrito (simulado)
    addToCart: async (_, { productId, quantity, variant }, { user }) => {
      if (!user) throw new Error('Authentication required');

      const product = await Product.findById(productId);
      if (!product) throw new Error('Product not found');

      // Aquí iría la lógica real del carrito
      return {
        success: true,
        message: 'Product added to cart',
        cart: {
          id: 'cart_' + user._id,
          items: [{
            id: 'item_' + Date.now(),
            product,
            quantity,
            variant,
            price: product.price,
            total: product.price * quantity
          }],
          total: product.price * quantity,
          itemCount: quantity
        }
      };
    },

    // Actualizar cantidad en carrito
    updateCartItem: async (_, { cartItemId, quantity }, { user }) => {
      if (!user) throw new Error('Authentication required');

      // Lógica simulada
      return {
        success: true,
        message: 'Cart item updated',
        cart: null
      };
    },

    // Remover del carrito
    removeFromCart: async (_, { cartItemId }, { user }) => {
      if (!user) throw new Error('Authentication required');

      return {
        success: true,
        message: 'Item removed from cart',
        cart: null
      };
    },

    // Toggle wishlist
    toggleWishlist: async (_, { productId }, { user }) => {
      if (!user) throw new Error('Authentication required');

      // Lógica simulada
      return {
        success: true,
        message: 'Wishlist updated',
        isInWishlist: false
      };
    },

    // Rate product
    rateProduct: async (_, { productId, rating, review }, { user }) => {
      if (!user) throw new Error('Authentication required');

      const product = await Product.findById(productId);
      if (!product) throw new Error('Product not found');

      // Aquí iría la lógica de rating de productos
      return {
        success: true,
        message: 'Product rated successfully',
        product
      };
    }
  }
};

module.exports = storeResolvers;