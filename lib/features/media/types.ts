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

/** Extensión → MIME, limitado exactamente a los tipos permitidos arriba. */
const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
};

/** MIME derivado del nombre de un objeto del bucket; null si no está permitido. */
export function mediaMimeFromName(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return null;

  const extension = name.slice(dot + 1).toLowerCase();
  return EXTENSION_MIME[extension] ?? null;
}

/** Clasificación a partir del nombre de un objeto del bucket. */
export function mediaKindFromName(name: string): MediaKind | null {
  const mime = mediaMimeFromName(name);
  return mime ? mediaKindFromMime(mime) : null;
}
