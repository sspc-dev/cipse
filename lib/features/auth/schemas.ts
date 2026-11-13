import { z } from "zod";

export const credentialsSchema = z.object({
  email: z
    .email("Ingrese su correo electrónico institucional.")
    .trim()
    .max(254),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(128),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const mediaAccessSchema = z.object({
  email: z
    .email("Ingrese el correo con el que se registró.")
    .trim()
    .max(254),
  accessCode: z
    .string()
    .trim()
    .min(16, "El código de la credencial no es válido.")
    .max(64, "El código de la credencial no es válido.")
    .regex(/^[a-zA-Z0-9]+$/, "El código de la credencial no es válido."),
});

export type MediaAccess = z.infer<typeof mediaAccessSchema>;

export type AdminUser = {
  id: number;
  name: string;
  email: string;
};

export type AccreditedMediaUser = {
  id: number;
  name: string;
  lastname: string;
  email: string;
};
