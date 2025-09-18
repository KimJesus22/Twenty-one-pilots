const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Obtener todos los productos
router.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isAvailable: true };

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener producto específico
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener categorías disponibles
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isAvailable: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simular checkout (sin integración real de pagos)
router.post('/checkout', async (req, res) => {
  try {
    const { items, total } = req.body;

    // Validar stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para ${product?.name || 'producto'}`
        });
      }
    }

    // Simular procesamiento de pago
    // En producción, integrar con Stripe, PayPal, etc.

    // Actualizar stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.json({
      success: true,
      message: 'Compra procesada exitosamente',
      orderId: 'ORDER_' + Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;