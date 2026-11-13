import type { MediaKind } from "./types";

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  image: "Imagen",
  video: "Video",
  document: "Documento",
};

export function formatMediaSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mediaFileUrl(id: number): string {
  return `/multimedia/file/${id}`;
}

/** Miniatura reducida (WebP ~640 px) para tarjetas de galería y paneles. */
export function mediaThumbUrl(id: number): string {
  return `/multimedia/file/${id}?thumb=1`;
}

/**
 * URL para el visor embebido (iframe). El parámetro de consulta cambia la
 * clave de caché del navegador: descarta respuestas previas servidas con
 * `Content-Disposition: attachment` (cacheadas como immutable por un año)
 * y fuerza una petición que reciba las cabeceras inline actuales.
 */
export function mediaEmbedUrl(id: number): string {
  return `/multimedia/file/${id}?view=inline`;
}
