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

export type AdminUser = {
  id: number;
  name: string;
  email: string;
};
