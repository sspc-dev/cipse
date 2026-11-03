export type MediaKind = "image" | "video" | "document";

export type MediaItem = {
  id: number;
  day: number;
  kind: MediaKind;
  title: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  createdAt: Date;
};

export type MediaDayGroup = {
  day: number;
  label: string;
  items: MediaItem[];
};

/** Límite por archivo: se carga en memoria antes de enviarlo a OCI. */
export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;

export function mediaKindFromMime(mime: string): MediaKind | null {
  if ((IMAGE_MIME_TYPES as readonly string[]).includes(mime)) return "image";
  if ((VIDEO_MIME_TYPES as readonly string[]).includes(mime)) return "video";
  if ((DOCUMENT_MIME_TYPES as readonly string[]).includes(mime)) {
    return "document";
  }
  return null;
}
