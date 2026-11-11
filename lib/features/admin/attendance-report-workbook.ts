import ExcelJS from "exceljs";
import { CONGRESS_TIME_ZONE } from "../../constants.ts";
import { countryDisplayName } from "../register/data/countries.ts";
import {
  groupAttendanceByDay,
  reportDayDate,
  reportDayLabel,
  summarizeAttendance,
  type AttendanceReportRow,
} from "./attendance-report.ts";

const SHEET_NAME = "Asistencia por día";
const COLUMN_COUNT = 5;

const HEADERS = [
  "Nombre completo",
  "País",
  "Correo electrónico",
  "Teléfono",
  "Fecha de asistencia",
] as const;

const OLIVE = "FF1D4B44";
const SAND = "FFF3EADB";
const GOLD = "FFB8892F";
const INK = "FF1F2A2E";
const MUTED = "FF6B7478";

const generatedFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: CONGRESS_TIME_ZONE,
});

function fullName(row: AttendanceReportRow): string {
  return `${row.name} ${row.lastname}`.trim();
}

/**
 * Genera el libro XLSX del reporte: una fila por asistencia agrupada por día,
 * con total por día, total general y desglose de delegados únicos. Con `day`
 * el reporte se limita a ese día calendario (YYYY-MM-DD). El país se imprime
 * con su nombre completo en español (códigos ISO y valores legacy).
 */
export async function buildAttendanceReportWorkbook(
  rows: AttendanceReportRow[],
  options: { day?: string } = {},
): Promise<Uint8Array<ArrayBuffer>> {
  const day = options.day;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CIPSE XV";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(SHEET_NAME, {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  sheet.columns = [
    { key: "name", width: 36 },
    { key: "country", width: 24 },
    { key: "email", width: 36 },
    { key: "phone", width: 18 },
    { key: "date", width: 18 },
  ];

  sheet.mergeCells(1, 1, 1, COLUMN_COUNT);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = day
    ? `CIPSE XV · Reporte de asistencia · ${reportDayLabel(day)}`
    : "CIPSE XV · Reporte de asistencia por día";
  titleCell.font = { bold: true, size: 15, color: { argb: INK } };
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 24;

  sheet.mergeCells(2, 1, 2, COLUMN_COUNT);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = `${day ? "Asistencias del día seleccionado" : "Consolidado de todos los días"} · Generado el ${generatedFormatter.format(new Date())} · Zona horaria del congreso: Ciudad de México`;
  subtitleCell.font = { size: 10, color: { argb: MUTED } };

  const headerRow = sheet.getRow(4);
  HEADERS.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: OLIVE },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: GOLD } } };
  });
  headerRow.height = 22;

  let cursor = 5;

  for (const day of groupAttendanceByDay(rows)) {
    sheet.mergeCells(cursor, 1, cursor, COLUMN_COUNT);
    const dayCell = sheet.getCell(cursor, 1);
    dayCell.value = reportDayLabel(day.day);
    dayCell.font = { bold: true, size: 11, color: { argb: OLIVE } };
    dayCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: SAND },
    };
    dayCell.alignment = { vertical: "middle" };
    sheet.getRow(cursor).height = 20;
    cursor += 1;

    for (const row of day.rows) {
      const dataRow = sheet.getRow(cursor);
      dataRow.getCell(1).value = fullName(row);
      dataRow.getCell(2).value = countryDisplayName(row.country, "es");
      dataRow.getCell(3).value = row.email;
      const phoneCell = dataRow.getCell(4);
      phoneCell.value = row.phone;
      phoneCell.numFmt = "@";
      const dateCell = dataRow.getCell(5);
      dateCell.value = reportDayDate(day.day);
      dateCell.numFmt = "dd/mm/yyyy";
      dataRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: "middle" };
      });
      cursor += 1;
    }

    sheet.mergeCells(cursor, 1, cursor, COLUMN_COUNT);
    const dayTotalCell = sheet.getCell(cursor, 1);
    dayTotalCell.value = `Total del día: ${day.rows.length} ${
      day.rows.length === 1 ? "asistencia" : "asistencias"
    }`;
    dayTotalCell.font = { bold: true, size: 10, color: { argb: INK } };
    dayTotalCell.alignment = { horizontal: "right", vertical: "middle" };
    dayTotalCell.border = {
      top: { style: "thin", color: { argb: GOLD } },
    };
    cursor += 2;
  }

  if (rows.length === 0) {
    sheet.mergeCells(cursor, 1, cursor, COLUMN_COUNT);
    const emptyCell = sheet.getCell(cursor, 1);
    emptyCell.value = "Sin asistencias registradas.";
    emptyCell.font = { size: 10, color: { argb: MUTED } };
    emptyCell.alignment = { vertical: "middle" };
    cursor += 2;
  }

  const summary = summarizeAttendance(rows);

  sheet.mergeCells(cursor, 1, cursor, COLUMN_COUNT);
  const grandTotalCell = sheet.getCell(cursor, 1);
  grandTotalCell.value = day
    ? `Total de asistencias del día: ${summary.total}`
    : `Total general de asistencias: ${summary.total}`;
  grandTotalCell.font = {
    bold: true,
    size: 12,
    color: { argb: "FFFFFFFF" },
  };
  grandTotalCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: OLIVE },
  };
  grandTotalCell.alignment = { vertical: "middle", horizontal: "right" };
  sheet.getRow(cursor).height = 24;
  cursor += 1;

  sheet.mergeCells(cursor, 1, cursor, COLUMN_COUNT);
  const breakdownCell = sheet.getCell(cursor, 1);
  breakdownCell.value = day
    ? `Delegados únicos: ${summary.uniqueDelegates}`
    : `Delegados únicos: ${summary.uniqueDelegates} · Días con asistencia: ${summary.daysWithAttendance}`;
  breakdownCell.font = { size: 10, color: { argb: MUTED } };
  breakdownCell.alignment = { vertical: "middle", horizontal: "right" };

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(new Uint8Array(buffer));
  return bytes;
}
