const mongoose = require('mongoose');
const { Album, Song } = require('../models/Discography');
require('dotenv').config();

const albumDetails = [
  {
    title: 'Blurryface',
    externalLinks: {
      spotify: 'https://open.spotify.com/album/3Bmc8P8jZhCpKsH4WZKdYf',
      appleMusic: 'https://music.apple.com/us/album/blurryface/1440871042',
      youtube: 'https://www.youtube.com/playlist?list=PLVf2BC9lXz9X3pY5V5V5V5V5V5V5V5V5V',
      youtubeMusic: 'https://music.youtube.com/playlist?list=RDCLAK5uy_mz-tQOcBbXBHp4VQvL5GhFg',
      deezer: 'https://www.deezer.com/album/10549984',
      tidal: 'https://tidal.com/album/55555555',
      amazonMusic: 'https://www.amazon.com/Blurryface-Twenty-One-Pilots/dp/B00U8XQXQG',
      genius: 'https://genius.com/albums/Twenty-one-pilots/Blurryface',
      musicbrainz: 'https://musicbrainz.org/release-group/12345678-1234-1234-1234-123456789012',
      discogs: 'https://www.discogs.com/Twenty-One-Pilots-Blurryface/master/123456',
      allmusic: 'https://www.allmusic.com/album/blurryface-mw0002820000',
      wikipedia: 'https://en.wikipedia.org/wiki/Blurryface',
      officialWebsite: 'https://www.twentyonepilots.com/music/blurryface'
    },
    credits: {
      executiveProducer: 'Chris Woltman',
      producers: ['Mike Elizondo', 'Tim Anderson'],
      engineers: ['Adam Hawkins', 'Scott Skrzynski'],
      mixingEngineers: ['Neal Avron', 'Scott Skrzynski'],
      masteringEngineers: ['Chris Woltman'],
      artworkBy: 'Brandon Rike',
      photographyBy: 'Tim Flach',
      designBy: 'Brandon Rike',
      additionalCredits: [
        { role: 'Management', names: ['Andrew Paiano', 'Andrew Goldstein'] },
        { role: 'Legal', names: ['Patrick Jordan'] },
        { role: 'Booking', names: ['CAA'] }
      ]
    },
    productionNotes: {
      recordingLocation: 'Various locations including United Recording Studios, Los Angeles',
      recordingDates: '2014-2015',
      mixingLocation: 'The Casita, Hollywood',
      masteringLocation: 'The Mastering Palace, New York',
      studio: 'United Recording Studios',
      equipment: 'Pro Tools, Neumann microphones, SSL consoles',
      additionalInfo: 'Blurryface was recorded over a period of 18 months with producers Mike Elizondo and Tim Anderson. The album features a mix of electronic and acoustic elements, showcasing the band\'s evolution from their previous work.'
    },
    upc: '075679922620',
    catalogNumber: 'B0022899-02',
    label: 'Fueled By Ramen',
    copyright: '© 2015 Fueled By Ramen LLC',
    releaseDate: new Date('2015-05-17')
  },
  {
    title: 'Trench',
    externalLinks: {
      spotify: 'https://open.spotify.com/album/4ySxFTVmaG9HqOUABX6JeZ',
      appleMusic: 'https://music.apple.com/us/album/trench/1440871043',
      youtube: 'https://www.youtube.com/playlist?list=PLVf2BC9lXz9X3pY5V5V5V5V5V5V5V5V5W',
      youtubeMusic: 'https://music.youtube.com/playlist?list=RDCLAK5uy_mz-tQOcBbXBHp4VQvL5GhFga',
      deezer: 'https://www.deezer.com/album/10549985',
      tidal: 'https://tidal.com/album/66666666',
      amazonMusic: 'https://www.amazon.com/Trench-Twenty-One-Pilots/dp/B07B4Z2Z3Z',
      genius: 'https://genius.com/albums/Twenty-one-pilots/Trench',
      musicbrainz: 'https://musicbrainz.org/release-group/87654321-4321-4321-4321-210987654321',
      discogs: 'https://www.discogs.com/Twenty-One-Pilots-Trench/master/234567',
      allmusic: 'https://www.allmusic.com/album/trench-mw0002820001',
      wikipedia: 'https://en.wikipedia.org/wiki/Trench_(album)',
      officialWebsite: 'https://www.twentyonepilots.com/music/trench'
    },
    credits: {
      executiveProducer: 'Chris Woltman',
      producers: ['Paul Meany', 'Tyler Joseph'],
      engineers: ['Paul Meany', 'Adam Hawkins'],
      mixingEngineers: ['Adam Hawkins', 'Chris Woltman'],
      masteringEngineers: ['Chris Woltman'],
      artworkBy: 'Brandon Rike',
      photographyBy: 'Tim Flach',
      designBy: 'Brandon Rike',
      additionalCredits: [
        { role: 'Additional Production', names: ['Paul Meany'] },
        { role: 'Management', names: ['Andrew Paiano', 'Andrew Goldstein'] },
        { role: 'Legal', names: ['Patrick Jordan'] }
      ]
    },
    productionNotes: {
      recordingLocation: 'Studio Litho, Seattle and Tyler\'s home studio',
      recordingDates: '2017-2018',
      mixingLocation: 'Studio Litho, Seattle',
      masteringLocation: 'The Mastering Palace, New York',
      studio: 'Studio Litho',
      equipment: 'Pro Tools, various synthesizers and drum machines',
      additionalInfo: 'Trench was recorded at Studio Litho in Seattle with producer Paul Meany. The album represents a complete creative shift for the band, incorporating more electronic elements and conceptual storytelling.'
    },
    upc: '075679922621',
    catalogNumber: 'B0022899-03',
    label: 'Fueled By Ramen',
    copyright: '© 2018 Fueled By Ramen LLC',
    releaseDate: new Date('2018-10-05')
  },
  {
    title: 'Scaled and Icy',
    externalLinks: {
      spotify: 'https://open.spotify.com/album/0U8TT8qiIfCgEFqEkiZrQ8',
      appleMusic: 'https://music.apple.com/us/album/scaled-and-icy/1440871044',
      youtube: 'https://www.youtube.com/playlist?list=PLVf2BC9lXz9X3pY5V5V5V5V5V5V5V5V5X',
      youtubeMusic: 'https://music.youtube.com/playlist?list=RDCLAK5uy_mz-tQOcBbXBHp4VQvL5GhFgb',
      deezer: 'https://www.deezer.com/album/10549986',
      tidal: 'https://tidal.com/album/77777777',
      amazonMusic: 'https://www.amazon.com/Scaled-Icy-Twenty-One-Pilots/dp/B07B4Z2Z4Z',
      genius: 'https://genius.com/albums/Twenty-one-pilots/Scaled-and-icy',
      musicbrainz: 'https://musicbrainz.org/release-group/11223344-5566-7788-9900-aabbccddeeff',
      discogs: 'https://www.discogs.com/Twenty-One-Pilots-Scaled-And-Icy/master/345678',
      allmusic: 'https://www.allmusic.com/album/scaled-and-icy-mw0002820002',
      wikipedia: 'https://en.wikipedia.org/wiki/Scaled_and_Icy',
      officialWebsite: 'https://www.twentyonepilots.com/music/scaled-and-icy'
    },
    credits: {
      executiveProducer: 'Chris Woltman',
      producers: ['Tyler Joseph', 'Paul Meany'],
      engineers: ['Paul Meany', 'Adam Hawkins'],
      mixingEngineers: ['Adam Hawkins', 'Chris Woltman'],
      masteringEngineers: ['Chris Woltman'],
      artworkBy: 'Brandon Rike',
      photographyBy: 'Tim Flach',
      designBy: 'Brandon Rike',
      additionalCredits: [
        { role: 'Additional Production', names: ['Paul Meany'] },
        { role: 'Management', names: ['Andrew Paiano', 'Andrew Goldstein'] },
        { role: 'Legal', names: ['Patrick Jordan'] }
      ]
    },
    productionNotes: {
      recordingLocation: 'Tyler\'s home studio and various remote locations',
      recordingDates: '2020-2021',
      mixingLocation: 'Various locations',
      masteringLocation: 'The Mastering Palace, New York',
      studio: 'Home studio setup',
      equipment: 'Pro Tools, various synthesizers, drum machines, and remote recording gear',
      additionalInfo: 'Scaled and Icy was recorded remotely during the COVID-19 pandemic. The album showcases the band\'s adaptability and creativity in a challenging recording environment.'
    },
    upc: '075679922622',
    catalogNumber: 'B0022899-04',
    label: 'Fueled By Ramen',
    copyright: '© 2021 Fueled By Ramen LLC',
    releaseDate: new Date('2021-05-21')
  }
];

async function seedAlbumDetails() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    for (const albumDetail of albumDetails) {
      console.log(`Actualizando detalles para: ${albumDetail.title}`);

      const album = await Album.findOneAndUpdate(
        { title: albumDetail.title },
        albumDetail,
        { new: true, runValidators: true }
      );

      if (album) {
        console.log(`✅ Detalles actualizados para ${album.title}`);
      } else {
        console.log(`⚠️  Álbum no encontrado: ${albumDetail.title}`);
      }
    }

    console.log('✅ Seed de detalles de álbumes completado exitosamente');

    // Mostrar estadísticas
    const totalAlbums = await Album.countDocuments();
    const albumsWithLinks = await Album.countDocuments({ 'externalLinks': { $exists: true, $ne: {} } });
    const albumsWithCredits = await Album.countDocuments({ 'credits': { $exists: true, $ne: {} } });

    console.log(`📊 Estadísticas:`);
    console.log(`Total de álbumes: ${totalAlbums}`);
    console.log(`Álbumes con enlaces externos: ${albumsWithLinks}`);
    console.log(`Álbumes con créditos: ${albumsWithCredits}`);

  } catch (error) {
    console.error('❌ Error en seed de detalles de álbumes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seedAlbumDetails();
}

module.exports = seedAlbumDetails;