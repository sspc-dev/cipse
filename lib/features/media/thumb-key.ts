/**
 * Convención de rutas de las miniaturas derivadas. Vive en su propio módulo
 * para que código que solo necesita la ruta no cargue el procesador de
 * imágenes.
 */

export const MEDIA_THUMB_PREFIX = "multimedia/thumbs/";

export function mediaThumbKey(id: number): string {
  return `${MEDIA_THUMB_PREFIX}${id}.webp`;
}

export function isMediaThumbObject(name: string): boolean {
  return name.startsWith(MEDIA_THUMB_PREFIX);
}
