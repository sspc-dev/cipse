import type { RegisterSchema } from "./schema";
import type { EmailDelivery } from "./email";

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
  | {
      ok: true;
      id: number;
      accessCode: string;
      emailDelivery: EmailDelivery;
    }
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
