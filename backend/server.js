const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/twentyonepilots', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Twenty One Pilots' });
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});