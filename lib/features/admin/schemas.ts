import { z } from "zod";

export const adminListQuerySchema = z.object({
  p: z.coerce.number().int().min(1).default(1),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type AdminListQuery = {
  page: number;
  pageSize: number;
  search?: string;
};
