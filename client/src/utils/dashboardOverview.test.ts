
import { describe, expect, it } from "vitest";

import type {
  ApiReportRow,
  ApiStudent,
} from "../types/api";

import {
  buildClassOverview,
  buildWeeklyOverview,
  getRecentCheckins,
} from "./dashboardOverview";

const students: ApiStudent[] = [
  {
    id: "1",
    username: "anna",
    displayName: "Anna Weber",
    classroom: {
      id: 1,
      classroomName: "10A",
    },
  },
  {
    id: "2",
    username: "ben",
    displayName: "Ben Koch",
    classroom: {
      id: 1,
      classroomName: "10A",
    },
  },
];

const createRecord = (
  overrides: Partial<ApiReportRow> = {},
): ApiReportRow => ({
  attendanceId: 1,
  date: "2026-11-20",
  studentId: "1",
  studentName: "Anna Weber",
  classId: 1,
  className: "10A",
  status: "VERSPAETET",
  checkin: "2026-11-20T08:30:00",
  checkout: null,
  checkoutReason: null,
  checkedOutBy: null,
  ...overrides,
});

describe("dashboardOverview", () => {
  it("erstellt Klassenwerte aus den Backend-Daten", () => {
    const result = buildClassOverview(
      ["10A"],
      students,
      [createRecord()],
      "2026-11-20",
    );

    expect(result[0].students).toBe(2);
    expect(result[0].records).toBe(1);
    expect(result[0].checkedIn).toBe(1);
    expect(result[0].late).toBe(1);
  });

  it("erfindet keine Datensätze bei fehlender Session", () => {
    const result = buildClassOverview(
      ["10A"],
      students,
      [],
      "2026-11-20",
    );

    expect(result[0].records).toBe(0);
    expect(result[0].checkedIn).toBe(0);
  });

  it("berechnet sieben Tage mit korrekter Quote", () => {
    const days = buildWeeklyOverview(
      [
        createRecord(),
        createRecord({
          attendanceId: 2,
          studentId: "2",
          checkin: null,
          status: "ABWESEND",
        }),
      ],
      "2026-11-20",
    );

    expect(days).toHaveLength(7);
    expect(days[6].checkedIn).toBe(1);
    expect(days[6].records).toBe(2);
    expect(days[6].percentage).toBe(50);
    expect(days[0].records).toBe(0);
  });

  it("sortiert Check-ins nach Zeit", () => {
    const result = getRecentCheckins(
      [
        createRecord(),
        createRecord({
          attendanceId: 2,
          studentId: "2",
          checkin: "2026-11-20T09:15:00",
        }),
      ],
      "2026-11-20",
    );

    expect(result[0].attendanceId).toBe(2);
    expect(result[1].attendanceId).toBe(1);
  });
});
