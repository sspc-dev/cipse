import { getAdminSession } from "@/lib/features/auth/actions";
import {
  getMediaObject,
  isMediaStorageConfigured,
  isObjectNotFoundError,
  MediaStorageNotConfiguredError,
} from "@/lib/features/media/storage";
import { mediaMimeFromName } from "@/lib/features/media/types";

/**
 * Vista previa de un objeto del bucket para el inventario admin.
 *
 * Seguridad: requiere sesión admin y exige una clave que siga el patrón de
 * subida (`multimedia/dia-N/<uuid>.<ext>`), sin prefijo libre ni traversal.
 */

const OBJECT_NAME_PATTERN =
  /^multimedia\/dia-\d+\/[0-9A-Za-z-]{8,}\.[0-9A-Za-z]{1,10}$/;

export async function GET(request: Request) {
  const admin = await getAdminSession();

  if (!admin) {
    return new Response("No autorizado.", { status: 401 });
  }

  const name = new URL(request.url).searchParams.get("name");

  if (!name || !OBJECT_NAME_PATTERN.test(name)) {
    return new Response("Objeto no válido.", { status: 400 });
  }

  if (!isMediaStorageConfigured()) {
    return new Response(
      "El almacenamiento de multimedia no está configurado.",
      { status: 503 },
    );
  }

  try {
    const object = await getMediaObject({
      key: name,
      rangeHeader: request.headers.get("range"),
    });

    const { contentRange } = object;
    const hasPartialRange = contentRange !== null;

    const headers = new Headers({
      "Content-Type": mediaMimeFromName(name) ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "bytes",
    });

    if (contentRange) {
      // Sin total conocido (no hay fila en DB), RFC 7233 permite `*`.
      headers.set(
        "Content-Range",
        `bytes ${contentRange.startByte}-${contentRange.endByte}/${contentRange.totalBytes ?? "*"}`,
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
      console.error("[media/object]", error.message);
      return new Response(
        "El almacenamiento de multimedia no está configurado.",
        { status: 503 },
      );
    }
    if (isObjectNotFoundError(error)) {
      return new Response("El objeto ya no está disponible.", { status: 404 });
    }
    console.error("[media/object] Error al leer objeto:", error);
    return new Response("No fue posible leer el objeto.", { status: 502 });
  }
}
