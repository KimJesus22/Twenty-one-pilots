const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuario o email ya existe' });
    }

    // Crear nuevo usuario
    const user = new User({ username, email, password });
    await user.save();

    // Generar token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user._id, username: user.username, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;