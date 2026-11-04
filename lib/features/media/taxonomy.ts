import type { MediaItem, MediaKind } from "./types";

/**
 * Subconjunto serializable de `MediaItem` apto para cruzar el límite
 * servidor → cliente. Excluye `createdAt` (Date) y campos internos.
 */
export type MediaViewItem = {
  id: number;
  day: number;
  kind: MediaKind;
  title: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
};

export const MEDIA_FILTERS = [
  "all",
  "image",
  "video",
  "document",
] as const;

export type MediaFilter = (typeof MEDIA_FILTERS)[number];

export function toMediaViewItem(item: MediaItem): MediaViewItem {
  return {
    id: item.id,
    day: item.day,
    kind: item.kind,
    title: item.title,
    originalName: item.originalName,
    mime: item.mime,
    sizeBytes: item.sizeBytes,
  };
}

export type MediaFilterCriteria = {
  day: number;
  filter: MediaFilter;
  query: string;
};

export function filterMediaItems(
  items: readonly MediaViewItem[],
  { day, filter, query }: MediaFilterCriteria,
): MediaViewItem[] {
  const term = query.trim().toLowerCase();

  return items.filter((item) => {
    if (item.day !== day) return false;
    if (filter !== "all" && item.kind !== filter) return false;
    if (!term) return true;

    return (
      item.title.toLowerCase().includes(term) ||
      item.originalName.toLowerCase().includes(term)
    );
  });
}

export function countMediaByKind(
  items: readonly MediaViewItem[],
  day: number,
): Record<MediaFilter, number> {
  const counts: Record<MediaFilter, number> = {
    all: 0,
    image: 0,
    video: 0,
    document: 0,
  };

  for (const item of items) {
    if (item.day !== day) continue;

    counts.all += 1;
    counts[item.kind] += 1;
  }

  return counts;
}

/** Primer video como registro destacado; si no hay, la primera imagen. */
export function pickFeaturedMedia(
  items: readonly MediaViewItem[],
): MediaViewItem | null {
  return (
    items.find((item) => item.kind === "video") ??
    items.find((item) => item.kind === "image") ??
    null
  );
}

const DOCUMENT_FORMAT_BY_MIME: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "text/plain": "TXT",
};

/** Etiqueta técnica corta para documentos (PDF, PPTX, DOCX…). */
export function mediaFormatTag(item: MediaViewItem): string {
  if (item.kind !== "document") {
    return item.kind === "video" ? "VIDEO" : "IMG";
  }

  const known = DOCUMENT_FORMAT_BY_MIME[item.mime];
  if (known) return known;

  const extension = item.originalName.split(".").pop();
  return extension ? extension.toUpperCase().slice(0, 4) : "DOC";
}

/** Cantidad de jornadas con al menos un archivo publicado. */
export function countDaysWithMedia(
  items: readonly MediaViewItem[],
): number {
  return new Set(items.map((item) => item.day)).size;
}

/** Cantidad de categorías de archivo con material publicado. */
export function countAvailableKinds(
  items: readonly MediaViewItem[],
): number {
  return new Set(items.map((item) => item.kind)).size;
}

/** Suma de bytes de todos los archivos publicados. */
export function totalMediaBytes(
  items: readonly { sizeBytes: number }[],
): number {
  return items.reduce((total, item) => total + item.sizeBytes, 0);
}
