import { z } from "zod";

export const adminListQuerySchema = z.object({
  p: z.coerce.number().int().min(1).default(1),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
  /** Filtro exacto por país: valor almacenado (código ISO o nombre legacy). */
  country: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),
  /** Filtro de asistencia basado en attendance_records. */
  attendance: z.enum(["today", "never"]).optional(),
});

export type AdminListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  attendance?: "today" | "never";
};
