import { getMediaAccess } from "@/lib/features/auth/media-actions";
import { findEventMediaById } from "@/lib/features/media/datasource";
import {
  getMediaObject,
  isMediaStorageConfigured,
  isObjectNotFoundError,
  MediaStorageNotConfiguredError,
} from "@/lib/features/media/storage";
import {
  getOrCreateMediaThumb,
  MEDIA_THUMB_CONTENT_TYPE,
} from "@/lib/features/media/thumbs";

function notFound(message: string) {
  return new Response(message, { status: 404 });
}

/** El visor del navegador solo muestra documentos inline de forma fiable si son PDF; el resto se descarga. */
const INLINE_DOCUMENT_MIME = new Set(["application/pdf"]);

function contentDisposition(
  kind: string,
  mime: string,
  originalName: string,
): string {
  const safeName = originalName.replace(/["\\\r\n]/g, "");
  const encoded = encodeURIComponent(originalName);

  const inline =
    kind !== "document" || INLINE_DOCUMENT_MIME.has(mime);

  return inline
    ? `inline; filename="${safeName}"; filename*=UTF-8''${encoded}`
    : `attachment; filename="${safeName}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await getMediaAccess();

  if (!access) {
    return notFound("Archivo no encontrado.");
  }

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

  const wantsThumb =
    new URL(request.url).searchParams.get("thumb") === "1";

  if (wantsThumb && media.kind === "image") {
    try {
      const thumb = await getOrCreateMediaThumb(media.id, media.objectKey);

      if (thumb) {
        return new Response(new Uint8Array(thumb), {
          status: 200,
          headers: {
            "Content-Type": MEDIA_THUMB_CONTENT_TYPE,
            "Content-Length": String(thumb.byteLength),
            // Contenido determinista por id: se puede cachear de forma segura
            // en el navegador del usuario autenticado.
            "Cache-Control": "private, max-age=31536000, immutable",
            "Content-Disposition": `inline; filename="thumb-${media.id}.webp"`,
          },
        });
      }
    } catch (error) {
      if (error instanceof MediaStorageNotConfiguredError) {
        console.error("[multimedia/file]", error.message);
        return new Response(
          "El almacenamiento de multimedia no está configurado.",
          { status: 503 },
        );
      }
      if (isObjectNotFoundError(error)) {
        return notFound("El archivo ya no está disponible.");
      }
      console.error("[multimedia/file] Error al generar miniatura:", error);
    }
    // Sin miniatura disponible: se sirve el original.
  }

  try {
    const object = await getMediaObject({
      key: media.objectKey,
      rangeHeader: request.headers.get("range"),
    });

    const { contentRange } = object;
    const hasPartialRange = contentRange !== null;

    const headers = new Headers({
      "Content-Type": media.mime,
      "Content-Disposition": contentDisposition(
        media.kind,
        media.mime,
        media.originalName,
      ),
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "bytes",
    });

    if (contentRange) {
      headers.set(
        "Content-Range",
        `bytes ${contentRange.startByte}-${contentRange.endByte}/${contentRange.totalBytes ?? media.sizeBytes}`,
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
      console.error("[multimedia/file]", error.message);
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
