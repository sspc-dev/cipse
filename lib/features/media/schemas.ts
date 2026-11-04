import { z } from "zod";
import { MULTIMEDIA_DAYS } from "./days";

const dayValues = MULTIMEDIA_DAYS.map((item) => item.value);

const mediaDaySchema = z.coerce
  .number()
  .int()
  .refine((value) => dayValues.includes(value as (typeof dayValues)[number]), {
    message: "Seleccione un día válido del congreso.",
  });

const mediaTitleSchema = z
  .string()
  .trim()
  .min(2, "Describa el archivo con al menos 2 caracteres.")
  .max(160, "La descripción no debe exceder 160 caracteres.");

export const mediaUploadSchema = z.object({
  day: mediaDaySchema,
  title: mediaTitleSchema,
});

export const mediaUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  day: mediaDaySchema,
  title: mediaTitleSchema,
});

export const mediaIdSchema = z.coerce.number().int().positive();
