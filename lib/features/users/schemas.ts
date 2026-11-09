import { z } from "zod";

const nameField = z
  .string()
  .trim()
  .min(2, "Ingrese el nombre completo del acreditador.")
  .max(120, "El nombre no debe exceder 120 caracteres.");

const emailField = z
  .email("Ingrese un correo electrónico válido.")
  .trim()
  .max(254);

const passwordField = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(128);

export const createAdminUserSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const updateAdminUserSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: nameField,
  email: emailField,
});

export const setAdminUserActiveSchema = z.object({
  id: z.coerce.number().int().positive(),
  active: z.boolean(),
});

export const resetAdminUserPasswordSchema = z.object({
  id: z.coerce.number().int().positive(),
  password: passwordField,
});

/** Query string del listado de usuarios: solo paginación. */
export const usersListQuerySchema = z.object({
  p: z.coerce.number().int().min(1).default(1),
});

export type AdminUserListItem = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
};

export type UserActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; field?: "name" | "email" | "password" };
