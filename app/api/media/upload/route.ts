import { randomUUID } from "node:crypto";
import { getAdminSession } from "@/lib/features/auth/actions";
import { insertEventMedia } from "@/lib/features/media/datasource";
import { mediaUploadSchema } from "@/lib/features/media/schemas";
import {
  deleteMediaObject,
  isMediaStorageConfigured,
  MediaStorageNotConfiguredError,
  uploadMediaObject,
} from "@/lib/features/media/storage";
import {
  MAX_MEDIA_BYTES,
  mediaKindFromMime,
} from "@/lib/features/media/types";


const MAX_ORIGINAL_NAME_LENGTH = 255;

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";

  const extension = name
    .slice(dot + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  return extension ? `.${extension}` : "";
}

function jsonError(message: string, status: number) {
  return Response.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const admin = await getAdminSession();

  if (!admin) {
    return jsonError(
      "La sesión expiró. Inicie sesión de nuevo para continuar.",
      401,
    );
  }

  if (!isMediaStorageConfigured()) {
    return jsonError(
      "El almacenamiento OCI no está configurado. Defina OCI_REGION, OCI_NAMESPACE, OCI_BUCKET y las credenciales de firma.",
      503,
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("No se pudo leer el formulario de carga.", 400);
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Seleccione un archivo para subir.", 400);
  }

  if (file.size > MAX_MEDIA_BYTES) {
    return jsonError(
      `El archivo supera el límite de ${Math.round(MAX_MEDIA_BYTES / (1024 * 1024))} MB.`,
      413,
    );
  }

  const kind = mediaKindFromMime(file.type);

  if (!kind) {
    return jsonError(
      "Formato no permitido. Use imágenes (JPG, PNG, WEBP, GIF), videos (MP4, WEBM, MOV) o documentos (PDF, Office, TXT).",
      415,
    );
  }

  const originalName = file.name.slice(0, MAX_ORIGINAL_NAME_LENGTH) || "archivo";
  const fallbackTitle = originalName.replace(/\.[^.]+$/, "");

  const parsed = mediaUploadSchema.safeParse({
    day: String(formData.get("day") ?? ""),
    title: String(formData.get("title") ?? "").trim() || fallbackTitle,
  });

  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Revise los datos del archivo.",
      400,
    );
  }

  const objectKey = `multimedia/dia-${parsed.data.day}/${randomUUID()}${fileExtension(originalName)}`;

  try {
    await uploadMediaObject({
      key: objectKey,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
  } catch (error) {
    if (error instanceof MediaStorageNotConfiguredError) {
      return jsonError(
        "El almacenamiento OCI no está configurado. No se subió el archivo.",
        503,
      );
    }
    console.error("[media/upload] Error al subir a OCI:", error);
    return jsonError(
      "No fue posible subir el archivo al almacenamiento. Intente de nuevo.",
      502,
    );
  }

  try {
    const id = await insertEventMedia({
      day: parsed.data.day,
      kind,
      title: parsed.data.title,
      originalName,
      mime: file.type,
      sizeBytes: file.size,
      objectKey,
      createdBy: admin.id,
    });

    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("[media/upload] Error al registrar metadatos:", error);

    try {
      await deleteMediaObject(objectKey);
    } catch (cleanupError) {
      console.error(
        "[media/upload] No se pudo revertir el objeto subido:",
        cleanupError,
      );
    }

    return jsonError(
      "El archivo se subió pero no se pudo registrar. Intente de nuevo.",
      500,
    );
  }
}
