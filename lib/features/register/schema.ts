import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";

export type RegisterValidationMessages = Dictionary["register"]["errors"];

/** Esquema con mensajes en el idioma activo: cliente y servidor comparten
 * las mismas reglas, cada uno con su diccionario. */
export function createRegisterSchema(messages: RegisterValidationMessages) {
  return z.object({
    name: z.string().trim().min(2, messages.name),
    lastname: z.string().trim().min(2, messages.lastname),
    country: z.string().trim().min(2, messages.country),
    email: z
      .email(messages.email)
      .refine(
        (value) => /\.(gob|org)(\.[a-z]{2,})?$/i.test(value.split("@")[1] ?? ""),
        messages.emailDomain,
      ),
  });
}

export type RegisterSchema = z.infer<ReturnType<typeof createRegisterSchema>>;
