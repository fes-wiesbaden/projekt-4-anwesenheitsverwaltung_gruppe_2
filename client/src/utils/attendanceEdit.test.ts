
import { describe, expect, it } from "vitest";

import type { AttendanceRow } from "../types/attendance";

import {
  buildUpdateBody,
  toFormValues,
  validateEdit,
} from "./attendanceEdit";

// Beispiel aus unserem Schulprojekt
const row: AttendanceRow = {
  id: 1,
  studentId: "student-1",
  studentName: "Lina Weber",
  classroom: "10A",
  status: "LATE",
  checkIn: "16:24",
  checkOut: "16:29",
  attendanceId: 54,
  description: "Test",
  checkInRaw: "2026-11-18T16:24:58.021646",
  checkOutRaw: "2026-11-18T16:29:56.297015",
};

describe("toFormValues", () => {
  it("übernimmt die vorhandenen Daten", () => {
    expect(toFormValues(row)).toEqual({
      status: "LATE",
      checkIn: "16:24",
      checkOut: "16:29",
      description: "Test",
    });
  });

  it("verwendet Anzeigezeiten ohne Rohzeiten", () => {
    const result = toFormValues({
      ...row,
      checkInRaw: null,
      checkOutRaw: null,
    });

    expect(result.checkIn).toBe("16:24");
    expect(result.checkOut).toBe("16:29");
  });
});

describe("buildUpdateBody", () => {
  it("erhält unveränderte Sekunden und Mikrosekunden", () => {
    const body = buildUpdateBody(
      row,
      "2026-11-18",
      toFormValues(row),
    );

    expect(body).toEqual({
      checkin: "2026-11-18T16:24:58.021646",
      checkout: "2026-11-18T16:29:56.297015",
      status: "VERSPAETET",
      description: "Test",
    });
  });

  it("ändert nur die bearbeitete Check-in-Zeit", () => {
    const values = {
      ...toFormValues(row),
      checkIn: "16:25",
    };

    const body = buildUpdateBody(
      row,
      "2026-11-18",
      values,
    );

    expect(body.checkin).toBe(
      "2026-11-18T16:25:00",
    );

    expect(body.checkout).toBe(
      "2026-11-18T16:29:56.297015",
    );
  });

  it("übersetzt den Status und bereinigt die Beschreibung", () => {
    const values = {
      ...toFormValues(row),
      status: "PRESENT" as const,
      description: "  Arzttermin  ",
    };

    const body = buildUpdateBody(
      row,
      "2026-11-18",
      values,
    );

    expect(body.status).toBe("ANWESEND");
    expect(body.description).toBe("Arzttermin");
  });

  it("verbietet die Bearbeitung ohne Datensatz-ID", () => {
    expect(() =>
      buildUpdateBody(
        { ...row, attendanceId: null },
        "2026-11-18",
        toFormValues(row),
      ),
    ).toThrow("Kein Anwesenheitsdatensatz");
  });

  it("lehnt ein ungültiges Datumsformat ab", () => {
    expect(() =>
      buildUpdateBody(
        row,
        "18.11.2026",
        toFormValues(row),
      ),
    ).toThrow("Ungültiges Datum");
  });
});

describe("validateEdit", () => {
  it("akzeptiert gültige Zeiten", () => {
    expect(
      validateEdit(toFormValues(row)),
    ).toBeNull();
  });

  it("lehnt ungültige Uhrzeiten ab", () => {
    const values = {
      ...toFormValues(row),
      checkIn: "25:00",
    };

    expect(validateEdit(values)).toContain("HH:mm");
  });

  it("verhindert Check-out vor Check-in", () => {
    const values = {
      ...toFormValues(row),
      checkIn: "16:30",
      checkOut: "16:00",
    };

    expect(validateEdit(values)).toContain(
      "nicht vor dem Check-in",
    );
  });

  it("verlangt Check-in vor dem Check-out", () => {
    const values = {
      ...toFormValues(row),
      checkIn: "",
      checkOut: "16:29",
    };

    expect(validateEdit(values)).toContain(
      "Check-in benötigt",
    );
  });
});
