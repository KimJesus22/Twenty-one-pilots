const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Seguridad y Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 requests por ventana para auth
  message: 'Demasiados intentos de autenticación, por favor intenta más tarde.',
});

app.use('/api/auth/', authLimiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de payload

// Conectar a MongoDB (opcional para desarrollo)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));
} else {
  console.log('MongoDB no configurado - ejecutando sin base de datos');
}

const discographyRoutes = require('./routes/discography');
const authRoutes = require('./routes/auth');
const videosRoutes = require('./routes/videos');
const concertsRoutes = require('./routes/concerts');
const notificationsRoutes = require('./routes/notifications');
const locationRoutes = require('./routes/location');
const lyricsRoutes = require('./routes/lyrics');
const concertTriviaRoutes = require('./routes/concertTrivia');
const mapsRoutes = require('./routes/maps');
const cacheRoutes = require('./routes/cache');
const forumRoutes = require('./routes/forum');
const playlistsRoutes = require('./routes/playlists');
const storeRoutes = require('./routes/store');
const adminRoutes = require('./routes/admin');
const favoritesRoutes = require('./routes/favorites');

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Twenty One Pilots' });
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/discography', discographyRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/concerts', concertsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/concert-trivia', concertTriviaRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoritesRoutes);

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});