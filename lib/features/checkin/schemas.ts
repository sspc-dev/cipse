import { z } from "zod";

export const accessCodeSchema = z
  .string()
  .trim()
  .min(16, "Código de acceso inválido.")
  .max(64, "Código de acceso inválido.")
  .regex(/^[a-zA-Z0-9]+$/, "Código de acceso inválido.");
