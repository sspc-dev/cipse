"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/features/auth/actions";
import { deleteEventMediaRow, findEventMediaById } from "./datasource";
import { mediaIdSchema } from "./schemas";
import {
  deleteMediaObject,
  isObjectNotFoundError,
  MediaStorageNotConfiguredError,
} from "./storage";

export type DeleteMediaResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function deleteEventMediaAction(
  input: unknown,
): Promise<DeleteMediaResult> {
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
    await deleteEventMediaRow(media.id);
  } catch (error) {
    console.error("[deleteEventMediaAction] Error al borrar registro:", error);
    return {
      ok: false,
      message:
        "El archivo se eliminó del almacenamiento, pero no del registro. Actualice e intente de nuevo.",
    };
  }

  revalidatePath("/admin/multimedia");
  revalidatePath("/multimedia");
  return { ok: true, message: "Archivo eliminado." };
}
