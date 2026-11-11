import { getAdminSession } from "@/lib/features/auth/actions";
import { attendanceReportQuerySchema } from "@/lib/features/admin/schemas";
import { listAttendanceReportRows } from "@/lib/features/admin/attendance-report-datasource";
import { buildAttendanceReportWorkbook } from "@/lib/features/admin/attendance-report-workbook";

/**
 * Descarga del reporte XLSX de asistencia por día.
 *
 * `?day=YYYY-MM-DD` limita el reporte a ese día; sin el parámetro se genera
 * el consolidado de todos los días.
 *
 * Seguridad: requiere sesión admin; el archivo incluye datos personales de
 * los delegados (correo y teléfono), por lo que no se cachea ni se sirve
 * fuera del panel.
 */

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(request: Request) {
  const admin = await getAdminSession();

  if (!admin) {
    return new Response("No autorizado.", { status: 401 });
  }

  const parsed = attendanceReportQuerySchema.safeParse({
    day: new URL(request.url).searchParams.get("day") ?? undefined,
  });

  if (!parsed.success) {
    return new Response("El día solicitado no es válido.", { status: 400 });
  }

  const day = parsed.data.day;

  try {
    const rows = await listAttendanceReportRows(day);
    const workbook = await buildAttendanceReportWorkbook(rows, { day });
    const body = new Blob([workbook], { type: XLSX_CONTENT_TYPE });
    const filename = day
      ? `cipse-xv-asistencia-${day}.xlsx`
      : "cipse-xv-asistencia-consolidado.xlsx";

    return new Response(body, {
      headers: {
        "Content-Type": XLSX_CONTENT_TYPE,
        "Content-Length": String(workbook.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[reports/attendance] Error al generar el reporte:", error);
    return new Response("No fue posible generar el reporte.", { status: 502 });
  }
}
