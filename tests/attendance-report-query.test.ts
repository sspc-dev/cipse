import assert from "node:assert/strict";
import test from "node:test";
import { attendanceReportQuerySchema } from "../lib/features/admin/schemas.ts";

test("attendanceReportQuerySchema acepta un día ISO válido", () => {
  const parsed = attendanceReportQuerySchema.parse({ day: "2026-11-09" });
  assert.equal(parsed.day, "2026-11-09");
});

test("attendanceReportQuerySchema trata el día vacío como consolidado", () => {
  const parsed = attendanceReportQuerySchema.parse({ day: "" });
  assert.equal(parsed.day, undefined);
});

test("attendanceReportQuerySchema permite omitir el día", () => {
  const parsed = attendanceReportQuerySchema.parse({});
  assert.equal(parsed.day, undefined);
});

test("attendanceReportQuerySchema rechaza fechas inválidas", () => {
  assert.equal(
    attendanceReportQuerySchema.safeParse({ day: "09-11-2026" }).success,
    false,
  );
  assert.equal(
    attendanceReportQuerySchema.safeParse({ day: "2026-13-01" }).success,
    false,
  );
  assert.equal(
    attendanceReportQuerySchema.safeParse({ day: "2026-11-09T00:00:00Z" })
      .success,
    false,
  );
});
