// Utilidad para obtener carátulas de álbumes usando iTunes API

const ITUNES_API_BASE = 'https://itunes.apple.com/search';

export const searchAlbumArt = async (albumTitle, artistName) => {
  try {
    const query = `${artistName} ${albumTitle}`.replace(/\s+/g, '+');
    const url = `${ITUNES_API_BASE}?term=${query}&entity=album&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Devolver la imagen de mayor resolución
      return data.results[0].artworkUrl100.replace('100x100', '600x600');
    }

    return null;
  } catch (error) {
    console.error('Error fetching album art:', error);
    return null;
  }
};

// Cache para evitar múltiples requests
const artCache = new Map();

export const getAlbumArt = async (albumTitle, artistName) => {
  const key = `${artistName}-${albumTitle}`;

  if (artCache.has(key)) {
    return artCache.get(key);
  }

  const artUrl = await searchAlbumArt(albumTitle, artistName);
  artCache.set(key, artUrl);

  return artUrl;
};