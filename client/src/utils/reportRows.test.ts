
import { describe, expect, it } from "vitest";

import type {
  ApiReportRow,
} from "../types/api";

import {
  buildReportCsv,
  buildReportRows,
  formatDateDe,
  getPresetRange,
  reasonLabel,
  validateRange,
} from "./reportRows";

const apiRow = (
  overrides: Partial<ApiReportRow> = {},
): ApiReportRow => ({
  attendanceId: 1,
  date: "2026-11-18",
  studentId: "a",
  studentName: "Anna",
  classId: 1,
  className: "10A",
  status: "ANWESEND",
  checkin: "2026-11-18T08:00:00",
  checkout: null,
  checkoutReason: null,
  checkedOutBy: null,
  ...overrides,
});

describe("getPresetRange", () => {
  it("liefert den heutigen Tag", () => {
    expect(
      getPresetRange("today", "2026-11-20"),
    ).toEqual({
      from: "2026-11-20",
      to: "2026-11-20",
    });
  });

  it("liefert die letzten sieben Tage", () => {
    expect(
      getPresetRange("week", "2026-11-20"),
    ).toEqual({
      from: "2026-11-14",
      to: "2026-11-20",
    });
  });

  it("liefert den aktuellen Monat", () => {
    expect(
      getPresetRange("month", "2026-11-20"),
    ).toEqual({
      from: "2026-11-01",
      to: "2026-11-20",
    });
  });
});

describe("reasonLabel", () => {
  it("übersetzt bekannte Gründe", () => {
    expect(reasonLabel("EARLY_RELEASE"))
      .toBe("Früh entlassen");

    expect(reasonLabel("ETWAS_NEUES"))
      .toBe("ETWAS_NEUES");

    expect(reasonLabel(null))
      .toBeNull();
  });
});

describe("buildReportRows", () => {
  it("sortiert neueste Tage zuerst", () => {
    const rows = buildReportRows([
      apiRow({
        attendanceId: 1,
        date: "2026-11-17",
        studentName: "Anna",
      }),
      apiRow({
        attendanceId: 2,
        date: "2026-11-18",
        studentName: "Ben",
      }),
      apiRow({
        attendanceId: 3,
        date: "2026-11-18",
        studentName: "Anna",
      }),
    ]);

    expect(
      rows.map((row) => row.id),
    ).toEqual([3, 2, 1]);
  });

  it("übersetzt Status, Uhrzeiten und Grund", () => {
    const [row] = buildReportRows([
      apiRow({
        status: "VERSPAETET",
        checkin:
          "2026-11-18T08:15:00.5",
        checkout:
          "2026-11-18T09:00:00",
        checkoutReason: "EARLY_RELEASE",
      }),
    ]);

    expect(row.status).toBe("LATE");
    expect(row.statusLabel).toBe("Verspätet");
    expect(row.checkIn).toBe("08:15");
    expect(row.checkOut).toBe("09:00");
    expect(row.reason).toBe("Früh entlassen");

    expect(
      buildReportRows([
        apiRow({
          status: null,
          checkin: null,
        }),
      ])[0].status,
    ).toBe("NOT_RECORDED");
  });
});

describe("buildReportCsv", () => {
  it("erstellt Kopfzeile und Datenzeile", () => {
    const csv = buildReportCsv(
      buildReportRows([
        apiRow({
          studentName: "Anna Müller",
        }),
      ]),
    );

    const lines = csv.split("\r\n");

    expect(lines[0]).toBe(
      "Datum;Schüler;Klasse;Status;Check-in;Check-out;Grund",
    );

    expect(lines[1]).toBe(
      "18.11.2026;Anna Müller;10A;Anwesend;08:00;;",
    );
  });

  it("maskiert Semikolon und Anführungszeichen", () => {
    const csv = buildReportCsv(
      buildReportRows([
        apiRow({
          studentName: 'Anna; "AJ"',
        }),
      ]),
    );

    expect(csv).toContain(
      '"Anna; ""AJ"""',
    );
  });

  it("schützt vor Formeln in CSV-Zellen", () => {
    const csv = buildReportCsv(
      buildReportRows([
        apiRow({
          studentName: "=1+1",
        }),
      ]),
    );

    expect(csv).toContain(
      ";'=1+1;",
    );
  });
});

describe("Datumsprüfung", () => {
  it("formatiert und validiert Datumswerte", () => {
    expect(
      formatDateDe("2026-11-18"),
    ).toBe("18.11.2026");

    expect(
      validateRange(
        "2026-11-20",
        "2026-11-18",
      ),
    ).toContain("nicht nach");

    expect(
      validateRange(
        "",
        "2026-11-18",
      ),
    ).toContain("angeben");

    expect(
      validateRange(
        "2026-02-31",
        "2026-03-01",
      ),
    ).toContain("gültige");

    expect(
      validateRange(
        "2026-11-18",
        "2026-11-18",
      ),
    ).toBeNull();
  });
});
