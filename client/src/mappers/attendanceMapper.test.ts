import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ApiAttendanceRecord,
  ApiStudent,
} from "../types/api";

import {
  buildAttendanceRows,
  computeStats,
  formatPercent,
} from "./attendanceMapper";

const student = (
  id: string,
  name: string,
): ApiStudent => ({
  id,
  displayName: name,
  username: name.toLowerCase(),
  classroom: {
    id: 1,
    classroomName: "10A",
  },
});

const attendance = (
  id: number,
  studentId: string,
  status: ApiAttendanceRecord["status"],
  checkin: string | null,
): ApiAttendanceRecord => ({
  id,
  studentId,
  studentName: "Test",
  sessionId: null,
  date: "2026-11-18",
  status,
  checkin,
  checkout: null,
  checkoutReason: null,
  checkedOutBy: null,
  description: null,
});

describe("buildAttendanceRows", () => {
  it("übernimmt anwesenden Schüler", () => {
    const rows =
      buildAttendanceRows(
        [
          student(
            "1",
            "Anna Müller",
          ),
        ],
        [
          attendance(
            1,
            "1",
            "ANWESEND",
            "2026-11-18T09:06:14",
          ),
        ],
        "10A",
      );

    expect(rows[0].status)
      .toBe("PRESENT");

    expect(rows[0].checkIn)
      .toBe("09:06");
  });

  it("markiert Schüler ohne Attendance als NOT_RECORDED", () => {
    const rows =
      buildAttendanceRows(
        [
          student(
            "1",
            "Anna Müller",
          ),
        ],
        [],
        "10A",
      );

    expect(rows[0].status)
      .toBe("NOT_RECORDED");
  });

  it("übersetzt VERSPAETET zu LATE", () => {
    const rows =
      buildAttendanceRows(
        [
          student(
            "1",
            "Anna Müller",
          ),
        ],
        [
          attendance(
            1,
            "1",
            "VERSPAETET",
            "2026-11-18T08:15:00",
          ),
        ],
        "10A",
      );

    expect(rows[0].status)
      .toBe("LATE");
  });

  it("nimmt bei mehreren Datensätzen den neuesten", () => {
    const rows =
      buildAttendanceRows(
        [
          student(
            "1",
            "Anna Müller",
          ),
        ],
        [
          attendance(
            1,
            "1",
            "ABWESEND",
            null,
          ),
          attendance(
            2,
            "1",
            "ANWESEND",
            "2026-11-18T09:00:00",
          ),
        ],
        "10A",
      );

    expect(rows[0].status)
      .toBe("PRESENT");
  });

  it("sortiert Schüler alphabetisch", () => {
    const rows =
      buildAttendanceRows(
        [
          student("2", "Ben"),
          student("1", "Anna"),
        ],
        [],
        "10A",
      );

    expect(
      rows.map(
        (row) =>
          row.studentName,
      ),
    ).toEqual([
      "Anna",
      "Ben",
    ]);
  });

  it("nummeriert nach dem Sortieren fortlaufend", () => {
  const rows =
    buildAttendanceRows(
      [
        student("2", "Ben"),
        student("1", "Anna"),
      ],
      [],
      "10A",
    );

  expect(
    rows.map((row) => row.id),
  ).toEqual([1, 2]);
 });
});

describe("computeStats", () => {
  it("zählt nicht erfasste Schüler als fehlend", () => {
    const rows =
      buildAttendanceRows(
        [
          student("1", "A"),
          student("2", "B"),
          student("3", "C"),
        ],
        [
          attendance(
            1,
            "1",
            "ANWESEND",
            "2026-11-18T07:50:00",
          ),
        ],
        "10A",
      );

    expect(
      computeStats(rows),
    ).toEqual({
      total: 3,
      present: 1,
      late: 0,
      absent: 2,
    });
  });

  it("formatiert Prozentwerte", () => {
    expect(
      formatPercent(1, 3),
    ).toBe("33.3 %");

    expect(
      formatPercent(0, 0),
    ).toBe("0 %");
  });

  it("übernimmt die Daten für das Bearbeiten", () => {
    const rows = buildAttendanceRows(
      [student("1", "Anna Müller")],
      [
        {
          ...attendance(
            7,
            "1",
            "VERSPAETET",
            "2026-11-18T08:15:00.123456",
          ),
          checkout: "2026-11-18T09:00:00",
          description: "Arzttermin",
        },
      ],
      "10A",
    );

    expect(rows[0].attendanceId).toBe(7);
    expect(rows[0].description).toBe("Arzttermin");
    expect(rows[0].checkInRaw).toBe(
      "2026-11-18T08:15:00.123456",
    );
    expect(rows[0].checkOutRaw).toBe(
      "2026-11-18T09:00:00",
    );
  });

  it("setzt neue Felder ohne Datensatz auf null", () => {
    const rows = buildAttendanceRows(
      [student("1", "Anna Müller")],
      [],
      "10A",
    );

    expect(rows[0].attendanceId).toBeNull();
    expect(rows[0].description).toBeNull();
    expect(rows[0].checkInRaw).toBeNull();
    expect(rows[0].checkOutRaw).toBeNull();
  });
});
