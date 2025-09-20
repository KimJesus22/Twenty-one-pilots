/**
 * Guards para validar videos antes de mostrar/seleccionar
 */

/**
 * Verifica si un video está completamente válido para mostrar y seleccionar
 * @param {Object} video - Video a validar
 * @returns {boolean} true si es válido
 */
export function isValidVideo(video) {
  if (!video || typeof video !== 'object') return false;

  // Verificar ID
  const hasValidId = video.id &&
                    (typeof video.id === 'string' || video.id.videoId) &&
                    (video.id.videoId || video.id).trim();

  // Verificar título (no vacío, no placeholder)
  const title = video.title || '';
  const hasValidTitle = title.trim() &&
                       title !== 'Sin título' &&
                       title !== 'Título no disponible' &&
                       !title.includes('no disponible') &&
                       title.length > 2; // Mínimo 3 caracteres

  // Verificar que no sea un canal o playlist sin título válido
  const isNotInvalidType = !video.id?.channelId || hasValidTitle;

  return hasValidId && hasValidTitle && isNotInvalidType;
}

/**
 * Filtra array de videos manteniendo solo los válidos
 * @param {Array} videos - Array de videos
 * @returns {Array} Videos filtrados
 */
export function filterValidVideos(videos) {
  if (!Array.isArray(videos)) return [];

  return videos.filter(video => {
    const isValid = isValidVideo(video);
    if (!isValid) {
      console.warn('⚠️ Video filtrado por guard:', video);
    }
    return isValid;
  });
}

/**
 * Encuentra el primer video válido en un array
 * @param {Array} videos - Array de videos
 * @returns {Object|null} Primer video válido o null
 */
export function findFirstValidVideo(videos) {
  if (!Array.isArray(videos)) return null;

  for (const video of videos) {
    if (isValidVideo(video)) {
      return video;
    }
  }

  return null;
}

/**
 * Verifica si un video puede ser seleccionado (adicional a isValidVideo)
 * @param {Object} video - Video a verificar
 * @returns {boolean} true si puede ser seleccionado
 */
export function canSelectVideo(video) {
  return isValidVideo(video) && video.id && (video.id.videoId || video.id);
}