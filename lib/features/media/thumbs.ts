import sharp from "sharp";
import {
  getMediaObject,
  isObjectNotFoundError,
  MediaStorageNotConfiguredError,
  uploadMediaObject,
} from "./storage";
import { mediaThumbKey } from "./thumb-key";

/**
 * Miniaturas reducidas para las tarjetas de la galería y del panel admin.
 * Se generan una sola vez con sharp y se persisten en OCI junto al objeto
 * original; las peticiones posteriores leen la miniatura ya almacenada.
 */

export const MEDIA_THUMB_WIDTH = 640;
export const MEDIA_THUMB_QUALITY = 70;
export const MEDIA_THUMB_CONTENT_TYPE = "image/webp";

async function readObjectBuffer(key: string): Promise<Buffer> {
  const { stream } = await getMediaObject({ key });
  const bytes = await new Response(stream).arrayBuffer();
  return Buffer.from(bytes);
}

async function generateThumb(original: Buffer): Promise<Buffer> {
  return sharp(original)
    // Aplica la orientación EXIF antes de redimensionar.
    .rotate()
    .resize({ width: MEDIA_THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: MEDIA_THUMB_QUALITY })
    .toBuffer();
}

/**
 * Devuelve la miniatura WebP de un archivo de imagen. Si aún no existe se
 * genera a partir del original y se guarda en OCI. Devuelve `null` cuando la
 * imagen no se puede procesar para que el llamador sirva el original.
 */
export async function getOrCreateMediaThumb(
  id: number,
  objectKey: string,
): Promise<Buffer | null> {
  const thumbKey = mediaThumbKey(id);

  try {
    const stored = await readObjectBuffer(thumbKey);
    if (stored.byteLength > 0) return stored;
  } catch (error) {
    if (error instanceof MediaStorageNotConfiguredError) throw error;
    if (!isObjectNotFoundError(error)) {
      console.error("[media/thumbs] No se pudo leer la miniatura:", error);
    }
  }

  let thumb: Buffer;
  try {
    thumb = await generateThumb(await readObjectBuffer(objectKey));
  } catch (error) {
    if (error instanceof MediaStorageNotConfiguredError) throw error;
    console.error("[media/thumbs] No se pudo generar la miniatura:", error);
    return null;
  }

  try {
    await uploadMediaObject({
      key: thumbKey,
      body: thumb,
      contentType: MEDIA_THUMB_CONTENT_TYPE,
    });
  } catch (error) {
    // La miniatura se sirve aunque no se pueda persistir.
    console.error("[media/thumbs] No se pudo guardar la miniatura:", error);
  }

  return thumb;
}
