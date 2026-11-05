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
    institution: z.string().trim().min(2, messages.institution),
    position: z.string().trim().min(2, messages.position),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^[+()\-\s\d]{7,20}$/.test(value),
        messages.phone,
      ),
    email: z.email(messages.email),
  });
}

export type RegisterSchema = z.infer<ReturnType<typeof createRegisterSchema>>;
