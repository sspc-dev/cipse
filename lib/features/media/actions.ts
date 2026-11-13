"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/features/auth/actions";
import {
  deleteEventMediaRow,
  findEventMediaById,
  updateEventMedia,
} from "./datasource";
import { mediaIdSchema, mediaUpdateSchema } from "./schemas";
import {
  deleteMediaObject,
  isObjectNotFoundError,
  MediaStorageNotConfiguredError,
} from "./storage";
import { mediaThumbKey } from "./thumb-key";

export type MediaActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function deleteEventMediaAction(
  input: unknown,
): Promise<MediaActionResult> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      message: "La sesión expiró. Inicie sesión de nuevo para continuar.",
    };
  }

  const parsed = mediaIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Archivo no válido." };
  }

  const media = await findEventMediaById(parsed.data);
  if (!media) {
    return { ok: false, message: "El archivo ya no existe." };
  }

  try {
    await deleteMediaObject(media.objectKey);
  } catch (error) {
    if (error instanceof MediaStorageNotConfiguredError) {
      console.error("[deleteEventMediaAction]", error.message);
      return {
        ok: false,
        message:
          "No se puede eliminar: el almacenamiento OCI no está configurado.",
      };
    }
    if (!isObjectNotFoundError(error)) {
      console.error("[deleteEventMediaAction] Error al borrar objeto:", error);
      return {
        ok: false,
        message:
          "No fue posible eliminar el archivo del almacenamiento. Intente de nuevo.",
      };
    }
  }

  try {
    // La miniatura es un derivado prescindible: si no existe o falla el
    // borrado, no se bloquea la eliminación del archivo.
    await deleteMediaObject(mediaThumbKey(media.id));
  } catch (error) {
    if (
      !isObjectNotFoundError(error) &&
      !(error instanceof MediaStorageNotConfiguredError)
    ) {
      console.error("[deleteEventMediaAction] Error al borrar miniatura:", error);
    }
  }

  try {
    await deleteEventMediaRow(media.id);
  } catch (error) {
    console.error("[deleteEventMediaAction] Error al borrar registro:", error);
    return {
      ok: false,
      message:
        "El archivo se eliminó del almacenamiento, pero no del registro. Actualice e intente de nuevo.",
    };
  }

  revalidatePath("/dashboard/multimedia");
  revalidatePath("/multimedia");
  return { ok: true, message: "Archivo eliminado." };
}

export async function updateEventMediaAction(
  input: unknown,
): Promise<MediaActionResult> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      message: "La sesión expiró. Inicie sesión de nuevo para continuar.",
    };
  }

  const parsed = mediaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revise los datos del archivo.",
    };
  }

  const media = await findEventMediaById(parsed.data.id);
  if (!media) {
    return { ok: false, message: "El archivo ya no existe." };
  }

  try {
    await updateEventMedia(parsed.data);
  } catch (error) {
    console.error("[updateEventMediaAction] Error al actualizar:", error);
    return {
      ok: false,
      message: "No fue posible actualizar el archivo. Intente de nuevo.",
    };
  }

  revalidatePath("/dashboard/multimedia");
  revalidatePath("/multimedia");
  return { ok: true, message: "Archivo actualizado." };
}
