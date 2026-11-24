
import { describe, expect, it } from "vitest";

import type {
  ApiStudent,
  ApiTimetableEntry,
} from "../types/api";

import {
  buildClassSummaries,
  formatTimeRange,
  sortTimetable,
} from "./classSummary";

const student = (
  id: string,
  className: string,
): ApiStudent => ({
  id,
  displayName: id,
  username: id,
  classroom: {
    id: 1,
    classroomName: className,
    room: {
      id: 1,
      roomName: "Klassenraum 101",
      roomNumber: "R101",
    },
  },
});

const entry = (
  day: string,
): ApiTimetableEntry => ({
  id: 1,
  classroomId: 1,
  classroomName: "10A",
  dayOfWeek: day,
  startTime: "07:30:00",
  checkoutTime: "18:00:00",
});

describe("buildClassSummaries", () => {
  it("zählt Schüler und übernimmt Klasseninformationen", () => {
    const result = buildClassSummaries(
      ["10A"],
      [
        student("a", "10A"),
        student("b", "10A"),
      ],
    );

    expect(result[0]).toEqual({
      name: "10A",
      id: 1,
      roomLabel: "Klassenraum 101 (R101)",
      studentCount: 2,
    });
  });

  it("behandelt Klassen ohne sichtbare Schüler", () => {
    const result = buildClassSummaries(
      ["10B"],
      [student("a", "10A")],
    );

    expect(result[0]).toEqual({
      name: "10B",
      id: null,
      roomLabel: "Nicht angegeben",
      studentCount: 0,
    });
  });
});

describe("Stundenplan-Hilfsfunktionen", () => {
  it("sortiert Einträge nach Wochentag", () => {
    const result = sortTimetable([
      entry("WEDNESDAY"),
      entry("MONDAY"),
    ]);

    expect(
      result.map((item) => item.dayOfWeek),
    ).toEqual([
      "MONDAY",
      "WEDNESDAY",
    ]);
  });

  it("formatiert die Unterrichtszeit", () => {
    expect(
      formatTimeRange(entry("MONDAY")),
    ).toBe("07:30 – 18:00 Uhr");
  });
});
