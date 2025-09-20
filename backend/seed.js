const mongoose = require('mongoose');
const { Album, Song } = require('./models/Discography');
require('dotenv').config();

const albumsData = [
  {
    title: 'Twenty One Pilots',
    releaseYear: 2009,
    coverImage: null,
    songs: [
      { title: 'Implicit Demand for Proof', duration: '4:51' },
      { title: 'Fall Away', duration: '3:58' },
      { title: 'The Pantaloon', duration: '3:33' },
      { title: 'Addict with a Pen', duration: '4:45' },
      { title: 'Friend, Please', duration: '4:13' }
    ]
  },
  {
    title: 'Regional at Best',
    releaseYear: 2011,
    coverImage: null,
    songs: [
      { title: 'Guns for Hands', duration: '4:33' },
      { title: 'Holding on to You', duration: '4:23' },
      { title: 'Ode to Sleep', duration: '5:08' },
      { title: 'Slowtown', duration: '4:32' },
      { title: 'Car Radio', duration: '4:27' }
    ]
  },
  {
    title: 'Vessel',
    releaseYear: 2013,
    coverImage: null,
    songs: [
      { title: 'Ode to Sleep', duration: '5:08' },
      { title: 'Holding on to You', duration: '4:23' },
      { title: 'Migraine', duration: '4:10' },
      { title: 'House of Gold', duration: '2:43' },
      { title: 'Car Radio', duration: '4:27' }
    ]
  },
  {
    title: 'Blurryface',
    releaseYear: 2015,
    coverImage: null,
    songs: [
      { title: 'Heavydirtysoul', duration: '4:54' },
      { title: 'Stressed Out', duration: '3:22' },
      { title: 'Ride', duration: '3:34' },
      { title: 'Fairly Local', duration: '3:27' },
      { title: 'Tear in My Heart', duration: '3:08' }
    ]
  },
  {
    title: 'Trench',
    releaseYear: 2018,
    coverImage: null,
    songs: [
      { title: 'Jumpsuit', duration: '3:58' },
      { title: 'Levitate', duration: '2:33' },
      { title: 'Morph', duration: '4:19' },
      { title: 'My Blood', duration: '3:49' },
      { title: 'Chlorine', duration: '5:24' }
    ]
  },
  {
    title: 'Scaled and Icy',
    releaseYear: 2021,
    coverImage: null,
    songs: [
      { title: 'Good Day', duration: '3:24' },
      { title: 'Choker', duration: '3:43' },
      { title: 'Shy Away', duration: '2:55' },
      { title: 'The Outside', duration: '3:36' },
      { title: 'Saturday', duration: '2:52' }
    ]
  }
];

async function seedDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    // Limpiar datos existentes
    await Album.deleteMany({});
    await Song.deleteMany({});
    console.log('Datos existentes eliminados');

    // Insertar álbumes y canciones
    for (const albumData of albumsData) {
      const songs = albumData.songs.map(songData => ({
        ...songData,
        lyrics: '' // Agregar letras vacías por ahora
      }));

      // Crear canciones
      const createdSongs = await Song.insertMany(songs);

      // Crear álbum con referencias a canciones
      const album = new Album({
        title: albumData.title,
        releaseYear: albumData.releaseYear,
        coverImage: albumData.coverImage,
        songs: createdSongs.map(song => song._id)
      });

      await album.save();
      console.log(`Álbum "${albumData.title}" creado con ${createdSongs.length} canciones`);
    }

    console.log('Base de datos poblada exitosamente');
  } catch (error) {
    console.error('Error poblando la base de datos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión cerrada');
  }
}

// Ejecutar el seed
seedDatabase();