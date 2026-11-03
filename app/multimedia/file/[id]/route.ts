import { findEventMediaById } from "@/lib/features/media/datasource";
import {
  getMediaObject,
  isMediaStorageConfigured,
  isObjectNotFoundError,
  MediaStorageNotConfiguredError,
} from "@/lib/features/media/storage";


function notFound(message: string) {
  return new Response(message, { status: 404 });
}

function contentDisposition(
  kind: string,
  originalName: string,
): string {
  const safeName = originalName.replace(/["\\\r\n]/g, "");
  const encoded = encodeURIComponent(originalName);

  return kind === "document"
    ? `attachment; filename="${safeName}"; filename*=UTF-8''${encoded}`
    : `inline; filename="${safeName}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1) {
    return notFound("Archivo no encontrado.");
  }

  const media = await findEventMediaById(numericId);

  if (!media) {
    return notFound("Archivo no encontrado.");
  }

  if (!isMediaStorageConfigured()) {
    return new Response(
      "El almacenamiento de multimedia no está configurado.",
      { status: 503 },
    );
  }

  try {
    const object = await getMediaObject({
      key: media.objectKey,
      rangeHeader: request.headers.get("range"),
    });

    const { contentRange } = object;
    const hasPartialRange =
      contentRange.startByte !== null && contentRange.endByte !== null;

    const headers = new Headers({
      "Content-Type": media.mime,
      "Content-Disposition": contentDisposition(media.kind, media.originalName),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    });

    if (hasPartialRange) {
      headers.set(
        "Content-Range",
        `bytes ${contentRange.startByte}-${contentRange.endByte}/${contentRange.contentLength ?? media.sizeBytes}`,
      );
      headers.set("Content-Length", String(object.contentLength));
    } else {
      headers.set("Content-Length", String(object.contentLength));
    }

    return new Response(object.stream, {
      status: hasPartialRange ? 206 : 200,
      headers,
    });
  } catch (error) {
    if (error instanceof MediaStorageNotConfiguredError) {
      return new Response(
        "El almacenamiento de multimedia no está configurado.",
        { status: 503 },
      );
    }
    if (isObjectNotFoundError(error)) {
      return notFound("El archivo ya no está disponible.");
    }
    console.error("[multimedia/file] Error al leer objeto:", error);
    return new Response("No fue posible leer el archivo.", { status: 502 });
  }
}
