import type { RegisterSchema } from "./schema";

export type RegisterAccreditationDto = {
  name: string;
  lastname: string;
  country: string;
  email: string;
};

export type RegisterActionErrorCode =
  | "VALIDATION"
  | "DUPLICATE_EMAIL"
  | "DB_ERROR";

export type RegisterActionResponse =
  | { ok: true; id: number }
  | { ok: false; code: RegisterActionErrorCode; message: string };

export function normalizeRegisterInput(
  input: RegisterSchema,
): RegisterAccreditationDto {
  return {
    name: input.name.trim(),
    lastname: input.lastname.trim(),
    country: input.country.trim(),
    email: input.email.trim().toLowerCase(),
  };
}
