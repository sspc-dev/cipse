import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ingrese su nombre."),
  lastname: z.string().trim().min(2, "Ingrese sus apellidos."),
  country: z.string().trim().min(2, "Indique su país."),
  email: z
    .email("Ingrese un correo electrónico válido.")
    .refine(
      (value) => /\.(gob|org)(\.[a-z]{2,})?$/i.test(value.split("@")[1] ?? ""),
      "Use un correo institucional con dominio .gob o .org.",
    ),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
