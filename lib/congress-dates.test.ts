/**
 * Pruebas del día de negocio del congreso (CDMX) — node:test, sin dependencias.
 *
 * Escenarios obligatorios:
 *  1. 2026-11-09 18:44:31 CDMX → attended_on 2026-11-09.
 *  2. 2026-11-09 23:59:59 CDMX → attended_on 2026-11-09.
 *  3. 2026-11-10 00:00:01 CDMX → attended_on 2026-11-10.
 *  4. Independencia de la zona horaria del servidor.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  congressTodayIso,
  isoDayInCongressTime,
  shiftCongressDay,
} from "./congress-dates.ts";

test("1. registro 2026-11-09 18:44:31 CDMX → attended_on 2026-11-09", () => {
  const instant = new Date("2026-11-09T18:44:31-06:00");
  assert.equal(isoDayInCongressTime(instant), "2026-11-09");

  // El caso real de la incidencia: el instante 00:44:31 UTC del 10-nov es
  // 18:44:31 CDMX del 9-nov; attended_at conserva el instante exacto.
  assert.equal(instant.toISOString(), "2026-11-10T00:44:31.000Z");
  assert.equal(isoDayInCongressTime(new Date(instant.toISOString())), "2026-11-09");
});

test("2. registro 2026-11-09 23:59:59 CDMX → attended_on 2026-11-09", () => {
  const instant = new Date("2026-11-09T23:59:59-06:00");
  assert.equal(isoDayInCongressTime(instant), "2026-11-09");
});

test("3. registro 2026-11-10 00:00:01 CDMX → attended_on 2026-11-10", () => {
  const instant = new Date("2026-11-10T00:00:01-06:00");
  assert.equal(isoDayInCongressTime(instant), "2026-11-10");
});

test("4. el resultado no depende de la zona horaria del proceso", () => {
  const script = [
    'import { isoDayInCongressTime } from "./lib/congress-dates.ts";',
    'console.log(isoDayInCongressTime(new Date("2026-11-09T18:44:31-06:00")));',
    'console.log(isoDayInCongressTime(new Date("2026-11-09T23:59:59-06:00")));',
    'console.log(isoDayInCongressTime(new Date("2026-11-10T00:00:01-06:00")));',
  ].join("\n");

  const expected = ["2026-11-09", "2026-11-09", "2026-11-10"].join("\n");

  for (const tz of [
    "UTC",
    "Europe/Madrid",
    "Pacific/Honolulu",
    "Asia/Tokyo",
    "America/Mexico_City",
  ]) {
    const output = execFileSync(
      process.execPath,
      ["--input-type=module", "-e", script],
      {
        env: { ...process.env, TZ: tz },
        encoding: "utf8",
        cwd: process.cwd(),
      },
    );
    assert.equal(output.trim(), expected, `TZ=${tz} produjo otra fecha`);
  }
});

test("shiftCongressDay desplaza días calendario sin saltos", () => {
  assert.equal(shiftCongressDay("2026-11-09", -6), "2026-11-03");
  assert.equal(shiftCongressDay("2026-11-09", 0), "2026-11-09");
  assert.equal(shiftCongressDay("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftCongressDay("2027-03-01", -1), "2027-02-28");
});

test("congressTodayIso coincide con el día de México en este instante", () => {
  const expected = isoDayInCongressTime(new Date());
  assert.equal(congressTodayIso(), expected);
  assert.match(congressTodayIso(), /^\d{4}-\d{2}-\d{2}$/);
});
