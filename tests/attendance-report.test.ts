/**
 * Pruebas del modelo puro del reporte de asistencia por día (node:test).
 *
 * Cubre la agrupación por día, los totales del reporte y la etiqueta de
 * fecha independiente del huso del servidor.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  groupAttendanceByDay,
  reportDayDate,
  reportDayLabel,
  summarizeAttendance,
  type AttendanceReportRow,
} from "../lib/features/admin/attendance-report.ts";

function row(
  overrides: Partial<AttendanceReportRow> & Pick<AttendanceReportRow, "accreditationId" | "attendedOn">,
): AttendanceReportRow {
  return {
    name: "Nombre",
    lastname: "Apellido",
    country: "MX",
    email: "delegado@example.test",
    phone: "5555555555",
    ...overrides,
  };
}

test("groupAttendanceByDay agrupa por fecha y ordena los días", () => {
  const rows = [
    row({ accreditationId: 1, attendedOn: "2026-11-11", lastname: "B" }),
    row({ accreditationId: 2, attendedOn: "2026-11-09", lastname: "A" }),
    row({ accreditationId: 3, attendedOn: "2026-11-11", lastname: "C" }),
  ];

  const days = groupAttendanceByDay(rows);

  assert.deepEqual(
    days.map((day) => day.day),
    ["2026-11-09", "2026-11-11"],
  );
  assert.equal(days[0].rows.length, 1);
  assert.equal(days[1].rows.length, 2);
  // Conserva el orden de entrada dentro del mismo día.
  assert.deepEqual(
    days[1].rows.map((entry) => entry.accreditationId),
    [1, 3],
  );
});

test("summarizeAttendance cuenta asistencias, delegados únicos y días", () => {
  const rows = [
    row({ accreditationId: 1, attendedOn: "2026-11-09" }),
    row({ accreditationId: 1, attendedOn: "2026-11-10" }),
    row({ accreditationId: 2, attendedOn: "2026-11-10" }),
  ];

  assert.deepEqual(summarizeAttendance(rows), {
    total: 3,
    uniqueDelegates: 2,
    daysWithAttendance: 2,
  });
});

test("summarizeAttendance con lista vacía devuelve ceros", () => {
  assert.deepEqual(summarizeAttendance([]), {
    total: 0,
    uniqueDelegates: 0,
    daysWithAttendance: 0,
  });
});

test("reportDayLabel usa el día calendario sin desplazarse por huso", () => {
  assert.equal(
    reportDayLabel("2026-11-11"),
    "Miércoles, 11 de noviembre de 2026",
  );
});

test("reportDayDate ancla la fecha al mediodía UTC", () => {
  assert.equal(
    reportDayDate("2026-11-11").toISOString(),
    "2026-11-11T12:00:00.000Z",
  );
});
