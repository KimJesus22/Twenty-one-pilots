const mongoose = require('mongoose');
const AlbumMetrics = require('../models/AlbumMetrics');
const { Album } = require('../models/Discography');
require('dotenv').config();

const albumsData = [
  {
    title: 'Blurryface',
    releaseYear: 2015,
    spotifyId: '3Bmc8P8jZhCpKsH4WZKdYf',
    youtubeId: 'blurryface_album'
  },
  {
    title: 'Trench',
    releaseYear: 2018,
    spotifyId: '4ySxFTVmaG9HqOUABX6JeZ',
    youtubeId: 'trench_album'
  },
  {
    title: 'Scaled and Icy',
    releaseYear: 2021,
    spotifyId: '0U8TT8qiIfCgEFqEkiZrQ8',
    youtubeId: 'scaled_and_icy_album'
  }
];

async function seedAlbumMetrics() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    // Limpiar datos existentes
    await AlbumMetrics.deleteMany({});
    console.log('Datos de métricas anteriores eliminados');

    // Obtener álbumes existentes o crearlos
    const albums = [];
    for (const albumData of albumsData) {
      let album = await Album.findOne({ title: albumData.title });
      if (!album) {
        album = new Album(albumData);
        await album.save();
        console.log(`Álbum creado: ${album.title}`);
      }
      albums.push(album);
    }

    // Generar datos de métricas para los últimos 2 años
    const now = new Date();
    const twoYearsAgo = new Date(now.getTime() - (365 * 2 * 24 * 60 * 60 * 1000));

    for (const album of albums) {
      console.log(`Generando métricas para: ${album.title}`);

      // Generar datos diarios para los últimos 2 años
      const metrics = [];
      let currentDate = new Date(twoYearsAgo);

      // Valores base para cada álbum
      const basePopularity = album.title === 'Blurryface' ? 85 :
                           album.title === 'Trench' ? 90 : 75;
      const baseViews = album.title === 'Blurryface' ? 500000000 :
                       album.title === 'Trench' ? 800000000 : 200000000;
      const baseLikes = album.title === 'Blurryface' ? 3000000 :
                       album.title === 'Trench' ? 5000000 : 1000000;

      while (currentDate <= now) {
        // Agregar variación aleatoria
        const popularity = Math.max(0, Math.min(100,
          basePopularity + (Math.random() - 0.5) * 20 +
          Math.sin(currentDate.getTime() / (30 * 24 * 60 * 60 * 1000)) * 5 // Variación mensual
        ));

        const views = Math.max(0, baseViews + (currentDate.getTime() - twoYearsAgo.getTime()) /
          (now.getTime() - twoYearsAgo.getTime()) * baseViews * 0.5 + Math.random() * 1000000);

        const likes = Math.max(0, baseLikes + (currentDate.getTime() - twoYearsAgo.getTime()) /
          (now.getTime() - twoYearsAgo.getTime()) * baseLikes * 0.3 + Math.random() * 50000);

        const playCount = Math.max(0, views * 0.1 + Math.random() * 100000);
        const streams = Math.max(0, views * 0.8 + Math.random() * 500000);

        // Solo guardar datos cada 7 días para no sobrecargar
        if (Math.random() < 0.15) { // ~15% de probabilidad = ~1-2 días por semana
          metrics.push({
            album: album._id,
            popularity: Math.round(popularity),
            views: Math.round(views),
            likes: Math.round(likes),
            playCount: Math.round(playCount),
            streams: Math.round(streams),
            capturedAt: new Date(currentDate),
            source: Math.random() < 0.7 ? 'api' : 'manual'
          });
        }

        // Avanzar 1 día
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Insertar métricas en lotes
      if (metrics.length > 0) {
        await AlbumMetrics.insertMany(metrics);
        console.log(`Insertadas ${metrics.length} métricas para ${album.title}`);
      }
    }

    console.log('✅ Seed de métricas de álbumes completado exitosamente');

    // Mostrar estadísticas
    const totalMetrics = await AlbumMetrics.countDocuments();
    console.log(`📊 Total de registros de métricas: ${totalMetrics}`);

    const stats = await AlbumMetrics.aggregate([
      {
        $group: {
          _id: '$album',
          count: { $sum: 1 },
          avgPopularity: { $avg: '$popularity' },
          maxViews: { $max: '$views' },
          totalStreams: { $sum: '$streams' }
        }
      },
      {
        $lookup: {
          from: 'albums',
          localField: '_id',
          foreignField: '_id',
          as: 'album'
        }
      },
      { $unwind: '$album' }
    ]);

    console.log('\n📈 Estadísticas por álbum:');
    stats.forEach(stat => {
      console.log(`${stat.album.title}: ${stat.count} registros, Popularidad promedio: ${stat.avgPopularity.toFixed(1)}`);
    });

  } catch (error) {
    console.error('❌ Error en seed de métricas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seedAlbumMetrics();
}

module.exports = seedAlbumMetrics;