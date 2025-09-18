const paginate = (model) => {
  return async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      // Validar parámetros
      if (page < 1) {
        return res.status(400).json({ error: 'La página debe ser mayor a 0' });
      }
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'El límite debe estar entre 1 y 100' });
      }

      // Calcular skip
      const skip = (page - 1) * limit;

      // Construir query de ordenamiento
      const sort = {};
      sort[sortBy] = sortOrder;

      // Ejecutar query con paginación
      const results = await model
        .find(req.filter || {})
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(req.populate || []);

      // Contar total de documentos
      const total = await model.countDocuments(req.filter || {});

      // Calcular información de paginación
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      // Adjuntar resultados paginados a la respuesta
      res.paginatedResults = {
        data: results,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        }
      };

      next();
    } catch (error) {
      res.status(500).json({ error: 'Error en la paginación' });
    }
  };
};

// Middleware para enviar respuesta paginada
const sendPaginatedResponse = (req, res) => {
  if (res.paginatedResults) {
    res.json(res.paginatedResults);
  } else {
    res.status(500).json({ error: 'No hay resultados paginados disponibles' });
  }
};

module.exports = {
  paginate,
  sendPaginatedResponse
};