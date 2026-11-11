import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { buildAttendanceReportWorkbook } from "../lib/features/admin/attendance-report-workbook.ts";
import type { AttendanceReportRow } from "../lib/features/admin/attendance-report.ts";

const MX_ROW: AttendanceReportRow = {
  accreditationId: 1,
  name: "Ana",
  lastname: "Pérez",
  country: "MX",
  email: "ana@example.com",
  phone: "5555555555",
  attendedOn: "2026-11-10",
};

async function readCountryCell(rows: AttendanceReportRow[]): Promise<string> {
  const bytes = await buildAttendanceReportWorkbook(rows);
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(bytes.buffer);

  const sheet = workbook.getWorksheet("Asistencia por día");
  assert.ok(sheet, "el libro debe incluir la hoja del reporte");

  let countryCell = "";

  sheet.eachRow((row) => {
    if (row.getCell(1).value === "Ana Pérez") {
      countryCell = String(row.getCell(2).value ?? "");
    }
  });

  return countryCell;
}

test("el reporte imprime el nombre completo del país para códigos ISO", async () => {
  assert.equal(await readCountryCell([MX_ROW]), "México");
});

test("el reporte conserva los nombres de país legacy", async () => {
  assert.equal(
    await readCountryCell([{ ...MX_ROW, country: "Costa Rica" }]),
    "Costa Rica",
  );
});
