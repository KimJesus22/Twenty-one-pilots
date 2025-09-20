/**
 * Normaliza un objeto de video a una forma consistente.
 * Maneja tanto objetos completos de la API de YouTube como strings de videoId.
 * A prueba de balas: maneja diferentes tipos de resultados y fallbacks robustos.
 * @param {string|object} video - El video a normalizar (puede ser un string videoId o un objeto de video).
 * @returns {object} - Objeto de video normalizado con propiedades consistentes.
 */
export function normalizeVideo(video) {
  if (typeof video === 'string') {
    // Si es un string, asumimos que es un videoId
    return {
      id: video,
      title: 'Sin título',
      description: 'Descripción no disponible',
      thumbnail: '',
      publishedAt: '',
      channelTitle: 'Canal desconocido',
    };
  }

  if (!video || typeof video !== 'object') {
    console.warn('normalizeVideo: input inválido', video);
    return {
      id: '',
      title: 'Sin título',
      description: '',
      thumbnail: '',
      publishedAt: '',
      channelTitle: '',
    };
  }

  // Verificar si el video ya está en formato "normalizado" (del backend)
  // Este formato tiene propiedades directas: title, description, thumbnail, etc.
  if (video.title && video.description !== undefined && video.thumbnail) {
    // Formato del backend - ya normalizado
    return {
      id: video.id,
      title: video.title || 'Sin título',
      description: video.description || 'Sin descripción',
      thumbnail: video.thumbnail || '',
      publishedAt: video.publishedAt || '',
      channelTitle: video.channelTitle || 'Canal desconocido',
      snippet: {
        title: video.title || 'Sin título',
        description: video.description || 'Sin descripción',
        channelTitle: video.channelTitle || 'Canal desconocido',
        publishedAt: video.publishedAt || '',
        thumbnails: {
          default: { url: video.thumbnail || '' },
          medium: { url: video.thumbnail || '' },
          high: { url: video.thumbnail || '' },
        },
      },
    };
  }

  // Formato original de YouTube API con snippet
  const snippet = video.snippet || {};
  const thumbnails = snippet.thumbnails || {};

  // Determinar el tipo de resultado
  const isVideo = video.id?.kind === 'youtube#video' ||
                  video.id?.videoId ||
                  (!video.id?.channelId && !video.id?.playlistId);

  const isChannel = video.id?.kind === 'youtube#channel' || video.id?.channelId;
  const isPlaylist = video.id?.kind === 'youtube#playlist' || video.id?.playlistId;

  // Extraer ID según el tipo
  let id = '';
  if (isVideo) {
    id = video.id?.videoId || video.id || '';
  } else if (isChannel) {
    id = video.id?.channelId || video.id || '';
  } else if (isPlaylist) {
    id = video.id?.playlistId || video.id || '';
  } else {
    id = video.id?.videoId || video.id?.channelId || video.id?.playlistId || video.id || '';
  }

  // Título con múltiples fallbacks
  let title = snippet.title || '';
  if (!title.trim()) {
    if (isChannel) {
      title = `Canal: ${snippet.channelTitle || 'Sin nombre'}`;
    } else if (isPlaylist) {
      title = `Lista: ${snippet.title || 'Sin título'}`;
    } else {
      title = 'Sin título';
    }
  }

  // Descripción
  const description = snippet.description || (isChannel ? 'Canal de YouTube' : 'Sin descripción');

  // Thumbnail con fallbacks
  const thumbnail = thumbnails.default?.url ||
                   thumbnails.medium?.url ||
                   thumbnails.high?.url ||
                   '';

  // Fecha de publicación
  const publishedAt = snippet.publishedAt || '';

  // Título del canal
  const channelTitle = snippet.channelTitle || (isChannel ? title : 'Canal desconocido');

  const normalized = {
    id,
    title: title.trim() || 'Sin título',
    description,
    thumbnail,
    publishedAt,
    channelTitle,
  };

  // Incluir snippet para compatibilidad con componentes que esperan el formato completo
  normalized.snippet = {
    title: normalized.title,
    description: normalized.description,
    channelTitle: normalized.channelTitle,
    publishedAt: normalized.publishedAt,
    thumbnails: {
      default: { url: normalized.thumbnail },
      medium: { url: normalized.thumbnail },
      high: { url: normalized.thumbnail },
    },
  };

  return normalized;
}