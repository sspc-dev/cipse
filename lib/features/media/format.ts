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
